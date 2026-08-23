export type Season = 'MAHA' | 'YALA';
export type CropStatus = 'GROWING' | 'HARVESTED' | 'FAILED';

export interface LocalCrop {
  id: string;
  serverId: number | null;
  farmId: string;
  serverFarmId: number | null;
  cropType: string;
  variety?: string | null;
  season?: Season | null;
  areaAcres?: number | null;
  plantingDate?: string | null;
  expectedHarvestDate?: string | null;
  growingPeriodDays?: number | null;
  growthStage?: string | null;
  status: CropStatus;
  harvestDate?: string | null;
  yieldKg?: number | null;
  qualityGrade?: string | null;
  sellingPrice?: number | null;
  syncState: string;
}
