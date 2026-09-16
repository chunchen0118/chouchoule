import { motion, AnimatePresence } from 'framer-motion';
import { Prize, RARITY_COLORS, RARITY_LABELS } from '../types';

interface PrizeResultProps {
  prize: Prize | null;
  isVisible: boolean;
  onClose: () => void;
}

export function PrizeResult({ prize, isVisible, onClose }: PrizeResultProps) {
  if (!prize) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              className={`inline-block p-8 rounded-3xl bg-gradient-to-br ${RARITY_COLORS[prize.rarity]} shadow-2xl`}
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
                className="text-8xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                {prize.emoji}
              </motion.div>
              
              <motion.h2
                className="text-2xl font-bold text-white text-shadow-lg mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {prize.name}
              </motion.h2>
              
              <motion.span
                className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {RARITY_LABELS[prize.rarity]}
              </motion.span>
            </motion.div>

            <motion.button
              className="mt-6 btn-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={onClose}
            >
              太棒了！
            </motion.button>

            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl pointer-events-none"
                initial={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.5,
                }}
                style={{
                  left: '50%',
                  top: '50%',
                }}
              >
                {['✨', '🌟', '⭐', '💫'][Math.floor(Math.random() * 4)]}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
