export type Language = 'zh-CN' | 'en-US';

export type TemplateParams = Record<string, string | number>;

// Translations are organized as nested objects:
// e.g. { game: { header: { title: '...' } } }
export type TranslationValue = string | TranslationTree;

export interface TranslationTree {
  [key: string]: TranslationValue;
}

export type TranslationDictionary = TranslationTree;
