import type { LocalCrop } from '../types/crop.types';
import { cropProgress, PADDY_STAGES, resolveStageIndex } from './crop';

function baseCrop(overrides: Partial<LocalCrop> = {}): LocalCrop {
  return {
    id: 'local-1', serverId: null, farmId: 'farm-1', serverFarmId: null, cropType: 'paddy',
    status: 'GROWING', syncState: 'synced', ...overrides,
  };
}

describe('cropProgress', () => {
  it('MOB-CROP-01: reports zero progress and no stage when there is no planting date', () => {
    const progress = cropProgress(baseCrop({ plantingDate: null }));

    expect(progress.daysSincePlanting).toBeNull();
    expect(progress.percent).toBe(0);
    expect(progress.stageIndex).toBe(0);
  });

  it('MOB-CROP-02: computes days since planting against the supplied "now"', () => {
    const planted = '2026-01-01T00:00:00.000Z';
    const now = new Date('2026-01-11T00:00:00.000Z').getTime();

    const progress = cropProgress(baseCrop({ plantingDate: planted, growingPeriodDays: 105 }), now);

    expect(progress.daysSincePlanting).toBe(10);
  });

  it('MOB-CROP-03: uses growingPeriodDays as the cycle length when no expected harvest date is set', () => {
    const planted = '2026-01-01T00:00:00.000Z';
    const now = new Date('2026-01-01T00:00:00.000Z').getTime() + 52.5 * 24 * 60 * 60 * 1000;

    const progress = cropProgress(baseCrop({ plantingDate: planted, growingPeriodDays: 105 }), now);

    expect(progress.percent).toBeCloseTo(0.5, 2);
  });

  it('MOB-CROP-04: uses the explicit expectedHarvestDate as the cycle length when set', () => {
    const planted = '2026-01-01T00:00:00.000Z';
    const harvest = '2026-02-10T00:00:00.000Z'; // 40-day cycle
    const now = new Date(planted).getTime() + 20 * 24 * 60 * 60 * 1000; // halfway

    const progress = cropProgress(baseCrop({ plantingDate: planted, expectedHarvestDate: harvest }), now);

    expect(progress.percent).toBeCloseTo(0.5, 2);
  });

  it('MOB-CROP-05: caps progress at 100% and jumps straight to the final stage once harvested', () => {
    const planted = '2026-01-01T00:00:00.000Z';
    const farFuture = new Date(planted).getTime() + 500 * 24 * 60 * 60 * 1000;

    const progress = cropProgress(baseCrop({ plantingDate: planted, growingPeriodDays: 105, status: 'HARVESTED' }), farFuture);

    expect(progress.percent).toBe(1);
    expect(progress.stageIndex).toBe(PADDY_STAGES.length - 1);
  });

  it('MOB-CROP-06: never reports negative days for a future planting date', () => {
    const planted = '2026-06-01T00:00:00.000Z';
    const now = new Date('2026-01-01T00:00:00.000Z').getTime(); // before planting

    const progress = cropProgress(baseCrop({ plantingDate: planted, growingPeriodDays: 105 }), now);

    expect(progress.daysSincePlanting).toBe(0);
  });

  it('MOB-CROP-07: advances stageIndex as elapsed percentage crosses each PADDY_STAGES threshold', () => {
    const planted = '2026-01-01T00:00:00.000Z';
    const now = new Date(planted).getTime() + 70 * 24 * 60 * 60 * 1000; // 70/105 = "heading" threshold

    const progress = cropProgress(baseCrop({ plantingDate: planted, growingPeriodDays: 105 }), now);

    expect(PADDY_STAGES[progress.stageIndex].key).toBe('heading');
  });
});

describe('resolveStageIndex', () => {
  it('MOB-CROP-09: prefers an explicitly logged growthStage over the computed progress stage', () => {
    const crop = baseCrop({ growthStage: 'booting' });
    const progress = cropProgress(crop);

    const index = resolveStageIndex(crop, progress);

    expect(PADDY_STAGES[index].key).toBe('booting');
  });

  it('MOB-CROP-10: falls back to the computed progress stage when no growthStage is logged', () => {
    const planted = '2026-01-01T00:00:00.000Z';
    const now = new Date(planted).getTime() + 70 * 24 * 60 * 60 * 1000;
    const crop = baseCrop({ plantingDate: planted, growingPeriodDays: 105, growthStage: null });
    const progress = cropProgress(crop, now);

    const index = resolveStageIndex(crop, progress);

    expect(index).toBe(progress.stageIndex);
  });
});
