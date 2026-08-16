import type { Scan } from '@/api/types';

// Holds the most recent scan result so the result screen can render it
// (including transient flags like modelMocked) without a re-fetch.
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
