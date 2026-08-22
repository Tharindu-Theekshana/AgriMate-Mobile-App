import { useEffect } from 'react';

import { useAppSelector } from '@/app/hooks';
import { selectAuthInitializing, selectIsAuthenticated } from '@/features/auth';
import { initDb } from '@/shared/services/db';
import { onReconnect } from '@/shared/services/network/online';
import { syncNow } from '@/shared/services/sync/sync';

let dbReady = false;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const initializing = useAppSelector(selectAuthInitializing);

  useEffect(() => {
    if (!dbReady) {
      try {
        initDb();
        dbReady = true;
      } catch(e) {
        console.error("error loading local db : ", e);
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
