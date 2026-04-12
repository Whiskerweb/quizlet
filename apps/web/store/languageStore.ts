import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'fr' | 'en' | 'es' | 'de';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

const languageNames: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'fr',
      setLanguage: (language) => {
        set({ language });
      },
    }),
    {
      name: 'language-storage',
    }
  )
);

export { languageNames };