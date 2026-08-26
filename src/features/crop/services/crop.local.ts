import { and, eq, ne } from 'drizzle-orm';

import { db } from '@/shared/services/db';
import { crops, farms } from '@/shared/services/db/schema';
import { uuid } from '@/shared/utils/uuid';

import type { CropStatus, LocalCrop, Season } from '../types/crop.types';
import { addStageLog } from './stageLog.local';

type Row = typeof crops.$inferSelect;

function toLocal(r: Row): LocalCrop {
  return {
    id: r.id,
    serverId: r.serverId ?? null,
    farmId: r.farmId,
    serverFarmId: r.serverFarmId ?? null,
    cropType: r.cropType,
    variety: r.variety,
    season: (r.season as Season | null) ?? null,
    areaAcres: r.areaAcres,
    plantingDate: r.plantingDate,
    expectedHarvestDate: r.expectedHarvestDate,
    growingPeriodDays: r.growingPeriodDays ?? null,
    growthStage: r.growthStage,
    status: (r.status as CropStatus) ?? 'GROWING',
    harvestDate: r.harvestDate,
    yieldKg: r.yieldKg,
    qualityGrade: r.qualityGrade,
    sellingPrice: r.sellingPrice,
    syncState: r.syncState,
  };
}

export interface CropInput {
  variety?: string | null;
  season?: Season | null;
  areaAcres?: number | null;
  plantingDate?: string | null;
  expectedHarvestDate?: string | null;
  growingPeriodDays?: number | null;
  growthStage?: string | null;
  status?: CropStatus;
  harvestDate?: string | null;
  yieldKg?: number | null;
  qualityGrade?: string | null;
  sellingPrice?: number | null;
}

export function suggestHarvestDate(plantingDate?: string | null, growingPeriodDays?: number | null): string | null {
  if (!plantingDate) return null;
  const d = new Date(plantingDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + (growingPeriodDays ?? 105));
  return d.toISOString().slice(0, 10);
}

export async function listCrops(farmId: string): Promise<LocalCrop[]> {
  const rows = await db
    .select()
    .from(crops)
    .where(and(eq(crops.farmId, farmId), eq(crops.deleted, false), ne(crops.syncState, 'pending_delete')));
  return rows.map(toLocal).sort((a, b) => (b.plantingDate ?? '').localeCompare(a.plantingDate ?? ''));
}

export async function getCrop(id: string): Promise<LocalCrop | null> {
  const rows = await db.select().from(crops).where(eq(crops.id, id));
  return rows[0] ? toLocal(rows[0]) : null;
}

export async function getCropByServerId(serverId: number): Promise<LocalCrop | null> {
  const rows = await db.select().from(crops).where(eq(crops.serverId, serverId));
  return rows[0] ? toLocal(rows[0]) : null;
}

export async function createCrop(farmId: string, input: CropInput): Promise<LocalCrop> {
  const id = uuid();
  const farmRows = await db.select().from(farms).where(eq(farms.id, farmId));
  const serverFarmId = farmRows[0]?.serverId ?? null;
  await db.insert(crops).values({
    id,
    serverId: null,
    farmId,
    serverFarmId,
    cropType: 'paddy',
    variety: input.variety ?? null,
    season: input.season ?? null,
    areaAcres: input.areaAcres ?? null,
    plantingDate: input.plantingDate ?? null,
    expectedHarvestDate: input.expectedHarvestDate ?? suggestHarvestDate(input.plantingDate, input.growingPeriodDays),
    growingPeriodDays: input.growingPeriodDays ?? null,
    growthStage: input.growthStage ?? null,
    status: input.status ?? 'GROWING',
    harvestDate: input.harvestDate ?? null,
    yieldKg: input.yieldKg ?? null,
    qualityGrade: input.qualityGrade ?? null,
    sellingPrice: input.sellingPrice ?? null,
    syncState: 'pending_create',
    updatedAt: Date.now(),
    deleted: false,
  });
  return (await getCrop(id))!;
}

export async function updateCrop(id: string, input: CropInput): Promise<LocalCrop> {
  const existing = await getCrop(id);
  if (!existing) throw new Error('Crop not found');
  const nextState = existing.syncState === 'pending_create' ? 'pending_create' : 'pending_update';
  await db
    .update(crops)
    .set({
      variety: input.variety ?? null,
      season: input.season ?? null,
      areaAcres: input.areaAcres ?? null,
      plantingDate: input.plantingDate ?? null,
      expectedHarvestDate: input.expectedHarvestDate ?? suggestHarvestDate(input.plantingDate, input.growingPeriodDays),
      growingPeriodDays: input.growingPeriodDays ?? null,
      growthStage: input.growthStage ?? null,
      status: input.status ?? existing.status,
      harvestDate: input.harvestDate ?? null,
      yieldKg: input.yieldKg ?? null,
      qualityGrade: input.qualityGrade ?? null,
      sellingPrice: input.sellingPrice ?? null,
      syncState: nextState,
      updatedAt: Date.now(),
    })
    .where(eq(crops.id, id));
  return (await getCrop(id))!;
}

export async function markHarvested(
  crop: LocalCrop,
  harvest: { harvestDate: string; yieldKg?: number | null; qualityGrade?: string | null; sellingPrice?: number | null },
): Promise<LocalCrop> {

  await addStageLog(crop.id, 'harvest', harvest.harvestDate);
  return updateCrop(crop.id, {
    variety: crop.variety,
    season: crop.season,
    areaAcres: crop.areaAcres,
    plantingDate: crop.plantingDate,
    expectedHarvestDate: crop.expectedHarvestDate,
    growingPeriodDays: crop.growingPeriodDays,
    growthStage: 'harvest',
    status: 'HARVESTED',
    harvestDate: harvest.harvestDate,
    yieldKg: harvest.yieldKg ?? null,
    qualityGrade: harvest.qualityGrade ?? null,
    sellingPrice: harvest.sellingPrice ?? null,
  });
}

export async function deleteCrop(id: string): Promise<void> {
  const rows = await db.select().from(crops).where(eq(crops.id, id));
  const existing = rows[0];
  if (!existing) return;
  if (existing.serverId == null) {
    await db.delete(crops).where(eq(crops.id, id));
  } else {
    await db.update(crops).set({ syncState: 'pending_delete', updatedAt: Date.now() }).where(eq(crops.id, id));
  }
}
