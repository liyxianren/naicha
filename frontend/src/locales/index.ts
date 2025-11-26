import zhCN from './zh-CN';
import enUS from './en-US';
import type { Language, TranslationDictionary } from './types';

export const translations: Record<Language, TranslationDictionary> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export const defaultLanguage: Language = 'zh-CN';

export const supportedLanguages: Language[] = ['zh-CN', 'en-US'];
