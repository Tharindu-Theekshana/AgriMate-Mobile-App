import { eq } from 'drizzle-orm';

import { farmApi, cropApi, scanApi, treatmentApi } from '@/api/endpoints';
import { db } from '@/db';
import { crops, farms, treatments } from '@/db/schema';
import { refreshDiseases } from '@/data/diseases';
import { cacheScans } from '@/data/scans';
import { isOnline } from '@/net/online';
import { uuid } from '@/utils/uuid';

let syncing = false;

/**
 * Reconcile local SQLite with the backend. Safe to call often — it no-ops when
 * offline or already running. Order: push local changes, then pull server state.
 */
export async function syncNow(isAuthenticated: boolean): Promise<void> {
  if (syncing || !(await isOnline())) return;
  syncing = true;
  try {
    if (isAuthenticated) {
      await pushFarms();
      await pushCrops();
      await pushTreatments();
      await pullFarms();
      await pullCrops();
      await pullTreatments();
      await pullScans();
    }
    // Knowledge base syncs for everyone (guests included).
    await refreshDiseases().catch(() => undefined);
  } finally {
    syncing = false;
  }
}

// ---- push ----

async function pushFarms(): Promise<void> {
  const rows = await db.select().from(farms);
  for (const r of rows) {
    try {
      if (r.syncState === 'pending_create') {
        const created = await farmApi.create(farmBody(r));
        await db.update(farms).set({ serverId: created.id, syncState: 'synced' }).where(eq(farms.id, r.id));
        // Propagate the new server farm id to its crops.
        await db.update(crops).set({ serverFarmId: created.id }).where(eq(crops.farmId, r.id));
      } else if (r.syncState === 'pending_update' && r.serverId != null) {
        await farmApi.update(r.serverId, farmBody(r));
        await db.update(farms).set({ syncState: 'synced' }).where(eq(farms.id, r.id));
      } else if (r.syncState === 'pending_delete') {
        if (r.serverId != null) await farmApi.remove(r.serverId);
        await db.delete(farms).where(eq(farms.id, r.id));
        await db.delete(crops).where(eq(crops.farmId, r.id));
      }
    } catch {
      /* leave pending; retry next sync */
    }
  }
}

async function pushCrops(): Promise<void> {
  const rows = await db.select().from(crops);
  for (const r of rows) {
    try {
      // Ensure the crop knows its server farm id (farm may have synced after the crop was created offline).
      let serverFarmId = r.serverFarmId;
      if (serverFarmId == null) {
        const fr = await db.select().from(farms).where(eq(farms.id, r.farmId));
        serverFarmId = fr[0]?.serverId ?? null;
        if (serverFarmId != null) await db.update(crops).set({ serverFarmId }).where(eq(crops.id, r.id));
      }

      if (r.syncState === 'pending_create' && serverFarmId != null) {
        const created = await farmApi.addCrop(serverFarmId, cropBody(r));
        await db.update(crops).set({ serverId: created.id, syncState: 'synced' }).where(eq(crops.id, r.id));
        await db.update(treatments).set({ serverCropId: created.id }).where(eq(treatments.cropId, r.id));
      } else if (r.syncState === 'pending_update' && r.serverId != null) {
        await cropApi.update(r.serverId, cropBody(r));
        await db.update(crops).set({ syncState: 'synced' }).where(eq(crops.id, r.id));
      } else if (r.syncState === 'pending_delete') {
        if (r.serverId != null) await cropApi.remove(r.serverId);
        await db.delete(crops).where(eq(crops.id, r.id));
        await db.delete(treatments).where(eq(treatments.cropId, r.id));
      }
    } catch {
      /* retry next sync */
    }
  }
}

async function pushTreatments(): Promise<void> {
  const rows = await db.select().from(treatments);
  for (const r of rows) {
    try {
      if (r.syncState === 'pending_create' && r.serverCropId != null) {
        const created = await treatmentApi.create(r.serverCropId, {
          productName: r.productName,
          type: r.type as 'FERTILIZER' | 'PESTICIDE',
          quantity: r.quantity ?? undefined,
          appliedDate: r.appliedDate ?? undefined,
        });
        await db.update(treatments).set({ serverId: created.id, syncState: 'synced' }).where(eq(treatments.id, r.id));
      } else if (r.syncState === 'pending_delete') {
        if (r.serverId != null) await treatmentApi.remove(r.serverId);
        await db.delete(treatments).where(eq(treatments.id, r.id));
      }
    } catch {
      /* retry next sync */
    }
  }
}

// ---- pull ----

