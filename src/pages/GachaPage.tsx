import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Matter from 'matter-js';
import { useGameState } from '../hooks/useGameState';
import { PrizeResult } from '../components/PrizeResult';
import { SettingsModal } from '../components/SettingsModal';
import { Prize, RARITY_LABELS } from '../types';

type DrawPhase = 'idle' | 'shaking' | 'settling' | 'dropping' | 'opening' | 'revealed';

const CAPSULE_COLORS = [
  { top: '#f472b6', bottom: '#fce7f3' },
  { top: '#a78bfa', bottom: '#ede9fe' },
  { top: '#60a5fa', bottom: '#dbeafe' },
  { top: '#34d399', bottom: '#d1fae5' },
  { top: '#fbbf24', bottom: '#fef3c7' },
  { top: '#fb923c', bottom: '#ffedd5' },
  { top: '#f87171', bottom: '#fee2e2' },
  { top: '#e879f9', bottom: '#fae8ff' },
];

export function GachaPage() {
  const { state, draw, updateSettings, addPrize, updatePrize, deletePrize, resetGame } = useGameState();
  const [drawPhase, setDrawPhase] = useState<DrawPhase>('idle');
  const [showResult, setShowResult] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [multiDrawResults, setMultiDrawResults] = useState<Prize[]>([]);
  const [showMultiResults, setShowMultiResults] = useState(false);
  const [exitingCapsule, setExitingCapsule] = useState<{ x: number; y: number; color: typeof CAPSULE_COLORS[0] } | null>(null);
  
  const prefersReducedMotion = useReducedMotion();
  const isSpinning = drawPhase !== 'idle';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderLoopRef = useRef<number | null>(null);
  const capsulesRef = useRef<Matter.Body[]>([]);

  const settings = state.gacha;
  const totalWeight = settings.prizes.reduce((sum, p) => sum + p.weight, 0);
  const availablePrizes = settings.trackStock
    ? settings.prizes.filter(p => p.stock === null || p.stock > 0)
    : settings.prizes;
  const canDraw = availablePrizes.length > 0 && totalWeight > 0;

  const initPhysics = useCallback(() => {
    if (!canvasRef.current || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.8 },
    });
    engineRef.current = engine;

    const wallOptions = { isStatic: true, restitution: 0.6, friction: 0.1 };
    
    const domeSegments = 24;
    const domeRadiusX = width * 0.42;
    const domeRadiusY = height * 0.42;
    
    for (let i = 0; i < domeSegments; i++) {
      const angle1 = (i / domeSegments) * Math.PI * 2;
      const angle2 = ((i + 1) / domeSegments) * Math.PI * 2;
      
      const x1 = centerX + Math.cos(angle1) * domeRadiusX;
      const y1 = centerY + Math.sin(angle1) * domeRadiusY;
      const x2 = centerX + Math.cos(angle2) * domeRadiusX;
      const y2 = centerY + Math.sin(angle2) * domeRadiusY;
      
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      
      const wall = Matter.Bodies.rectangle(midX, midY, length + 4, 8, {
        ...wallOptions,
        angle,
        render: { visible: false },
      });
      Matter.Composite.add(engine.world, wall);
    }

    const capsuleCount = Math.min(8, settings.prizes.length + 2);
    const capsules: Matter.Body[] = [];
    
    for (let i = 0; i < capsuleCount; i++) {
      const angle = (i / capsuleCount) * Math.PI * 2;
      const spawnRadius = domeRadiusX * 0.5;
      const x = centerX + Math.cos(angle) * spawnRadius * (0.3 + Math.random() * 0.5);
      const y = centerY + Math.sin(angle) * spawnRadius * 0.4 - 10;
      
      const capsule = Matter.Bodies.circle(x, y, 14, {
        restitution: 0.7,
        friction: 0.05,
        frictionAir: 0.01,
        density: 0.002,
        label: `capsule-${i}`,
        render: { visible: true },
      });
      
      (capsule as Matter.Body & { colorIndex: number }).colorIndex = i % CAPSULE_COLORS.length;
      
      capsules.push(capsule);
      Matter.Composite.add(engine.world, capsule);
    }
    
    capsulesRef.current = capsules;
  }, [prefersReducedMotion, settings.prizes.length]);

  const startShaking = useCallback(() => {
    if (!engineRef.current || prefersReducedMotion) return;

    const capsules = capsulesRef.current;

    const shakeInterval = setInterval(() => {
      capsules.forEach(capsule => {
        const forceMagnitude = 0.0008;
        const forceX = (Math.random() - 0.5) * forceMagnitude;
        const forceY = (Math.random() - 0.7) * forceMagnitude;
        Matter.Body.applyForce(capsule, capsule.position, { x: forceX, y: forceY });
      });
    }, 50);

    return () => clearInterval(shakeInterval);
  }, [prefersReducedMotion]);

  const renderPhysics = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = engineRef.current;
    const capsules = capsulesRef.current;

    Matter.Engine.update(engine, 1000 / 60);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    capsules.forEach(capsule => {
      const { x, y } = capsule.position;
      const colorIndex = (capsule as Matter.Body & { colorIndex: number }).colorIndex;
      const colors = CAPSULE_COLORS[colorIndex];
      const radius = 14;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(capsule.angle);

      ctx.beginPath();
      ctx.ellipse(0, 4, radius, radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors.bottom;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, -4, radius, radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors.top;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-radius, 0);
      ctx.lineTo(radius, 0);
      ctx.strokeStyle = 'rgba(128,128,128,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-4, -8, 4, 2, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();

      ctx.restore();
    });

    renderLoopRef.current = requestAnimationFrame(renderPhysics);
  }, []);

  const cleanupPhysics = useCallback(() => {
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      Matter.Composite.clear(engineRef.current.world, false);
      engineRef.current = null;
    }
    capsulesRef.current = [];
  }, []);

  useEffect(() => {
    return () => cleanupPhysics();
  }, [cleanupPhysics]);

  const handleDraw = useCallback(async () => {
    if (!canDraw || isSpinning) return;

    setCurrentPrize(null);
    setExitingCapsule(null);
    
    if (prefersReducedMotion) {
      setDrawPhase('shaking');
      await new Promise(resolve => setTimeout(resolve, 800));
      const prize = draw('gacha');
      setCurrentPrize(prize);
      setDrawPhase('idle');
      if (prize) setShowResult(true);
      return;
    }

    initPhysics();
    setDrawPhase('shaking');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    renderPhysics();
    
    const stopShaking = startShaking();
    await new Promise(resolve => setTimeout(resolve, 1800));
    stopShaking?.();

    setDrawPhase('settling');
    await new Promise(resolve => setTimeout(resolve, 600));

    const capsules = capsulesRef.current;
    if (capsules.length > 0) {
      let lowestCapsule = capsules[0];
      capsules.forEach(c => {
        if (c.position.y > lowestCapsule.position.y) {
          lowestCapsule = c;
        }
      });
      
      const colorIndex = (lowestCapsule as Matter.Body & { colorIndex: number }).colorIndex;
      setExitingCapsule({
        x: lowestCapsule.position.x,
        y: lowestCapsule.position.y,
        color: CAPSULE_COLORS[colorIndex],
      });
      
      Matter.Composite.remove(engineRef.current!.world, lowestCapsule);
      capsulesRef.current = capsules.filter(c => c !== lowestCapsule);
    }

    setDrawPhase('dropping');
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const prize = draw('gacha');
    setCurrentPrize(prize);
    
    setDrawPhase('opening');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    cleanupPhysics();
    setDrawPhase('idle');
    setExitingCapsule(null);
    
    if (prize) {
      setShowResult(true);
    }
  }, [canDraw, isSpinning, draw, prefersReducedMotion, initPhysics, renderPhysics, startShaking, cleanupPhysics]);

  const handleMultiDraw = useCallback(async (count: number) => {
    if (!canDraw || isSpinning) return;

    setMultiDrawResults([]);
    setExitingCapsule(null);
    
    if (prefersReducedMotion) {
      setDrawPhase('shaking');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const results: Prize[] = [];
      for (let i = 0; i < count; i++) {
        const prize = draw('gacha');
        if (prize) results.push(prize);
      }
      setMultiDrawResults(results);
      setDrawPhase('idle');
      setShowMultiResults(true);
      return;
    }

    initPhysics();
    setDrawPhase('shaking');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    renderPhysics();
    
    const stopShaking = startShaking();
    await new Promise(resolve => setTimeout(resolve, 2200));
    stopShaking?.();

    setDrawPhase('settling');
    
    const results: Prize[] = [];
    
    for (let i = 0; i < count; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const capsules = capsulesRef.current;
      if (capsules.length > 0) {
        let lowestCapsule = capsules[0];
        capsules.forEach(c => {
          if (c.position.y > lowestCapsule.position.y) {
            lowestCapsule = c;
          }
        });
        
        Matter.Composite.remove(engineRef.current!.world, lowestCapsule);
        capsulesRef.current = capsules.filter(c => c !== lowestCapsule);
      }
      
      const prize = draw('gacha');
      if (prize) results.push(prize);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    
    cleanupPhysics();
    setMultiDrawResults(results);
    setDrawPhase('idle');
    setShowMultiResults(true);
  }, [canDraw, isSpinning, draw, prefersReducedMotion, initPhysics, renderPhysics, startShaking, cleanupPhysics]);

  const getCapsuleColor = (prize: Prize | null) => {
    if (!prize) return CAPSULE_COLORS[0];
    if (prize.rarity === 'legendary') return { top: '#fbbf24', bottom: '#fef3c7' };
    if (prize.rarity === 'epic') return { top: '#a855f7', bottom: '#f3e8ff' };
    if (prize.rarity === 'rare') return { top: '#3b82f6', bottom: '#dbeafe' };
    if (prize.rarity === 'uncommon') return { top: '#22c55e', bottom: '#dcfce7' };
    return { top: '#ec4899', bottom: '#fce7f3' };
  };

  const finalCapsuleColor = currentPrize ? getCapsuleColor(currentPrize) : (exitingCapsule?.color || CAPSULE_COLORS[0]);

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
          <motion.div 
            className="relative w-72 sm:w-96 h-[26rem] sm:h-[32rem]"
            animate={
              drawPhase === 'shaking' && !prefersReducedMotion
                ? { x: [0, -3, 3, -2, 2, -1, 1, 0], rotate: [0, -0.5, 0.5, -0.3, 0.3, 0] }
                : { x: 0, rotate: 0 }
            }
            transition={
              drawPhase === 'shaking'
                ? { duration: 0.15, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.3 }
            }
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
              </defs>

              <rect x="15" y="25" width="170" height="230" rx="20" fill="url(#machineBodyDark)" />
              <rect x="20" y="30" width="160" height="220" rx="18" fill="url(#machineBody)" />
              
              <ellipse cx="100" cy="95" rx="58" ry="53" fill="url(#metalRim)" />
              <ellipse cx="100" cy="95" rx="55" ry="50" fill="#1a1a2e" />

              <AnimatePresence>
                {(drawPhase === 'shaking' || drawPhase === 'settling') && !prefersReducedMotion && (
                  <>
                    {[0, 1, 2].map(i => (
                      <motion.circle
                        key={`light-left-${i}`}
                        cx={30}
                        cy={55 + i * 25}
                        r="6"
                        fill="#fbbf24"
                        filter="url(#glow)"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                    {[0, 1, 2].map(i => (
                      <motion.circle
                        key={`light-right-${i}`}
                        cx={170}
                        cy={55 + i * 25}
                        r="6"
                        fill="#fbbf24"
                        filter="url(#glow)"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.08 + 0.1 }}
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
                animate={drawPhase === 'shaking' ? { rotate: [0, -20, 20, -15, 15, -10, 10, 0] } : { rotate: 0 }}
                transition={{ duration: 0.4, repeat: drawPhase === 'shaking' ? Infinity : 0 }}
                style={{ transformOrigin: '165px 185px' }}
              >
                <circle cx="165" cy="185" r="20" fill="url(#metalRim)" />
                <circle cx="165" cy="185" r="16" fill="#fbbf24" />
                <circle cx="165" cy="185" r="12" fill="#f59e0b" />
                <text x="165" y="190" textAnchor="middle" fill="#78350f" fontSize="14" fontWeight="bold">轉</text>
              </motion.g>
            </svg>

            {!prefersReducedMotion && (
              <div 
                className="absolute overflow-hidden rounded-full"
                style={{
                  left: '22.5%',
                  top: '14%',
                  width: '55%',
                  height: '32%',
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={180}
                  height={130}
                  className="w-full h-full"
                  style={{ background: 'transparent' }}
                />
              </div>
            )}

            {prefersReducedMotion && drawPhase !== 'idle' && (
              <div 
                className="absolute flex flex-wrap justify-center items-center gap-1 p-2"
                style={{
                  left: '25%',
                  top: '16%',
                  width: '50%',
                  height: '28%',
                }}
              >
                {CAPSULE_COLORS.slice(0, 6).map((colors, i) => (
                  <motion.div
                    key={i}
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, ${colors.top} 50%, ${colors.bottom} 50%)`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                    animate={drawPhase === 'shaking' ? { y: [0, -5, 0] } : {}}
                    transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            )}

            <AnimatePresence>
              {(drawPhase === 'dropping' || drawPhase === 'opening') && (
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: '58%' }}
                  initial={{ y: -80, opacity: 0, scale: 0.6, rotate: 0 }}
                  animate={
                    drawPhase === 'dropping'
                      ? {
                          y: [prefersReducedMotion ? 0 : -80, 60, 45, 55, 48],
                          opacity: 1,
                          scale: 1,
                          rotate: prefersReducedMotion ? 0 : [0, 180, 360, 480, 540],
                        }
                      : drawPhase === 'opening'
                      ? {
                          scale: [1, 1.4, 0],
                          opacity: [1, 1, 0],
                          y: 48,
                        }
                      : {}
                  }
                  transition={
                    drawPhase === 'dropping'
                      ? { 
                          duration: prefersReducedMotion ? 0.4 : 0.9, 
                          ease: [0.36, 0, 0.66, -0.56],
                          times: [0, 0.5, 0.7, 0.85, 1],
                        }
                      : { duration: prefersReducedMotion ? 0.3 : 0.6, ease: 'easeOut' }
                  }
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                      <ellipse cx="50" cy="60" rx="38" ry="32" fill={finalCapsuleColor.bottom} />
                      <ellipse cx="50" cy="40" rx="38" ry="32" fill={finalCapsuleColor.top} />
                      <rect x="12" y="40" width="76" height="20" fill={finalCapsuleColor.bottom} />
                      <line x1="12" y1="50" x2="88" y2="50" stroke="rgba(128,128,128,0.6)" strokeWidth="3" />
                      <ellipse cx="50" cy="40" rx="38" ry="32" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                      <ellipse cx="35" cy="30" rx="10" ry="5" fill="rgba(255,255,255,0.4)" transform="rotate(-15 35 30)" />
                    </svg>
                    
                    {drawPhase === 'opening' && !prefersReducedMotion && (
                      <motion.div className="absolute inset-0 flex items-center justify-center">
                        {[...Array(16)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full"
                            style={{
                              background: ['#fbbf24', '#ec4899', '#a855f7', '#3b82f6', '#22c55e'][i % 5],
                            }}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                            animate={{
                              x: Math.cos((i / 16) * Math.PI * 2) * 80,
                              y: Math.sin((i / 16) * Math.PI * 2) * 80,
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
              {(drawPhase === 'shaking' || drawPhase === 'settling') && !prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.4, 0],
                    boxShadow: [
                      '0 0 0 0 rgba(251, 191, 36, 0)',
                      '0 0 40px 15px rgba(251, 191, 36, 0.5)',
                      '0 0 0 0 rgba(251, 191, 36, 0)',
                    ],
                  }}
                  transition={{ duration: 0.4, repeat: Infinity }}
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
              {drawPhase === 'shaking' ? '轉動中...' : drawPhase === 'settling' ? '掉落中...' : '開獎中...'}
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
