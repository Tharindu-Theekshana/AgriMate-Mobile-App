import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import type { Scan } from '@/api/types';
import { Loading } from '@/components/ui';
import { ScanResultView } from '@/components/ScanResultView';
import { scanResultStore } from '@/utils/scanResultStore';

export default function ScanResultScreen() {
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);

  useEffect(() => {
    const s = scanResultStore.take();
    if (s) setScan(s);
    else router.replace('/');
  }, [router]);

  if (!scan) return <Loading />;
  return <ScanResultView scan={scan} />;
}
