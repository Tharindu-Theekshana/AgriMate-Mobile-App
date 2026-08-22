import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setOnline(!!s.isConnected));
    return unsub;
  }, []);
  return online;
}

export function onReconnect(cb: () => void): () => void {
  let wasConnected = true;
  return NetInfo.addEventListener((s) => {
    const connected = !!s.isConnected;
    if (connected && !wasConnected) cb();
    wasConnected = connected;
  });
}
