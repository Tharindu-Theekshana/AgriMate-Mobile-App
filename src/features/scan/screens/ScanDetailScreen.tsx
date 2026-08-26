import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import { Loading } from '@/shared/components/ui';
import type { Scan } from '@/shared/types/api.types';

import type { MainStackParamList } from '@/navigation/types';
import { ScanResultView } from '../components/ScanResultView';
import { getCachedScan } from '../services/scan.local';
import { scanApi } from '../services/scan.service';

type Props = NativeStackScreenProps<MainStackParamList, 'ScanDetail'>;

export default function ScanDetailScreen({ route }: Props) {
  const { scanId } = route.params;
  const [scan, setScan] = useState<Scan | null>(null);

  useEffect(() => {
    getCachedScan(scanId)
      .then((cached) => (cached ? setScan(cached) : scanApi.get(scanId).then(setScan)))
      .catch(() => setScan(null));
  }, [scanId]);

  if (!scan) return <Loading />;
  return <ScanResultView scan={scan} showActions={false} />;
}
