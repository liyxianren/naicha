import type { TemplateParams } from '../locales/types';

/**
 * 翻译函数类型
 */
export type TFunction = (key: string, params?: TemplateParams) => string;

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

