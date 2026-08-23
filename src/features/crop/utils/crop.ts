import type { LocalCrop } from '../types/crop.types';

export const PADDY_STAGES = [
  { key: 'nursery', fraction: 0 / 105 },
  { key: 'tillering', fraction: 15 / 105 },
  { key: 'vegetative', fraction: 35 / 105 },
  { key: 'booting', fraction: 55 / 105 },
  { key: 'heading', fraction: 70 / 105 },
  { key: 'ripening', fraction: 90 / 105 },
  { key: 'harvest', fraction: 105 / 105 },
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
  percent: number;
  stageIndex: number;
}

export function cropProgress(crop: LocalCrop, now = Date.now()): CropProgress {
  if (!crop.plantingDate) {
    return { daysSincePlanting: null, daysToHarvest: null, percent: 0, stageIndex: 0 };
  }
  const daysSince = Math.max(0, daysBetween(crop.plantingDate, now));
  const cycle = crop.expectedHarvestDate
    ? Math.max(1, daysBetween(crop.plantingDate, new Date(crop.expectedHarvestDate).getTime()))
    : (crop.growingPeriodDays ?? 105);
  const daysToHarvest = cycle - daysSince;
  const percent = crop.status === 'HARVESTED' ? 1 : Math.min(1, daysSince / cycle);

  let stageIndex = 0;
  for (let i = 0; i < PADDY_STAGES.length; i++) {
    if (percent >= PADDY_STAGES[i].fraction) stageIndex = i;
  }
  if (crop.status === 'HARVESTED') stageIndex = PADDY_STAGES.length - 1;

  return { daysSincePlanting: daysSince, daysToHarvest, percent, stageIndex };
}

export function resolveStageIndex(crop: LocalCrop, progress: CropProgress): number {
  if (crop.growthStage) {
    const i = PADDY_STAGES.findIndex((s) => s.key === crop.growthStage);
    if (i !== -1) return i;
  }
  return progress.stageIndex;
}