async function pullFarms(): Promise<void> {
  const serverFarms = await farmApi.list();
  const local = await db.select().from(farms);
  const byServerId = new Map(local.filter((r) => r.serverId != null).map((r) => [r.serverId!, r]));
  const serverIds = new Set(serverFarms.map((f) => f.id));

  for (const sf of serverFarms) {
    const existing = byServerId.get(sf.id);
    if (existing) {
      if (existing.syncState === 'synced') {
        await db
          .update(farms)
          .set({ name: sf.name, category: sf.category ?? 'CROP', latitude: sf.latitude ?? null, longitude: sf.longitude ?? null, sizeAcres: sf.sizeAcres ?? null, soilType: sf.soilType ?? null })
          .where(eq(farms.id, existing.id));
      }
    } else {
      await db.insert(farms).values({
        id: uuid(), serverId: sf.id, name: sf.name, category: sf.category ?? 'CROP', latitude: sf.latitude ?? null,
        longitude: sf.longitude ?? null, sizeAcres: sf.sizeAcres ?? null, soilType: sf.soilType ?? null,
        syncState: 'synced', updatedAt: Date.now(), deleted: false,
      });
    }
  }
  // Drop synced local rows the server no longer has.
  for (const r of local) {
    if (r.serverId != null && r.syncState === 'synced' && !serverIds.has(r.serverId)) {
      await db.delete(farms).where(eq(farms.id, r.id));
    }
  }
}

async function pullCrops(): Promise<void> {
  const localFarms = (await db.select().from(farms)).filter((f) => f.serverId != null);
  for (const f of localFarms) {
    try {
      const serverCrops = await farmApi.crops(f.serverId!);
      const localCrops = await db.select().from(crops).where(eq(crops.farmId, f.id));
      const byServerId = new Map(localCrops.filter((c) => c.serverId != null).map((c) => [c.serverId!, c]));
      for (const sc of serverCrops) {
        const existing = byServerId.get(sc.id);
        const values = {
          cropType: sc.cropType, variety: sc.variety ?? null, season: sc.season ?? null,
          areaAcres: sc.areaAcres ?? null, plantingDate: sc.plantingDate ?? null,
          expectedHarvestDate: sc.expectedHarvestDate ?? null, growthStage: sc.growthStage ?? null,
          status: sc.status ?? 'GROWING', harvestDate: sc.harvestDate ?? null, yieldKg: sc.yieldKg ?? null,
          qualityGrade: sc.qualityGrade ?? null, sellingPrice: sc.sellingPrice ?? null,
        };
        if (existing) {
          if (existing.syncState === 'synced') {
            await db.update(crops).set(values).where(eq(crops.id, existing.id));
          }
        } else {
          await db.insert(crops).values({
            id: uuid(), serverId: sc.id, farmId: f.id, serverFarmId: f.serverId!,
            ...values, syncState: 'synced', updatedAt: Date.now(), deleted: false,
          });
        }
      }
    } catch {
      /* skip this farm's crops this round */
    }
  }
}

async function pullTreatments(): Promise<void> {
  const localCrops = (await db.select().from(crops)).filter((c) => c.serverId != null);
  for (const c of localCrops) {
    try {
      const serverTreatments = await treatmentApi.list(c.serverId!);
      const local = await db.select().from(treatments).where(eq(treatments.cropId, c.id));
      const known = new Set(local.filter((t) => t.serverId != null).map((t) => t.serverId!));
      for (const st of serverTreatments) {
        if (!known.has(st.id)) {
          await db.insert(treatments).values({
            id: uuid(), serverId: st.id, cropId: c.id, serverCropId: c.serverId!,
            productName: st.productName, type: st.type, quantity: st.quantity ?? null,
            appliedDate: st.appliedDate ?? null, syncState: 'synced', updatedAt: Date.now(), deleted: false,
          });
        }
      }
    } catch {
      /* skip this crop's treatments this round */
    }
  }
}

async function pullScans(): Promise<void> {
  try {
    const page = await scanApi.history(undefined, 0, 100);
    await cacheScans(page.content);
  } catch {
    /* keep cached scans */
  }
}

function farmBody(r: typeof farms.$inferSelect) {
  return {
    name: r.name,
    category: r.category as 'CROP' | 'ANIMAL',
    latitude: r.latitude ?? undefined,
    longitude: r.longitude ?? undefined,
    sizeAcres: r.sizeAcres ?? undefined,
    soilType: r.soilType ?? undefined,
  };
}

function cropBody(r: typeof crops.$inferSelect) {
  return {
    variety: r.variety ?? undefined,
    season: (r.season as 'MAHA' | 'YALA' | null) ?? undefined,
    areaAcres: r.areaAcres ?? undefined,
    plantingDate: r.plantingDate ?? undefined,
    expectedHarvestDate: r.expectedHarvestDate ?? undefined,
    growthStage: r.growthStage ?? undefined,
    status: (r.status as 'GROWING' | 'HARVESTED' | 'FAILED') ?? undefined,
    harvestDate: r.harvestDate ?? undefined,
    yieldKg: r.yieldKg ?? undefined,
    qualityGrade: r.qualityGrade ?? undefined,
    sellingPrice: r.sellingPrice ?? undefined,
  };
}
