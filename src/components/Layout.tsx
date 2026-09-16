import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: '首頁', emoji: '🏠' },
  { path: '/gacha', label: '扭蛋', emoji: '🎰' },
  { path: '/cards', label: '卡牌', emoji: '🃏' },
  { path: '/scratch', label: '刮刮樂', emoji: '🎫' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <motion.span 
                className="text-2xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🎲
              </motion.span>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
                抽抽樂
              </span>
            </Link>
            
            <div className="flex gap-1 sm:gap-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${
                    location.pathname === item.path
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 sm:py-6 overflow-visible">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="overflow-visible"
        >
          {children}
        </motion.div>
      </main>

      <footer className="bg-black/20 border-t border-white/10 py-4 text-center text-white/50 text-sm">
        <p>抽抽樂 Gacha Fun &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
