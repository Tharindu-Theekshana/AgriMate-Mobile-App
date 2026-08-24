import { and, eq, ne } from 'drizzle-orm';

import { db } from '@/shared/services/db';
import { crops, cropStageLogs } from '@/shared/services/db/schema';
import { uuid } from '@/shared/utils/uuid';

import type { StageKey } from '../utils/crop';
import type { LocalStageLog } from '../types/stageLog.types';

type Row = typeof cropStageLogs.$inferSelect;

function toLocal(r: Row): LocalStageLog {
  return {
    id: r.id,
    serverId: r.serverId ?? null,
    cropId: r.cropId,
    serverCropId: r.serverCropId ?? null,
    stageKey: r.stageKey as StageKey,
    reachedDate: r.reachedDate,
    syncState: r.syncState,
  };
}

export async function listStageLogs(cropId: string): Promise<LocalStageLog[]> {
  const rows = await db
    .select()
    .from(cropStageLogs)
    .where(and(eq(cropStageLogs.cropId, cropId), eq(cropStageLogs.deleted, false), ne(cropStageLogs.syncState, 'pending_delete')));
  return rows.map(toLocal).sort((a, b) => a.reachedDate.localeCompare(b.reachedDate));
}

export async function addStageLog(cropId: string, stageKey: StageKey, reachedDate: string): Promise<LocalStageLog> {
  const id = uuid();
  const cropRows = await db.select().from(crops).where(eq(crops.id, cropId));
  const serverCropId = cropRows[0]?.serverId ?? null;
  await db.insert(cropStageLogs).values({
    id,
    serverId: null,
    cropId,
    serverCropId,
    stageKey,
    reachedDate,
    syncState: 'pending_create',
    updatedAt: Date.now(),
    deleted: false,
  });
  await syncCurrentStage(cropId);
  const rows = await db.select().from(cropStageLogs).where(eq(cropStageLogs.id, id));
  return toLocal(rows[0]);
}

export async function deleteStageLog(id: string): Promise<void> {
  const rows = await db.select().from(cropStageLogs).where(eq(cropStageLogs.id, id));
  const existing = rows[0];
  if (!existing) return;
  if (existing.serverId == null) {
    await db.delete(cropStageLogs).where(eq(cropStageLogs.id, id));
  } else {
    await db.update(cropStageLogs).set({ syncState: 'pending_delete', updatedAt: Date.now() }).where(eq(cropStageLogs.id, id));
  }
  await syncCurrentStage(existing.cropId);
}

/** Keeps the crop's cached "current stage" (read everywhere else) matching the most recently reached logged stage. */
async function syncCurrentStage(cropId: string): Promise<void> {
  const logs = await listStageLogs(cropId);
  const latest = logs[logs.length - 1];
  await db.update(crops).set({ growthStage: latest?.stageKey ?? null }).where(eq(crops.id, cropId));
}
