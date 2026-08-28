import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
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
  Questions: undefined;
  AskQuestion:
    | { scanId?: number; title?: string; editQuestion?: { id: number; title: string; body?: string | null; imageUrl?: string | null } }
    | undefined;
  QuestionDetail: { questionId: number };
  SettingsAbout: undefined;
  SettingsAccount: undefined;
  SettingsAppearance: undefined;
  SettingsLanguage: undefined;
  SettingsNotifications: undefined;
};
