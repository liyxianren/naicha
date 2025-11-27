import type { TemplateParams, Language } from '../locales/types';

/**
 * 翻译函数类型
 */
export type TFunction = (key: string, params?: TemplateParams) => string;

/**
 * 产品名称映射表
 */
const PRODUCT_NAMES: Record<string, { zh: string; en: string }> = {
  '奶茶': { zh: '奶茶', en: 'Milk Tea' },
  '椰奶': { zh: '椰奶', en: 'Coconut Milk' },
  '柠檬茶': { zh: '柠檬茶', en: 'Lemon Tea' },
  '果汁': { zh: '果汁', en: 'Juice' },
  '珍珠奶茶': { zh: '珍珠奶茶', en: 'Pearl Milk Tea' },
  '水果奶昔': { zh: '水果奶昔', en: 'Fruit Milkshake' },
  '水果茶': { zh: '水果茶', en: 'Fruit Tea' },
};

/**
 * 获取产品的本地化显示名称
 * @param name 产品原始名称（通常是中文）
 * @param language 目标语言
 * @returns 本地化的产品名称
 */
export const getProductDisplayName = (name: string, language: Language): string => {
  const product = PRODUCT_NAMES[name];
  if (product) {
    return language === 'zh-CN' ? product.zh : product.en;
  }
  // 未匹配则返回原名称
  return name;
};

/**
 * 翻译产品名称
 * 支持中英文双向识别
 */
export const translateProductName = (name: string, t: TFunction): string => {
  const lower = (name || '').toLowerCase();
  
  // 水果茶
  if (lower.includes('水果茶') || lower.includes('fruit tea')) {
    return t('game.products.names.fruitTea');
  }
  
  // 水果奶昔
  if (lower.includes('水果奶昔') || lower.includes('fruit milkshake')) {
    return t('game.products.names.fruitMilkshake');
  }
  
  // 珍珠奶茶
  if (lower.includes('珍珠奶茶') || lower.includes('pearl milk tea')) {
    return t('game.products.names.pearlMilkTea');
  }
  
  // 椰奶
  if (lower.includes('椰奶') || lower.includes('coconut milk') || lower.includes('coconut')) {
    return t('game.products.names.coconutMilk');
  }
  
  // 柠檬茶
  if (lower.includes('柠檬茶') || lower.includes('lemon tea') || lower.includes('lemon')) {
    return t('game.products.names.lemonTea');
  }
  
  // 果汁
  if (lower.includes('果汁') || lower.includes('juice')) {
    return t('game.products.names.juice');
  }
  
  // 基础奶茶（需要放在最后，避免被其他包含"奶茶"的名称误匹配）
  if (lower.includes('奶茶') || lower.includes('milk tea')) {
    return t('game.products.names.milkTea');
  }
  
  // 未匹配则返回原名称
  return name;
};

