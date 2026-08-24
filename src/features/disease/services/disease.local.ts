import { eq } from 'drizzle-orm';

import { db } from '@/shared/services/db';
import { diseases } from '@/shared/services/db/schema';
import { isOnline } from '@/shared/services/network/online';
import type { Disease } from '@/shared/types/api.types';

import { diseaseApi } from './disease.service';

function rowToDisease(row: { json: string }): Disease {
  return JSON.parse(row.json) as Disease;
}

export async function refreshDiseases(): Promise<void> {
  const list = await diseaseApi.list();
  await db.delete(diseases);
  if (list.length) {
    await db.insert(diseases).values(
      list.map((d) => ({ diseaseKey: d.diseaseKey, json: JSON.stringify(d), nameEn: d.nameEn })),
    );
  }
}

export async function getDiseases(): Promise<Disease[]> {
  let rows = await db.select().from(diseases);
  if (rows.length === 0 && (await isOnline())) {
    try {
      await refreshDiseases();
      rows = await db.select().from(diseases);
    } catch {
      /* stay offline-empty */
    }
  }
  return rows.map(rowToDisease).sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}

export async function getDisease(key: string): Promise<Disease | null> {
  const rows = await db.select().from(diseases).where(eq(diseases.diseaseKey, key));
  if (rows[0]) return rowToDisease(rows[0]);
  if (await isOnline()) {
    try {
      return await diseaseApi.get(key);
    } catch {
      return null;
    }
  }
  return null;
}
