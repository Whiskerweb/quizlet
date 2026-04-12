import { useLanguageStore } from '@/store/languageStore';
import { translations, type TranslationKey } from './translations';

export function useTranslation() {
  const { language } = useLanguageStore();
  
  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.fr[key] || key;
  };

  return { t, language };
}