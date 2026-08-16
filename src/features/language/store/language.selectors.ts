import type { RootState } from '@/app/store';

export const selectLanguageCode = (state: RootState) => state.language.code;
