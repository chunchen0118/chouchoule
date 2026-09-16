import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { PrizeResult } from '../components/PrizeResult';
import { SettingsModal } from '../components/SettingsModal';
import { Prize, RARITY_LABELS, RARITY_COLORS } from '../types';

type DrawPhase = 'idle' | 'shaking' | 'dropping' | 'opening' | 'revealed';

export function GachaPage() {
  const { state, draw, updateSettings, addPrize, updatePrize, deletePrize, resetGame } = useGameState();
  const [drawPhase, setDrawPhase] = useState<DrawPhase>('idle');
  const [showResult, setShowResult] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [multiDrawResults, setMultiDrawResults] = useState<Prize[]>([]);
  const [showMultiResults, setShowMultiResults] = useState(false);
  const [drumRotation, setDrumRotation] = useState(0);
  
  const prefersReducedMotion = useReducedMotion();
  const isSpinning = drawPhase !== 'idle';

  const settings = state.gacha;
  const totalWeight = settings.prizes.reduce((sum, p) => sum + p.weight, 0);
  const availablePrizes = settings.trackStock
    ? settings.prizes.filter(p => p.stock === null || p.stock > 0)
    : settings.prizes;
  const canDraw = availablePrizes.length > 0 && totalWeight > 0;

  useEffect(() => {
    if (drawPhase === 'shaking') {
      const interval = setInterval(() => {
        setDrumRotation(prev => prev + 45);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [drawPhase]);

  const handleDraw = useCallback(async () => {
    if (!canDraw || isSpinning) return;

    setCurrentPrize(null);
    
    const shakeDuration = prefersReducedMotion ? 800 : 1500;
    const dropDuration = prefersReducedMotion ? 400 : 800;
    const openDuration = prefersReducedMotion ? 300 : 600;

    setDrawPhase('shaking');
    await new Promise(resolve => setTimeout(resolve, shakeDuration));
    
    setDrawPhase('dropping');
    await new Promise(resolve => setTimeout(resolve, dropDuration));
    
    const prize = draw('gacha');
    setCurrentPrize(prize);
    
    setDrawPhase('opening');
    await new Promise(resolve => setTimeout(resolve, openDuration));
    
    setDrawPhase('idle');
    
    if (prize) {
      setShowResult(true);
    }
  }, [canDraw, isSpinning, draw, prefersReducedMotion]);

  const handleMultiDraw = useCallback(async (count: number) => {
    if (!canDraw || isSpinning) return;

    setMultiDrawResults([]);
    
    const shakeDuration = prefersReducedMotion ? 1000 : 2000;

    setDrawPhase('shaking');
    await new Promise(resolve => setTimeout(resolve, shakeDuration));

    const results: Prize[] = [];
    for (let i = 0; i < count; i++) {
      const prize = draw('gacha');
      if (prize) results.push(prize);
    }

    setMultiDrawResults(results);
    setDrawPhase('idle');
    setShowMultiResults(true);
  }, [canDraw, isSpinning, draw, prefersReducedMotion]);

  const machineShakeVariants = {
    idle: { x: 0, rotate: 0 },
    shaking: prefersReducedMotion 
      ? { x: 0, rotate: 0 }
      : {
          x: [0, -3, 3, -3, 3, -2, 2, 0],
          rotate: [0, -1, 1, -1, 1, 0],
          transition: {
            duration: 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
    dropping: { x: 0, rotate: 0 },
    opening: { x: 0, rotate: 0 },
    revealed: { x: 0, rotate: 0 },
  };

  const capsuleColors = currentPrize ? {
    top: RARITY_COLORS[currentPrize.rarity].includes('yellow') ? '#fbbf24' : 
         RARITY_COLORS[currentPrize.rarity].includes('purple') ? '#a855f7' :
         RARITY_COLORS[currentPrize.rarity].includes('blue') ? '#3b82f6' :
         RARITY_COLORS[currentPrize.rarity].includes('green') ? '#22c55e' : '#ec4899',
    bottom: '#f5f5f5',
  } : { top: '#ec4899', bottom: '#f5f5f5' };

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
          variants={machineShakeVariants}
        >
          <motion.div 
            className="relative w-72 sm:w-96 h-[26rem] sm:h-[32rem]"
            animate={drawPhase}
            variants={machineShakeVariants}
          >
            <svg viewBox="0 0 200 280" className="w-full h-full drop-shadow-2xl">
              <defs>
                <linearGradient id="machineBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="machineBodyDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#be185d" />
                  <stop offset="100%" stopColor="#6b21a8" />
                </linearGradient>
                <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
                </linearGradient>
                <linearGradient id="metalRim" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <clipPath id="domeClip">
                  <ellipse cx="100" cy="95" rx="55" ry="50" />
                </clipPath>
              </defs>

              <rect x="15" y="25" width="170" height="230" rx="20" fill="url(#machineBodyDark)" />
              <rect x="20" y="30" width="160" height="220" rx="18" fill="url(#machineBody)" />
              
              <ellipse cx="100" cy="95" rx="58" ry="53" fill="url(#metalRim)" />
              <ellipse cx="100" cy="95" rx="55" ry="50" fill="#1a1a2e" />
              <ellipse cx="100" cy="95" rx="55" ry="50" fill="url(#glass)" />

              <g clipPath="url(#domeClip)">
                <motion.g
                  animate={{ rotate: drawPhase === 'shaking' ? drumRotation : 0 }}
                  style={{ transformOrigin: '100px 95px' }}
                >
                  {settings.prizes.slice(0, 8).map((prize, i) => {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = 35;
                    const x = 100 + Math.cos(angle) * radius;
                    const y = 95 + Math.sin(angle) * radius * 0.8;
                    const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#f87171', '#e879f9'];
                    return (
                      <g key={i}>
                        <ellipse cx={x} cy={y} rx="14" ry="12" fill={colors[i % colors.length]} />
                        <ellipse cx={x} cy={y - 6} rx="14" ry="6" fill={colors[(i + 4) % colors.length]} />
                        <ellipse cx={x - 4} cy={y - 8} rx="3" ry="2" fill="rgba(255,255,255,0.5)" />
                        <text x={x} y={y + 3} textAnchor="middle" fontSize="10">{prize.emoji}</text>
                      </g>
                    );
                  })}
                </motion.g>
              </g>

              <ellipse cx="100" cy="95" rx="55" ry="50" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <ellipse cx="75" cy="70" rx="20" ry="10" fill="rgba(255,255,255,0.15)" transform="rotate(-20 75 70)" />

              <AnimatePresence>
                {drawPhase === 'shaking' && !prefersReducedMotion && (
                  <>
                    {[0, 1, 2].map(i => (
                      <motion.circle
                        key={`light-left-${i}`}
                        cx={30}
                        cy={60 + i * 25}
                        r="6"
                        fill="#fbbf24"
                        filter="url(#glow)"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                    {[0, 1, 2].map(i => (
                      <motion.circle
                        key={`light-right-${i}`}
                        cx={170}
                        cy={60 + i * 25}
                        r="6"
                        fill="#fbbf24"
                        filter="url(#glow)"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 + 0.15 }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              <rect x="35" y="160" width="130" height="8" rx="4" fill="#374151" />

              <path d="M 85 168 L 85 200 Q 85 210 95 210 L 105 210 Q 115 210 115 200 L 115 168" fill="#374151" />
              <path d="M 88 170 L 88 198 Q 88 205 95 205 L 105 205 Q 112 205 112 198 L 112 170" fill="#1f2937" />

              <rect x="55" y="220" width="90" height="35" rx="8" fill="#1f2937" />
              <rect x="60" y="225" width="80" height="25" rx="5" fill="#111827" />

              <motion.g
                animate={drawPhase === 'shaking' ? { rotate: [0, -15, 15, -10, 10, 0] } : { rotate: 0 }}
                transition={{ duration: 0.5, repeat: drawPhase === 'shaking' ? Infinity : 0 }}
                style={{ transformOrigin: '160px 185px' }}
              >
                <circle cx="165" cy="185" r="20" fill="url(#metalRim)" />
                <circle cx="165" cy="185" r="16" fill="#fbbf24" />
                <circle cx="165" cy="185" r="12" fill="#f59e0b" />
                <motion.text 
                  x="165" 
                  y="190" 
                  textAnchor="middle" 
                  fill="#78350f" 
                  fontSize="14" 
                  fontWeight="bold"
                  animate={drawPhase === 'shaking' ? { scale: [1, 0.9, 1] } : {}}
                  transition={{ duration: 0.2, repeat: drawPhase === 'shaking' ? Infinity : 0 }}
                >
                  轉
                </motion.text>
              </motion.g>
            </svg>

            <AnimatePresence>
              {(drawPhase === 'dropping' || drawPhase === 'opening') && (
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: '58%' }}
                  initial={{ y: -60, opacity: 0, scale: 0.5 }}
                  animate={
                    drawPhase === 'dropping'
                      ? {
                          y: [prefersReducedMotion ? 0 : -60, prefersReducedMotion ? 40 : 50, prefersReducedMotion ? 35 : 40],
                          opacity: 1,
                          scale: 1,
                          rotate: prefersReducedMotion ? 0 : [0, 180, 360, 540, 600],
                        }
                      : drawPhase === 'opening'
                      ? {
                          scale: [1, 1.3, 0],
                          opacity: [1, 1, 0],
                          y: 40,
                        }
                      : {}
                  }
                  transition={
                    drawPhase === 'dropping'
                      ? { duration: prefersReducedMotion ? 0.4 : 0.8, ease: [0.34, 1.56, 0.64, 1] }
                      : { duration: prefersReducedMotion ? 0.3 : 0.6, ease: 'easeOut' }
                  }
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                      <defs>
                        <linearGradient id="capsuleTop" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={capsuleColors.top} />
                          <stop offset="100%" stopColor={capsuleColors.top} style={{ filter: 'brightness(0.8)' }} />
                        </linearGradient>
                        <linearGradient id="capsuleBottom" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#e5e5e5" />
                          <stop offset="100%" stopColor="#d4d4d4" />
                        </linearGradient>
                      </defs>
                      
                      <ellipse cx="50" cy="65" rx="38" ry="30" fill="url(#capsuleBottom)" />
                      <ellipse cx="50" cy="35" rx="38" ry="30" fill={capsuleColors.top} />
                      
                      <rect x="12" y="35" width="76" height="30" fill="url(#capsuleBottom)" />
                      
                      <line x1="12" y1="50" x2="88" y2="50" stroke="#9ca3af" strokeWidth="3" />
                      
                      <ellipse cx="50" cy="35" rx="38" ry="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                      <ellipse cx="50" cy="65" rx="38" ry="30" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                      
                      <ellipse cx="35" cy="28" rx="12" ry="6" fill="rgba(255,255,255,0.4)" transform="rotate(-15 35 28)" />
                    </svg>
                    
                    {drawPhase === 'opening' && !prefersReducedMotion && (
                      <motion.div className="absolute inset-0 flex items-center justify-center">
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              background: ['#fbbf24', '#ec4899', '#a855f7', '#3b82f6'][i % 4],
                            }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{
                              x: Math.cos((i / 12) * Math.PI * 2) * 60,
                              y: Math.sin((i / 12) * Math.PI * 2) * 60,
                              opacity: 0,
                              scale: [1, 1.5, 0],
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {drawPhase === 'shaking' && !prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.3, 0],
                    boxShadow: [
                      '0 0 0 0 rgba(251, 191, 36, 0)',
                      '0 0 30px 10px rgba(251, 191, 36, 0.4)',
                      '0 0 0 0 rgba(251, 191, 36, 0)',
                    ],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <motion.button
          onClick={handleDraw}
          disabled={!canDraw || isSpinning}
          className="btn-primary text-xl px-8 py-4 min-w-[200px]"
          whileHover={!isSpinning ? { scale: 1.05 } : {}}
          whileTap={!isSpinning ? { scale: 0.95 } : {}}
        >
          {isSpinning ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⚙️
              </motion.span>
              轉動中...
            </span>
          ) : (
            '🪙 投幣抽獎！'
          )}
        </motion.button>

        <div className="flex gap-2">
          <button
            onClick={() => handleMultiDraw(5)}
            disabled={!canDraw || isSpinning}
            className="btn-secondary"
          >
            {isSpinning ? '...' : '5連抽'}
          </button>
          <button
            onClick={() => handleMultiDraw(10)}
            disabled={!canDraw || isSpinning}
            className="btn-secondary"
          >
            {isSpinning ? '...' : '10連抽'}
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
