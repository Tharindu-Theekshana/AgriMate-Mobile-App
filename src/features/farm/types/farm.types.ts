
export interface LocalFarm {
  id: string;
  serverId: number | null;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  sizeAcres?: number | null;
  soilType?: string | null;
  syncState: string;
}
