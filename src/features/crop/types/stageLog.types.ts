import type { StageKey } from '../utils/crop';

export interface LocalStageLog {
  id: string;
  serverId: number | null;
  cropId: string;
  serverCropId: number | null;
  stageKey: StageKey;
  reachedDate: string;
  syncState: string;
}
