import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Home: undefined;
  Farms: undefined;
  Scan: undefined;
  Learn: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  DiseaseDetail: { diseaseKey: string };
  FarmDetail: { farmId: string };
  CropDetail: { cropId: string };
  ScanDetail: { scanId: number };
  ScanResult: undefined;
  History: undefined;
  Notifications: undefined;
  SettingsAbout: undefined;
  SettingsAccount: undefined;
  SettingsAppearance: undefined;
  SettingsLanguage: undefined;
  SettingsNotifications: undefined;
};
