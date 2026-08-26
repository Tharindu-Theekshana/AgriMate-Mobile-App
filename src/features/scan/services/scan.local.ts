import { desc, eq } from 'drizzle-orm';

import { db } from '@/shared/services/db';
import { scans } from '@/shared/services/db/schema';
import type { Scan } from '@/shared/types/api.types';

export async function cacheScan(scan: Scan): Promise<void> {
  if (scan.id == null) return;
  await db
    .insert(scans)
    .values({
      serverId: scan.id,
      json: JSON.stringify(scan),
      predictedDisease: scan.predictedDisease,
      createdAt: new Date(scan.createdAt).getTime() || Date.now(),
    })
    .onConflictDoUpdate({
      target: scans.serverId,
      set: { json: JSON.stringify(scan), predictedDisease: scan.predictedDisease },
    });
}

export async function cacheScans(list: Scan[]): Promise<void> {
  for (const s of list) await cacheScan(s);
}

export async function listScans(disease?: string | null): Promise<Scan[]> {
  const rows = await db.select().from(scans).orderBy(desc(scans.createdAt));
  const all = rows.map((r) => JSON.parse(r.json) as Scan);
  return disease ? all.filter((s) => s.predictedDisease === disease) : all;
}

export async function getCachedScan(serverId: number): Promise<Scan | null> {
  const rows = await db.select().from(scans).where(eq(scans.serverId, serverId));
  return rows[0] ? (JSON.parse(rows[0].json) as Scan) : null;
}
