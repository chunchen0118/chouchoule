import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { SettingsModal } from '../components/SettingsModal';
import { Prize, RARITY_COLORS, RARITY_LABELS } from '../types';
import { shuffleArray } from '../utils/random';

interface CardState {
  id: number;
  flipped: boolean;
  prize: Prize | null;
}

export function CardsPage() {
  const { state, draw, updateSettings, addPrize, updatePrize, deletePrize, resetGame } = useGameState();
  const [showSettings, setShowSettings] = useState(false);
  const [cards, setCards] = useState<CardState[]>(() => 
    Array.from({ length: 12 }, (_, i) => ({ id: i, flipped: false, prize: null }))
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [revealedPrize, setRevealedPrize] = useState<Prize | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  const settings = state.cards;
  const totalWeight = settings.prizes.reduce((sum, p) => sum + p.weight, 0);
  const availablePrizes = settings.trackStock
    ? settings.prizes.filter(p => p.stock === null || p.stock > 0)
    : settings.prizes;
  const canDraw = availablePrizes.length > 0 && totalWeight > 0;

  const allFlipped = cards.every(c => c.flipped);
  const someFlipped = cards.some(c => c.flipped);

  const handleFlipCard = useCallback(async (cardId: number) => {
    if (!canDraw || isDrawing) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped) return;

    setIsDrawing(true);

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, flipped: true } : c
    ));

    await new Promise(resolve => setTimeout(resolve, 400));

    const prize = draw('cards');
    
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, prize } : c
    ));

    setRevealedPrize(prize);
    setIsDrawing(false);
    
    if (prize) {
      setTimeout(() => setShowPrizeModal(true), 500);
    }
  }, [canDraw, isDrawing, cards, draw]);

  const handleFlipAll = useCallback(async () => {
    if (!canDraw || isDrawing) return;

    setIsDrawing(true);
    const unflippedCards = cards.filter(c => !c.flipped);
    
    for (let i = 0; i < unflippedCards.length; i++) {
      const card = unflippedCards[i];
      
      setCards(prev => prev.map(c => 
        c.id === card.id ? { ...c, flipped: true } : c
      ));

      await new Promise(resolve => setTimeout(resolve, 150));

      const prize = draw('cards');
      
      setCards(prev => prev.map(c => 
        c.id === card.id ? { ...c, prize } : c
      ));
    }

    setIsDrawing(false);
  }, [canDraw, isDrawing, cards, draw]);

  const handleReset = useCallback(() => {
    setCards(Array.from({ length: 12 }, (_, i) => ({ id: i, flipped: false, prize: null })));
    setRevealedPrize(null);
  }, []);

  const cardBackPatterns = useMemo(() => 
    shuffleArray(['♠', '♥', '♦', '♣', '★', '☆', '◆', '●', '▲', '■', '♪', '✦']),
  []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.h1
          className="text-3xl sm:text-4xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🃏 卡牌抽抽樂
        </motion.h1>
        <p className="text-white/60">選擇一張卡牌翻開，看看你的命運！</p>
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        {!allFlipped && (
          <motion.button
            onClick={handleFlipAll}
            disabled={!canDraw || isDrawing}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎴 全部翻開
          </motion.button>
        )}
        
        {someFlipped && (
          <motion.button
            onClick={handleReset}
            className="btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 重新開始
          </motion.button>
        )}

        <button
          onClick={() => setShowSettings(true)}
          className="btn-secondary"
        >
          ⚙️ 設定
        </button>
      </div>

      {!canDraw && (
        <motion.p
          className="text-center text-yellow-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ⚠️ 目前沒有可抽取的獎品，請在設定中新增或補充庫存
        </motion.p>
      )}

      <motion.div
        className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="card-container aspect-[3/4] cursor-pointer"
            initial={{ opacity: 0, rotateY: 180 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleFlipCard(card.id)}
          >
            <div className={`card-inner ${card.flipped ? 'flipped' : ''}`}>
              <div className="card-face card-back flex flex-col items-center justify-center p-2 shadow-lg border-2 border-purple-400">
                <div className="text-4xl sm:text-5xl text-white/80 mb-2">
                  {cardBackPatterns[index % cardBackPatterns.length]}
                </div>
                <div className="text-xs text-white/60 font-medium">點擊翻牌</div>
                
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  />
                </div>
              </div>

              <div className={`card-face card-front flex flex-col items-center justify-center p-2 shadow-lg border-2 ${
                card.prize ? `border-${card.prize.rarity === 'legendary' ? 'yellow' : card.prize.rarity === 'epic' ? 'purple' : 'white'}-400` : 'border-orange-400'
              }`}>
                {card.prize ? (
                  <>
                    <motion.div
                      className="text-4xl sm:text-5xl mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.3 }}
                    >
                      {card.prize.emoji}
                    </motion.div>
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate max-w-full px-1">
                        {card.prize.name}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gradient-to-r ${RARITY_COLORS[card.prize.rarity]} text-white`}>
                        {RARITY_LABELS[card.prize.rarity]}
                      </span>
                    </motion.div>

                    {(card.prize.rarity === 'legendary' || card.prize.rarity === 'epic') && (
                      <motion.div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        animate={{
                          boxShadow: [
                            '0 0 10px rgba(251, 191, 36, 0.5)',
                            '0 0 30px rgba(251, 191, 36, 0.8)',
                            '0 0 10px rgba(251, 191, 36, 0.5)',
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-4xl">❓</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="game-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-bold mb-4">獎品池</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {settings.prizes.map(prize => {
            const probability = totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : '0';
            const isAvailable = !settings.trackStock || prize.stock === null || prize.stock > 0;
            
            return (
              <div
                key={prize.id}
                className={`p-3 rounded-lg bg-white/5 border border-white/10 ${
                  !isAvailable ? 'opacity-40' : ''
                }`}
              >
                <div className="text-2xl mb-1">{prize.emoji}</div>
                <p className="font-medium text-sm truncate">{prize.name}</p>
                <p className="text-xs text-white/50">
                  {RARITY_LABELS[prize.rarity]} · {probability}%
                </p>
                {settings.trackStock && prize.stock !== null && (
                  <p className="text-xs text-pink-400">庫存: {prize.stock}</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {showPrizeModal && revealedPrize && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPrizeModal(false)}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                className={`inline-block p-8 rounded-3xl bg-gradient-to-br ${RARITY_COLORS[revealedPrize.rarity]} shadow-2xl`}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255,255,255,0.3)',
                    '0 0 60px rgba(255,255,255,0.6)',
                    '0 0 20px rgba(255,255,255,0.3)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <motion.div
                  className="text-7xl mb-4"
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 1, delay: 0.3 }}
                >
                  {revealedPrize.emoji}
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">{revealedPrize.name}</h2>
                <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm text-white">
                  {RARITY_LABELS[revealedPrize.rarity]}
                </span>
              </motion.div>

              <motion.button
                className="mt-6 btn-primary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShowPrizeModal(false)}
              >
                繼續翻牌
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        gameType="cards"
        settings={settings}
        onUpdateSettings={updateSettings}
        onAddPrize={addPrize}
        onUpdatePrize={updatePrize}
        onDeletePrize={deletePrize}
        onReset={resetGame}
      />
    </div>
  );
}
