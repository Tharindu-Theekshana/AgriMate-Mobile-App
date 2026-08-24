export type Role = 'FARMER' | 'AGRONOMIST' | 'ADMIN';
export type AgronomistStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type Severity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  roles: Role[];
  accountType: Role;
  location?: string | null;
  profilePhotoUrl?: string | null;
  agronomistStatus: AgronomistStatus;
  suspended: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Farm {
  id: number;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  sizeAcres?: number | null;
  soilType?: string | null;
}

export type Season = 'MAHA' | 'YALA';
export type CropStatus = 'GROWING' | 'HARVESTED' | 'FAILED';
export type TreatmentType = 'FERTILIZER' | 'PESTICIDE';

export interface Crop {
  id: number;
  farmId: number;
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
}

export interface Treatment {
  id: number;
  cropId: number;
  productName: string;
  type: TreatmentType;
  quantity?: string | null;
  appliedDate?: string | null;
}

export interface StageLog {
  id: number;
  cropId: number;
  stageKey: string;
  reachedDate: string;
}

export interface Prediction {
  disease: string;
  confidence: number;
}

export interface Disease {
  diseaseKey: string;
  nameEn: string;
  nameSi?: string | null;
  nameTa?: string | null;
  scientificName?: string | null;
  cause?: string | null;
  symptoms?: string | null;
  treatment?: string | null;
  prevention?: string | null;
  severity: Severity;
}

export interface Scan {
  id: number;
  imageUrl?: string | null;
  predictedDisease: string;
  confidence: number;
  top3: Prediction[];
  disease?: Disease | null;
  lowConfidence: boolean;
  modelMocked: boolean;
  farmId?: number | null;
  cropId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface News {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  type: 'OUTBREAK' | 'REMINDER' | 'QA_REPLY' | 'SYSTEM' | 'NEWS';
  title: string;
  body?: string | null;
  read: boolean;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface Answer {
  id: number;
  agronomistName: string;
  body: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface Question {
  id: number;
  farmerName: string;
  farmerLocation?: string | null;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  answers: Answer[];
}
