import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** Imperative check used by the sync engine. */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected;
}

/** Reactive online status for UI (e.g. an offline banner). */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setOnline(!!s.isConnected));
    return unsub;
  }, []);
  return online;
}

/** Subscribe to connectivity regained events (for triggering sync). */
export function onReconnect(cb: () => void): () => void {
  let wasConnected = true;
  return NetInfo.addEventListener((s) => {
    const connected = !!s.isConnected;
    if (connected && !wasConnected) cb();
    wasConnected = connected;
  });
}
