import { Prize } from '../types';

export function weightedRandom(prizes: Prize[], trackStock: boolean): Prize | null {
  const availablePrizes = trackStock
    ? prizes.filter(p => p.stock === null || p.stock > 0)
    : prizes;

  if (availablePrizes.length === 0) return null;

  const totalWeight = availablePrizes.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return null;

  let random = Math.random() * totalWeight;
  
  for (const prize of availablePrizes) {
    random -= prize.weight;
    if (random <= 0) {
      return prize;
    }
  }
  
  return availablePrizes[availablePrizes.length - 1];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function normalizeWeights(prizes: Prize[]): Prize[] {
  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  if (total === 0) return prizes;
  
  return prizes.map(p => ({
    ...p,
    weight: Math.round((p.weight / total) * 100 * 10) / 10,
  }));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
