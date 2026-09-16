import { Prize, GameSettings } from '../types';
import { generateId } from '../utils/random';

export const defaultGachaPrizes: Prize[] = [
  { id: generateId(), name: '黃金扭蛋', emoji: '🥇', weight: 2, stock: 3, rarity: 'legendary' },
  { id: generateId(), name: '神秘寶石', emoji: '💎', weight: 5, stock: 5, rarity: 'epic' },
  { id: generateId(), name: '幸運星星', emoji: '⭐', weight: 10, stock: 10, rarity: 'rare' },
  { id: generateId(), name: '彩虹糖果', emoji: '🍬', weight: 15, stock: 20, rarity: 'uncommon' },
  { id: generateId(), name: '可愛貓咪', emoji: '🐱', weight: 20, stock: null, rarity: 'uncommon' },
  { id: generateId(), name: '小熊布偶', emoji: '🧸', weight: 20, stock: null, rarity: 'common' },
  { id: generateId(), name: '鑰匙圈', emoji: '🔑', weight: 28, stock: null, rarity: 'common' },
];

export const defaultCardPrizes: Prize[] = [
  { id: generateId(), name: '傳說龍卡', emoji: '🐉', weight: 1, stock: 1, rarity: 'legendary' },
  { id: generateId(), name: '鳳凰神卡', emoji: '🦅', weight: 3, stock: 2, rarity: 'epic' },
  { id: generateId(), name: '獨角獸卡', emoji: '🦄', weight: 5, stock: 5, rarity: 'epic' },
  { id: generateId(), name: '魔法師卡', emoji: '🧙', weight: 10, stock: 10, rarity: 'rare' },
  { id: generateId(), name: '勇士卡', emoji: '⚔️', weight: 15, stock: 15, rarity: 'rare' },
  { id: generateId(), name: '精靈卡', emoji: '🧚', weight: 20, stock: null, rarity: 'uncommon' },
  { id: generateId(), name: '花仙子卡', emoji: '🌸', weight: 20, stock: null, rarity: 'uncommon' },
  { id: generateId(), name: '普通卡', emoji: '📜', weight: 26, stock: null, rarity: 'common' },
];

export const defaultScratchPrizes: Prize[] = [
  { id: generateId(), name: '頭獎！百萬金幣', emoji: '💰', weight: 1, stock: 1, rarity: 'legendary' },
  { id: generateId(), name: '大獎！鑽石套裝', emoji: '💍', weight: 3, stock: 3, rarity: 'epic' },
  { id: generateId(), name: '中獎！神秘禮盒', emoji: '🎁', weight: 8, stock: 8, rarity: 'rare' },
  { id: generateId(), name: '幸運獎：金幣x100', emoji: '🪙', weight: 15, stock: 20, rarity: 'rare' },
  { id: generateId(), name: '安慰獎：愛心', emoji: '❤️', weight: 25, stock: null, rarity: 'uncommon' },
  { id: generateId(), name: '參與獎：星星', emoji: '✨', weight: 25, stock: null, rarity: 'uncommon' },
  { id: generateId(), name: '謝謝參與', emoji: '🎈', weight: 23, stock: null, rarity: 'common' },
];

export const defaultGachaSettings: GameSettings = {
  prizes: defaultGachaPrizes,
  trackStock: true,
};

export const defaultCardSettings: GameSettings = {
  prizes: defaultCardPrizes,
  trackStock: true,
};

export const defaultScratchSettings: GameSettings = {
  prizes: defaultScratchPrizes,
  trackStock: true,
};
