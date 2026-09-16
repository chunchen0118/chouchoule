import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { GameState, GameType, Prize, DrawRecord, GameSettings } from '../types';
import { defaultGachaSettings, defaultCardSettings, defaultScratchSettings } from '../data/defaultPrizes';
import { weightedRandom, generateId } from '../utils/random';

const initialState: GameState = {
  gacha: defaultGachaSettings,
  cards: defaultCardSettings,
  scratch: defaultScratchSettings,
  history: [],
  stats: {
    totalDraws: 0,
    lastDrawTime: null,
  },
};

export function useGameState() {
  const [state, setState] = useLocalStorage<GameState>('gacha-fun-state', initialState);

  const draw = useCallback((gameType: GameType): Prize | null => {
    const settings = state[gameType];
    const prize = weightedRandom(settings.prizes, settings.trackStock);
    
    if (!prize) return null;

    const record: DrawRecord = {
      id: generateId(),
      gameType,
      prize,
      timestamp: Date.now(),
    };

    setState(prev => {
      const newPrizes = settings.trackStock && prize.stock !== null
        ? prev[gameType].prizes.map(p =>
            p.id === prize.id ? { ...p, stock: Math.max(0, (p.stock ?? 1) - 1) } : p
          )
        : prev[gameType].prizes;

      return {
        ...prev,
        [gameType]: {
          ...prev[gameType],
          prizes: newPrizes,
        },
        history: [record, ...prev.history].slice(0, 100),
        stats: {
          totalDraws: prev.stats.totalDraws + 1,
          lastDrawTime: Date.now(),
        },
      };
    });

    return prize;
  }, [state, setState]);

  const updateSettings = useCallback((gameType: GameType, settings: Partial<GameSettings>) => {
    setState(prev => ({
      ...prev,
      [gameType]: {
        ...prev[gameType],
        ...settings,
      },
    }));
  }, [setState]);

  const addPrize = useCallback((gameType: GameType, prize: Omit<Prize, 'id'>) => {
    setState(prev => ({
      ...prev,
      [gameType]: {
        ...prev[gameType],
        prizes: [...prev[gameType].prizes, { ...prize, id: generateId() }],
      },
    }));
  }, [setState]);

  const updatePrize = useCallback((gameType: GameType, prizeId: string, updates: Partial<Prize>) => {
    setState(prev => ({
      ...prev,
      [gameType]: {
        ...prev[gameType],
        prizes: prev[gameType].prizes.map(p =>
          p.id === prizeId ? { ...p, ...updates } : p
        ),
      },
    }));
  }, [setState]);

  const deletePrize = useCallback((gameType: GameType, prizeId: string) => {
    setState(prev => ({
      ...prev,
      [gameType]: {
        ...prev[gameType],
        prizes: prev[gameType].prizes.filter(p => p.id !== prizeId),
      },
    }));
  }, [setState]);

  const resetGame = useCallback((gameType: GameType) => {
    const defaults = {
      gacha: defaultGachaSettings,
      cards: defaultCardSettings,
      scratch: defaultScratchSettings,
    };
    setState(prev => ({
      ...prev,
      [gameType]: { ...defaults[gameType] },
    }));
  }, [setState]);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [],
      stats: {
        totalDraws: 0,
        lastDrawTime: null,
      },
    }));
  }, [setState]);

  return {
    state,
    draw,
    updateSettings,
    addPrize,
    updatePrize,
    deletePrize,
    resetGame,
    clearHistory,
  };
}
