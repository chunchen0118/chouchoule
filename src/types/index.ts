export interface Prize {
  id: string;
  name: string;
  emoji: string;
  weight: number;
  stock: number | null;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface DrawRecord {
  id: string;
  gameType: 'gacha' | 'cards' | 'scratch';
  prize: Prize;
  timestamp: number;
}

export interface GameSettings {
  prizes: Prize[];
  trackStock: boolean;
}

export interface GameState {
  gacha: GameSettings;
  cards: GameSettings;
  scratch: GameSettings;
  history: DrawRecord[];
  stats: {
    totalDraws: number;
    lastDrawTime: number | null;
  };
}

export type GameType = 'gacha' | 'cards' | 'scratch';

export const RARITY_COLORS: Record<Prize['rarity'], string> = {
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

export const RARITY_LABELS: Record<Prize['rarity'], string> = {
  common: '普通',
  uncommon: '稀有',
  rare: '精良',
  epic: '史詩',
  legendary: '傳說',
};
