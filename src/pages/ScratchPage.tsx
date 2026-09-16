import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { SettingsModal } from '../components/SettingsModal';
import { Prize, RARITY_COLORS, RARITY_LABELS } from '../types';

interface ScratchCardDesign {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
  foilColor: string;
}

const scratchCardDesigns: ScratchCardDesign[] = [
  { id: 'gold', name: '黃金刮刮樂', emoji: '🏆', bgGradient: 'from-yellow-400 to-amber-600', foilColor: '#c0c0c0' },
  { id: 'diamond', name: '鑽石刮刮樂', emoji: '💎', bgGradient: 'from-cyan-400 to-blue-600', foilColor: '#b8d4e8' },
  { id: 'lucky', name: '幸運刮刮樂', emoji: '🍀', bgGradient: 'from-green-400 to-emerald-600', foilColor: '#a8d4a8' },
  { id: 'star', name: '星光刮刮樂', emoji: '⭐', bgGradient: 'from-purple-400 to-pink-600', foilColor: '#d4b8d4' },
];

const REVEAL_THRESHOLD = 0.45;

export function ScratchPage() {
  const { state, draw, updateSettings, addPrize, updatePrize, deletePrize, resetGame } = useGameState();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<ScratchCardDesign | null>(null);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const settings = state.scratch;
  const totalWeight = settings.prizes.reduce((sum, p) => sum + p.weight, 0);
  const availablePrizes = settings.trackStock
    ? settings.prizes.filter(p => p.stock === null || p.stock > 0)
    : settings.prizes;
  const canDraw = availablePrizes.length > 0 && totalWeight > 0;

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedDesign) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = selectedDesign.foilColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = '#888';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('刮開此處', rect.width / 2, rect.height / 2 - 10);
    ctx.font = '12px sans-serif';
    ctx.fillText('SCRATCH HERE', rect.width / 2, rect.height / 2 + 10);

    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * rect.width,
        Math.random() * rect.height,
        Math.random() * 3 + 1,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.fill();
    }
  }, [selectedDesign]);

  useEffect(() => {
    if (selectedDesign && !isRevealed) {
      const prize = draw('scratch');
      setCurrentPrize(prize);
      setScratchProgress(0);
      
      setTimeout(initCanvas, 100);
    }
  }, [selectedDesign, initCanvas, draw, isRevealed]);

  const calculateScratchProgress = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    return transparentPixels / (pixels.length / 4);
  }, []);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 25, 0, Math.PI * 2);
    ctx.fill();

    if (lastPosRef.current.x && lastPosRef.current.y) {
      ctx.beginPath();
      ctx.lineWidth = 50;
      ctx.lineCap = 'round';
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(canvasX, canvasY);
      ctx.stroke();
    }

    lastPosRef.current = { x: canvasX, y: canvasY };

    const progress = calculateScratchProgress();
    setScratchProgress(progress);

    if (progress >= REVEAL_THRESHOLD && !isRevealed) {
      setIsRevealed(true);
      setTimeout(() => setShowResult(true), 300);
    }
  }, [isRevealed, calculateScratchProgress]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDrawingRef.current = true;
    scratch(e.clientX, e.clientY);
  }, [scratch]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    scratch(e.clientX, e.clientY);
  }, [scratch]);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = { x: 0, y: 0 };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  }, [scratch]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  }, [scratch]);

  const handleTouchEnd = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = { x: 0, y: 0 };
  }, []);

  const handleSelectDesign = (design: ScratchCardDesign) => {
    if (!canDraw) return;
    setSelectedDesign(design);
    setIsRevealed(false);
    setShowResult(false);
    setCurrentPrize(null);
  };

  const handleReset = () => {
    setSelectedDesign(null);
    setCurrentPrize(null);
    setIsRevealed(false);
    setShowResult(false);
    setScratchProgress(0);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.h1
          className="text-3xl sm:text-4xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎫 刮刮樂
        </motion.h1>
        <p className="text-white/60">選擇一張刮刮樂，刮開銀漆揭曉你的獎品！</p>
      </div>

      <div className="flex justify-center gap-4">
        {selectedDesign && (
          <motion.button
            onClick={handleReset}
            className="btn-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🔄 選擇其他刮刮樂
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

      <AnimatePresence mode="wait">
        {!selectedDesign ? (
          <motion.div
            key="selection"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {scratchCardDesigns.map((design, i) => (
              <motion.button
                key={design.id}
                onClick={() => handleSelectDesign(design)}
                disabled={!canDraw}
                className={`game-card text-center ${!canDraw ? 'opacity-50 cursor-not-allowed' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={canDraw ? { scale: 1.05 } : undefined}
                whileTap={canDraw ? { scale: 0.95 } : undefined}
              >
                <div className={`w-full aspect-[3/4] rounded-xl bg-gradient-to-br ${design.bgGradient} mb-3 flex items-center justify-center shadow-lg`}>
                  <span className="text-5xl">{design.emoji}</span>
                </div>
                <p className="font-bold">{design.name}</p>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="scratch"
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="relative w-80 sm:w-96 aspect-[3/4] max-w-full">
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${selectedDesign.bgGradient} shadow-2xl overflow-hidden`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <motion.div
                    className="text-6xl sm:text-7xl mb-4"
                    animate={isRevealed ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {currentPrize?.emoji || '❓'}
                  </motion.div>
                  
                  {currentPrize && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: isRevealed ? 1 : 0.3, y: 0 }}
                    >
                      <h3 className="text-xl sm:text-2xl font-bold text-white text-shadow-lg mb-2">
                        {currentPrize.name}
                      </h3>
                      <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium bg-white/30 text-white`}>
                        {RARITY_LABELS[currentPrize.rarity]}
                      </span>
                    </motion.div>
                  )}
                </div>

                <div className="absolute top-4 left-4 text-3xl">{selectedDesign.emoji}</div>
                <div className="absolute top-4 right-4 text-3xl">{selectedDesign.emoji}</div>
                <div className="absolute bottom-4 left-4 text-3xl">{selectedDesign.emoji}</div>
                <div className="absolute bottom-4 right-4 text-3xl">{selectedDesign.emoji}</div>
              </div>

              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full rounded-2xl scratch-canvas ${
                  isRevealed ? 'opacity-0 pointer-events-none transition-opacity duration-500' : ''
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            {!isRevealed && (
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${scratchProgress * 100}%` }}
                  />
                </div>
                <p className="text-sm text-white/60">
                  刮開進度: {Math.round(scratchProgress * 100)}% 
                  {scratchProgress < REVEAL_THRESHOLD && ` (需達 ${REVEAL_THRESHOLD * 100}%)`}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="game-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
        {showResult && currentPrize && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResult(false)}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                className={`inline-block p-8 rounded-3xl bg-gradient-to-br ${RARITY_COLORS[currentPrize.rarity]} shadow-2xl`}
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
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  {currentPrize.emoji}
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">{currentPrize.name}</h2>
                <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm text-white">
                  {RARITY_LABELS[currentPrize.rarity]}
                </span>
              </motion.div>

              <motion.div
                className="mt-6 flex gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={() => {
                    setShowResult(false);
                    handleSelectDesign(selectedDesign!);
                  }}
                  className="btn-primary"
                >
                  再刮一張
                </button>
                <button
                  onClick={() => {
                    setShowResult(false);
                    handleReset();
                  }}
                  className="btn-secondary"
                >
                  換個款式
                </button>
              </motion.div>

              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl pointer-events-none"
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                  }}
                  transition={{ duration: 1.5, delay: Math.random() * 0.5 }}
                  style={{ left: '50%', top: '50%' }}
                >
                  {['✨', '🌟', '⭐', '💫', '🎉'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        gameType="scratch"
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
