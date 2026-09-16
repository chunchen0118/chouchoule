import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameState } from '../hooks/useGameState';
import { RARITY_LABELS } from '../types';

const gameCards = [
  {
    path: '/gacha',
    title: '扭蛋機',
    emoji: '🎰',
    description: '投入硬幣，扭出驚喜！各種稀有獎品等你來抽',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    path: '/cards',
    title: '卡牌抽抽樂',
    emoji: '🃏',
    description: '翻開神秘卡牌，發現你的命運之卡',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    path: '/scratch',
    title: '刮刮樂',
    emoji: '🎫',
    description: '刮開銀漆，揭曉你的幸運獎品',
    gradient: 'from-amber-500 to-orange-600',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Dashboard() {
  const { state, clearHistory } = useGameState();

  const lastDraw = state.history[0];
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameLabel = (gameType: string) => {
    const labels: Record<string, string> = {
      gacha: '扭蛋',
      cards: '卡牌',
      scratch: '刮刮樂',
    };
    return labels[gameType] || gameType;
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.h1
          className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{ backgroundSize: '200% 200%' }}
        >
          歡迎來到抽抽樂！
        </motion.h1>
        <p className="text-white/70 text-lg">
          選擇你的幸運遊戲，開始抽獎冒險吧！
        </p>
      </motion.div>

      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="game-card">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-3xl font-bold text-white">{state.stats.totalDraws}</div>
          <div className="text-white/60 text-sm">總抽獎次數</div>
        </motion.div>

        <motion.div variants={itemVariants} className="game-card">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-xl font-bold text-white truncate">
            {lastDraw ? lastDraw.prize.name : '尚未抽獎'}
          </div>
          <div className="text-white/60 text-sm">最近獲得</div>
        </motion.div>

        <motion.div variants={itemVariants} className="game-card">
          <div className="text-4xl mb-2">⏰</div>
          <div className="text-lg font-bold text-white">
            {state.stats.lastDrawTime ? formatDate(state.stats.lastDrawTime) : '—'}
          </div>
          <div className="text-white/60 text-sm">上次抽獎時間</div>
        </motion.div>

        <motion.div variants={itemVariants} className="game-card">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xl font-bold text-white">
            {state.history.filter(h => h.prize.rarity === 'legendary').length}
          </div>
          <div className="text-white/60 text-sm">傳說獎品數</div>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid sm:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {gameCards.map(card => (
          <motion.div key={card.path} variants={itemVariants}>
            <Link to={card.path} className="block">
              <motion.div
                className={`game-card group relative overflow-hidden`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: Math.random() }}
                >
                  {card.emoji}
                </motion.div>
                
                <h2 className="text-2xl font-bold mb-2">{card.title}</h2>
                <p className="text-white/60 text-sm">{card.description}</p>
                
                <motion.div
                  className="mt-4 inline-flex items-center gap-2 text-pink-400 font-medium"
                  whileHover={{ x: 5 }}
                >
                  開始遊戲 →
                </motion.div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {state.history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="game-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">最近抽獎紀錄</h2>
            <button
              onClick={clearHistory}
              className="text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              清除紀錄
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {state.history.slice(0, 10).map(record => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{record.prize.emoji}</span>
                  <div>
                    <p className="font-medium">{record.prize.name}</p>
                    <p className="text-sm text-white/50">
                      {getGameLabel(record.gameType)} · {RARITY_LABELS[record.prize.rarity]}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-white/50">
                  {formatDate(record.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
