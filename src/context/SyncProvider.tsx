import { useEffect } from 'react';

import { syncNow } from '@/data/sync';
import { initDb } from '@/db';
import { onReconnect } from '@/net/online';
import { useAuth } from '@/context/AuthContext';

let dbReady = false;

/**
 * Initializes the local DB and keeps it in sync with the backend:
 * on launch, whenever auth state changes, and whenever connectivity returns.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();

  useEffect(() => {
    if (!dbReady) {
      try {
        initDb();
        dbReady = true;
      } catch {
        /* if DB init fails the app still runs against the network */
      }
    }
  }, []);

  useEffect(() => {
    if (initializing) return;
    void syncNow(isAuthenticated);
    const unsub = onReconnect(() => void syncNow(isAuthenticated));
    return unsub;
  }, [isAuthenticated, initializing]);

  return <>{children}</>;
}
