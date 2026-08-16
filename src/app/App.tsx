import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { RootNavigator } from '@/navigation/RootNavigator';
import { SyncProvider } from '@/shared/providers/SyncProvider';
import { ToastProvider } from '@/shared/providers/ToastProvider';

import { store } from './store';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ToastProvider>
            <SyncProvider>
              <RootNavigator />
            </SyncProvider>
          </ToastProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
