export type TreatmentType = 'FERTILIZER' | 'PESTICIDE';

export interface LocalTreatment {
  id: string;
  serverId: number | null;
  cropId: string; 
  serverCropId: number | null;
  productName: string;
  type: TreatmentType;
  quantity?: string | null;
  appliedDate?: string | null;
  syncState: string;
}
