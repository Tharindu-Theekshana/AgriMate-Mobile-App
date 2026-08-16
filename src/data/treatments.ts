import { and, eq, ne } from 'drizzle-orm';

import { db } from '@/db';
import { crops, treatments } from '@/db/schema';
import type { LocalTreatment, TreatmentType } from '@/data/types';
import { uuid } from '@/utils/uuid';

type Row = typeof treatments.$inferSelect;

function toLocal(r: Row): LocalTreatment {
  return {
    id: r.id,
    serverId: r.serverId ?? null,
    cropId: r.cropId,
    serverCropId: r.serverCropId ?? null,
    productName: r.productName,
    type: (r.type as TreatmentType) ?? 'FERTILIZER',
    quantity: r.quantity,
    appliedDate: r.appliedDate,
    syncState: r.syncState,
  };
}

export interface TreatmentInput {
  productName: string;
  type: TreatmentType;
  quantity?: string | null;
  appliedDate?: string | null;
}

export async function listTreatments(cropId: string): Promise<LocalTreatment[]> {
  const rows = await db
    .select()
    .from(treatments)
    .where(and(eq(treatments.cropId, cropId), eq(treatments.deleted, false), ne(treatments.syncState, 'pending_delete')));
  return rows.map(toLocal).sort((a, b) => (b.appliedDate ?? '').localeCompare(a.appliedDate ?? ''));
}

export async function createTreatment(cropId: string, input: TreatmentInput): Promise<LocalTreatment> {
  const id = uuid();
  const cropRows = await db.select().from(crops).where(eq(crops.id, cropId));
  const serverCropId = cropRows[0]?.serverId ?? null;
  await db.insert(treatments).values({
    id,
    serverId: null,
    cropId,
    serverCropId,
    productName: input.productName,
    type: input.type,
    quantity: input.quantity ?? null,
    appliedDate: input.appliedDate ?? null,
    syncState: 'pending_create',
    updatedAt: Date.now(),
    deleted: false,
  });
  const rows = await db.select().from(treatments).where(eq(treatments.id, id));
  return toLocal(rows[0]);
}

export async function deleteTreatment(id: string): Promise<void> {
  const rows = await db.select().from(treatments).where(eq(treatments.id, id));
  const existing = rows[0];
  if (!existing) return;
  if (existing.serverId == null) {
    await db.delete(treatments).where(eq(treatments.id, id));
  } else {
    await db.update(treatments).set({ syncState: 'pending_delete', updatedAt: Date.now() }).where(eq(treatments.id, id));
  }
}
