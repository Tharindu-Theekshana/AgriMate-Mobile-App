import type { LocalCrop } from '@/data/types';

/** Paddy growth stages in order, with approximate days-after-planting thresholds. */
export const PADDY_STAGES = [
  { key: 'nursery', day: 0 },
  { key: 'tillering', day: 15 },
  { key: 'vegetative', day: 35 },
  { key: 'booting', day: 55 },
  { key: 'heading', day: 70 },
  { key: 'ripening', day: 90 },
  { key: 'harvest', day: 105 },
] as const;

export type StageKey = (typeof PADDY_STAGES)[number]['key'];

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: string, to: number): number {
  const start = new Date(from).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.floor((to - start) / DAY_MS);
}

export interface CropProgress {
  daysSincePlanting: number | null;
  daysToHarvest: number | null;
  percent: number; // 0..1 through the cycle
  stageIndex: number; // index into PADDY_STAGES
}

export function cropProgress(crop: LocalCrop, now = Date.now()): CropProgress {
  if (!crop.plantingDate) {
    return { daysSincePlanting: null, daysToHarvest: null, percent: 0, stageIndex: 0 };
  }
  const daysSince = Math.max(0, daysBetween(crop.plantingDate, now));
  const cycle = crop.expectedHarvestDate ? Math.max(1, daysBetween(crop.plantingDate, new Date(crop.expectedHarvestDate).getTime())) : 105;
  const daysToHarvest = cycle - daysSince;
  const percent = crop.status === 'HARVESTED' ? 1 : Math.min(1, daysSince / cycle);

  // Current stage = last threshold reached.
  let stageIndex = 0;
  for (let i = 0; i < PADDY_STAGES.length; i++) {
    if (daysSince >= PADDY_STAGES[i].day) stageIndex = i;
  }
  if (crop.status === 'HARVESTED') stageIndex = PADDY_STAGES.length - 1;

  return { daysSincePlanting: daysSince, daysToHarvest, percent, stageIndex };
}
