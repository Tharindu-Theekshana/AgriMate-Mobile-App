import { and, eq, ne } from 'drizzle-orm';

import { db } from '@/shared/services/db';
import { farms } from '@/shared/services/db/schema';
import { uuid } from '@/shared/utils/uuid';

import type { LocalFarm } from '../types/farm.types';

type Row = typeof farms.$inferSelect;

function toLocal(r: Row): LocalFarm {
  return {
    id: r.id,
    serverId: r.serverId ?? null,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    sizeAcres: r.sizeAcres,
    soilType: r.soilType,
    syncState: r.syncState,
  };
}

export interface FarmInput {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  sizeAcres?: number | null;
  soilType?: string | null;
}

export async function listFarms(): Promise<LocalFarm[]> {
  const rows = await db
    .select()
    .from(farms)
    .where(and(eq(farms.deleted, false), ne(farms.syncState, 'pending_delete')));
  return rows.map(toLocal).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFarm(id: string): Promise<LocalFarm | null> {
  const rows = await db.select().from(farms).where(eq(farms.id, id));
  return rows[0] ? toLocal(rows[0]) : null;
}

export async function getFarmByServerId(serverId: number): Promise<LocalFarm | null> {
  const rows = await db.select().from(farms).where(eq(farms.serverId, serverId));
  return rows[0] ? toLocal(rows[0]) : null;
}

export async function createFarm(input: FarmInput): Promise<LocalFarm> {
  const id = uuid();
  await db.insert(farms).values({
    id,
    serverId: null,
    name: input.name,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    sizeAcres: input.sizeAcres ?? null,
    soilType: input.soilType ?? null,
    syncState: 'pending_create',
    updatedAt: Date.now(),
    deleted: false,
  });
  return (await getFarm(id))!;
}

export async function updateFarm(id: string, input: FarmInput): Promise<LocalFarm> {
  const existing = await getFarm(id);
  const nextState = existing?.syncState === 'pending_create' ? 'pending_create' : 'pending_update';
  await db
    .update(farms)
    .set({
      name: input.name,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      sizeAcres: input.sizeAcres ?? null,
      soilType: input.soilType ?? null,
      syncState: nextState,
      updatedAt: Date.now(),
    })
    .where(eq(farms.id, id));
  return (await getFarm(id))!;
}

export async function deleteFarm(id: string): Promise<void> {
  const existing = await getFarm(id);
  if (!existing) return;
  if (existing.serverId == null) {
    await db.delete(farms).where(eq(farms.id, id));
  } else {
    await db.update(farms).set({ syncState: 'pending_delete', updatedAt: Date.now() }).where(eq(farms.id, id));
  }
}
