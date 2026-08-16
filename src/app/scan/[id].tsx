import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { scanApi } from '@/api/endpoints';
import type { Scan } from '@/api/types';
import { Loading } from '@/components/ui';
import { ScanResultView } from '@/components/ScanResultView';
import { getCachedScan } from '@/data/scans';

export default function ScanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);

  useEffect(() => {
    if (!id) return;
    const serverId = Number(id);
    // Offline-first: cached scan, fall back to the network.
    getCachedScan(serverId)
      .then((cached) => (cached ? setScan(cached) : scanApi.get(serverId).then(setScan)))
      .catch(() => setScan(null));
  }, [id]);

  if (!scan) return <Loading />;
  // History view: hide "scan again" / re-prompt actions.
  return <ScanResultView scan={scan} showActions={false} />;
}
