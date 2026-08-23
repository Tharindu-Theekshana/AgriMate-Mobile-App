
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
