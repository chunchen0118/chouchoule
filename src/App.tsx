import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { GachaPage } from './pages/GachaPage';
import { CardsPage } from './pages/CardsPage';
import { ScratchPage } from './pages/ScratchPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gacha" element={<GachaPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/scratch" element={<ScratchPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
