import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import { Loading } from '@/shared/components/ui';
import type { Scan } from '@/shared/types/api.types';

import { scanResultStore } from '../utils/scanResultStore';
import { ScanResultView } from '../components/ScanResultView';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ScanResult'>;

export default function ScanResultScreen({ navigation }: Props) {
  const [scan, setScan] = useState<Scan | null>(null);

  useEffect(() => {
    const s = scanResultStore.take();
    if (s) setScan(s);
    else navigation.navigate('Tabs');
  }, [navigation]);

  if (!scan) return <Loading />;
  return <ScanResultView scan={scan} />;
}
