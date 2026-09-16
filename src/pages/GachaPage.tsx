import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { PrizeResult } from '../components/PrizeResult';
import { SettingsModal } from '../components/SettingsModal';
import { Prize, RARITY_LABELS } from '../types';

export function GachaPage() {
  const { state, draw, updateSettings, addPrize, updatePrize, deletePrize, resetGame } = useGameState();
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [multiDrawResults, setMultiDrawResults] = useState<Prize[]>([]);
  const [showMultiResults, setShowMultiResults] = useState(false);

  const settings = state.gacha;
  const totalWeight = settings.prizes.reduce((sum, p) => sum + p.weight, 0);
  const availablePrizes = settings.trackStock
    ? settings.prizes.filter(p => p.stock === null || p.stock > 0)
    : settings.prizes;
  const canDraw = availablePrizes.length > 0 && totalWeight > 0;

  const handleDraw = useCallback(async () => {
    if (!canDraw || isSpinning) return;

    setIsSpinning(true);
    setCurrentPrize(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const prize = draw('gacha');
    setCurrentPrize(prize);
    setIsSpinning(false);
    
    if (prize) {
      setShowResult(true);
    }
  }, [canDraw, isSpinning, draw]);

  const handleMultiDraw = useCallback(async (count: number) => {
    if (!canDraw || isSpinning) return;

    setIsSpinning(true);
    setMultiDrawResults([]);

    await new Promise(resolve => setTimeout(resolve, 2500));

    const results: Prize[] = [];
    for (let i = 0; i < count; i++) {
      const prize = draw('gacha');
      if (prize) results.push(prize);
    }

    setMultiDrawResults(results);
    setIsSpinning(false);
    setShowMultiResults(true);
  }, [canDraw, isSpinning, draw]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.h1
          className="text-3xl sm:text-4xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎰 扭蛋機
        </motion.h1>
        <p className="text-white/60">投入硬幣，轉動扭蛋機，看看會抽到什麼！</p>
      </div>

      <div className="flex justify-center">
        <motion.div
          className="relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="relative w-64 sm:w-80 h-96 sm:h-[28rem]">
            <svg viewBox="0 0 200 280" className="w-full h-full">
              <defs>
                <linearGradient id="machineBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
                <radialGradient id="capsuleBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </radialGradient>
              </defs>

              <rect x="20" y="30" width="160" height="220" rx="20" fill="url(#machineBody)" />
              
              <ellipse cx="100" cy="100" rx="60" ry="55" fill="url(#glass)" stroke="#fff" strokeWidth="3" />
              
              <rect x="40" y="180" width="120" height="50" rx="10" fill="#1f2937" />
              
              <circle cx="160" cy="205" r="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />
              <text x="160" y="210" textAnchor="middle" fill="#78350f" fontSize="12" fontWeight="bold">轉</text>

              <rect x="60" y="240" width="80" height="30" rx="5" fill="#374151" />
              <rect x="70" y="250" width="60" height="15" rx="3" fill="#111827" />
            </svg>

            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-28 h-24 overflow-hidden">
              <AnimatePresence mode="wait">
                {isSpinning ? (
                  <motion.div
                    key="spinning"
                    className="flex flex-wrap justify-center gap-1"
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                    }}
                  >
                    {settings.prizes.slice(0, 6).map((prize, i) => (
                      <motion.div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-lg shadow-lg"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      >
                        {prize.emoji}
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="static"
                    className="flex flex-wrap justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {settings.prizes.slice(0, 6).map((prize, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-lg shadow-lg"
                      >
                        {prize.emoji}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {isSpinning && (
                <motion.div
                  className="absolute bottom-[15%] left-1/2 -translate-x-1/2"
                  initial={{ scale: 0, y: -50 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    y: [-50, 10, 0],
                    rotate: [0, 360, 720],
                  }}
                  exit={{ scale: 0, y: 50 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg flex items-center justify-center">
                    <span className="text-2xl">❓</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <motion.button
          onClick={handleDraw}
          disabled={!canDraw || isSpinning}
          className="btn-primary text-xl px-8 py-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSpinning ? '🎲 轉動中...' : '🪙 投幣抽獎！'}
        </motion.button>

        <div className="flex gap-2">
          <button
            onClick={() => handleMultiDraw(5)}
            disabled={!canDraw || isSpinning}
            className="btn-secondary"
          >
            5連抽
          </button>
          <button
            onClick={() => handleMultiDraw(10)}
            disabled={!canDraw || isSpinning}
            className="btn-secondary"
          >
            10連抽
          </button>
        </div>

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
        className="game-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-bold mb-4">獎品池</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                <div className="text-3xl mb-2">{prize.emoji}</div>
                <p className="font-medium text-sm truncate">{prize.name}</p>
                <p className="text-xs text-white/50">
                  {RARITY_LABELS[prize.rarity]} · {probability}%
                </p>
                {settings.trackStock && prize.stock !== null && (
                  <p className="text-xs text-pink-400">
                    庫存: {prize.stock}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <PrizeResult
        prize={currentPrize}
        isVisible={showResult}
        onClose={() => setShowResult(false)}
      />

      <AnimatePresence>
        {showMultiResults && multiDrawResults.length > 0 && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMultiResults(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 text-center">
                🎉 {multiDrawResults.length}連抽結果！
              </h2>
              
              <div className="grid grid-cols-5 gap-4 mb-6">
                {multiDrawResults.map((prize, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-4xl mb-1">{prize.emoji}</div>
                    <p className="text-xs truncate">{prize.name}</p>
                    <p className="text-xs text-white/50">{RARITY_LABELS[prize.rarity]}</p>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => setShowMultiResults(false)}
                className="btn-primary w-full"
              >
                太棒了！
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        gameType="gacha"
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
