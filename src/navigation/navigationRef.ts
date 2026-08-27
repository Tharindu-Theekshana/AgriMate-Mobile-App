import { createNavigationContainerRef } from '@react-navigation/native';

import type { MainStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<MainStackParamList>();

export function navigate<RouteName extends keyof MainStackParamList>(
  name: RouteName,
  params?: MainStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (name: RouteName, params?: MainStackParamList[RouteName]) => void)(name, params);
  }
}
