// Local (offline-first) entity shapes. `id` is the local uuid used across the app;
// `serverId` is the backend id once synced (null until then).

export type FarmCategory = 'CROP' | 'ANIMAL';

export interface LocalFarm {
  id: string;
  serverId: number | null;
  name: string;
  category: FarmCategory;
  latitude?: number | null;
  longitude?: number | null;
  sizeAcres?: number | null;
  soilType?: string | null;
  syncState: string;
}

export type Season = 'MAHA' | 'YALA';
export type CropStatus = 'GROWING' | 'HARVESTED' | 'FAILED';
export type TreatmentType = 'FERTILIZER' | 'PESTICIDE';

export interface LocalCrop {
  id: string;
  serverId: number | null;
  farmId: string; // local farm id
  serverFarmId: number | null;
  cropType: string;
  variety?: string | null;
  season?: Season | null;
  areaAcres?: number | null;
  plantingDate?: string | null;
  expectedHarvestDate?: string | null;
  growthStage?: string | null;
  status: CropStatus;
  harvestDate?: string | null;
  yieldKg?: number | null;
  qualityGrade?: string | null;
  sellingPrice?: number | null;
  syncState: string;
}

export interface LocalTreatment {
  id: string;
  serverId: number | null;
  cropId: string; // local crop id
  serverCropId: number | null;
  productName: string;
  type: TreatmentType;
  quantity?: string | null;
  appliedDate?: string | null;
  syncState: string;
}
