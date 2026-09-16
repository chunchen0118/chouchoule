import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prize, GameType, RARITY_LABELS, GameSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: GameType;
  settings: GameSettings;
  onUpdateSettings: (gameType: GameType, settings: Partial<GameSettings>) => void;
  onAddPrize: (gameType: GameType, prize: Omit<Prize, 'id'>) => void;
  onUpdatePrize: (gameType: GameType, prizeId: string, updates: Partial<Prize>) => void;
  onDeletePrize: (gameType: GameType, prizeId: string) => void;
  onReset: (gameType: GameType) => void;
}

const gameLabels: Record<GameType, string> = {
  gacha: '扭蛋',
  cards: '卡牌抽抽樂',
  scratch: '刮刮樂',
};

const defaultEmojis = ['🎁', '⭐', '💎', '🏆', '🎀', '🌟', '🍀', '🔮', '🎯', '🎪'];

export function SettingsModal({
  isOpen,
  onClose,
  gameType,
  settings,
  onUpdateSettings,
  onAddPrize,
  onUpdatePrize,
  onDeletePrize,
  onReset,
}: SettingsModalProps) {
  const [editingPrize, setEditingPrize] = useState<string | null>(null);
  const [newPrize, setNewPrize] = useState<Omit<Prize, 'id'>>({
    name: '',
    emoji: '🎁',
    weight: 10,
    stock: null,
    rarity: 'common',
  });

  const totalWeight = settings.prizes.reduce((sum, p) => sum + p.weight, 0);

  const handleAddPrize = () => {
    if (!newPrize.name.trim()) return;
    onAddPrize(gameType, newPrize);
    setNewPrize({
      name: '',
      emoji: defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)],
      weight: 10,
      stock: null,
      rarity: 'common',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{gameLabels[gameType]} 設定</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.trackStock}
                  onChange={e => onUpdateSettings(gameType, { trackStock: e.target.checked })}
                  className="w-5 h-5 rounded border-white/30 bg-white/10 text-pink-500 focus:ring-pink-500"
                />
                <span>追蹤庫存數量（抽完即無法再抽）</span>
              </label>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">獎品列表</h3>
              <p className="text-sm text-white/60 mb-3">
                總權重: {totalWeight} | 點擊獎品可編輯
              </p>
            </div>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {settings.prizes.map(prize => (
                <div
                  key={prize.id}
                  className={`p-3 rounded-lg bg-white/5 border border-white/10 ${
                    editingPrize === prize.id ? 'ring-2 ring-pink-500' : ''
                  }`}
                >
                  {editingPrize === prize.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={prize.name}
                          onChange={e => onUpdatePrize(gameType, prize.id, { name: e.target.value })}
                          className="input-field"
                          placeholder="獎品名稱"
                        />
                        <input
                          type="text"
                          value={prize.emoji}
                          onChange={e => onUpdatePrize(gameType, prize.id, { emoji: e.target.value })}
                          className="input-field"
                          placeholder="表情符號"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-white/60">權重</label>
                          <input
                            type="number"
                            value={prize.weight}
                            onChange={e => onUpdatePrize(gameType, prize.id, { weight: Math.max(0, Number(e.target.value)) })}
                            className="input-field"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/60">庫存 (空=無限)</label>
                          <input
                            type="number"
                            value={prize.stock ?? ''}
                            onChange={e => onUpdatePrize(gameType, prize.id, { 
                              stock: e.target.value === '' ? null : Math.max(0, Number(e.target.value))
                            })}
                            className="input-field"
                            min="0"
                            placeholder="無限"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/60">稀有度</label>
                          <select
                            value={prize.rarity}
                            onChange={e => onUpdatePrize(gameType, prize.id, { rarity: e.target.value as Prize['rarity'] })}
                            className="input-field"
                          >
                            {Object.entries(RARITY_LABELS).map(([value, label]) => (
                              <option key={value} value={value} className="bg-purple-900">
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingPrize(null)}
                          className="btn-secondary flex-1"
                        >
                          完成
                        </button>
                        <button
                          onClick={() => {
                            onDeletePrize(gameType, prize.id);
                            setEditingPrize(null);
                          }}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setEditingPrize(prize.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{prize.emoji}</span>
                        <div>
                          <p className="font-medium">{prize.name}</p>
                          <p className="text-sm text-white/60">
                            {RARITY_LABELS[prize.rarity]} | 權重: {prize.weight} ({totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : 0}%)
                            {settings.trackStock && prize.stock !== null && ` | 庫存: ${prize.stock}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-white/40">✏️</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">新增獎品</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newPrize.name}
                    onChange={e => setNewPrize(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="獎品名稱"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPrize.emoji}
                      onChange={e => setNewPrize(prev => ({ ...prev, emoji: e.target.value }))}
                      className="input-field w-20"
                      placeholder="😀"
                    />
                    <div className="flex gap-1 overflow-x-auto">
                      {defaultEmojis.slice(0, 5).map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setNewPrize(prev => ({ ...prev, emoji }))}
                          className="p-2 hover:bg-white/10 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/60">權重</label>
                    <input
                      type="number"
                      value={newPrize.weight}
                      onChange={e => setNewPrize(prev => ({ ...prev, weight: Math.max(0, Number(e.target.value)) }))}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60">庫存 (空=無限)</label>
                    <input
                      type="number"
                      value={newPrize.stock ?? ''}
                      onChange={e => setNewPrize(prev => ({ 
                        ...prev, 
                        stock: e.target.value === '' ? null : Math.max(0, Number(e.target.value))
                      }))}
                      className="input-field"
                      min="0"
                      placeholder="無限"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60">稀有度</label>
                    <select
                      value={newPrize.rarity}
                      onChange={e => setNewPrize(prev => ({ ...prev, rarity: e.target.value as Prize['rarity'] }))}
                      className="input-field"
                    >
                      {Object.entries(RARITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value} className="bg-purple-900">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddPrize}
                  disabled={!newPrize.name.trim()}
                  className="btn-primary w-full"
                >
                  ➕ 新增獎品
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onReset(gameType)}
                className="btn-secondary flex-1"
              >
                🔄 重設為預設
              </button>
              <button
                onClick={onClose}
                className="btn-primary flex-1"
              >
                完成設定
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
