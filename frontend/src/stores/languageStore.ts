import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Language } from '../locales/types';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

const STORAGE_KEY = 'mt-language';

const getBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') {
    return 'zh-CN';
  }
  const browserLang = navigator.language || navigator.languages?.[0];
  return browserLang?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: getBrowserLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
