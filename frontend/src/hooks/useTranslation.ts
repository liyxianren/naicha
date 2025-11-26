import { useMemo } from 'react';
import { translations } from '../locales';
import type { TemplateParams } from '../locales/types';
import { useLanguageStore } from '../stores/languageStore';

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);

  const t = useMemo(() => {
    return (key: string, params?: TemplateParams): string => {
      const segments = key.split('.');
      let value: any = translations[language];

      for (const segment of segments) {
        value = value?.[segment];
        if (value === undefined) {
          if (import.meta.env.DEV) {
            console.warn(`[i18n] Missing translation for "${key}" [${language}]`);
          }
          return key;
        }
      }

      if (typeof value === 'string') {
        if (params) {
          return value.replace(/\{\{(\w+)\}\}/g, (_, token) =>
            params[token] !== undefined ? String(params[token]) : `{{${token}}}`
          );
        }
        return value;
      }

      if (import.meta.env.DEV) {
        console.warn(`[i18n] Translation key is not a string: "${key}" [${language}]`);
      }
      return key;
    };
  }, [language]);

  return { t, language };
};
