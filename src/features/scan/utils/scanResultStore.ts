import type { Scan } from '@/shared/types/api.types';

let lastScan: Scan | null = null;

export const scanResultStore = {
  set: (scan: Scan) => {
    lastScan = scan;
  },
  take: (): Scan | null => {
    const s = lastScan;
    return s;
  },
};
