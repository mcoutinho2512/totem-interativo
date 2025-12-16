import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { useTotemStore } from './store/totemStore';
import Home from './pages/Home';
import HomeDashboard from './pages/HomeDashboard';
import HomeTouch from './pages/HomeTouch';
import HomeTomi from './pages/HomeTomi';
import Player from './pages/Player';
import Navigation from './pages/Navigation';
import Weather from './pages/Weather';
import Events from './pages/Events';
import News from './pages/News';
import POIs from './pages/POIs';
import Layout from './components/Layout';
import Selfie from './pages/Selfie';

const HomeSelector: React.FC = () => {
  const [searchParams] = useSearchParams();
  const theme = searchParams.get('theme');

  if (theme === 'dashboard') return <HomeDashboard />;
  if (theme === 'touch') return <HomeTouch />;
  if (theme === 'tomi') return <HomeTomi />;
  if (theme === 'simple') return <Home />;
  if (theme === 'player') return <Player />;

  return <Player />;
};

function App() {
  const { initialize } = useTotemStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeSelector />} />
        <Route path="/player" element={<Player />} />
        <Route path="/navigation" element={<Layout><Navigation /></Layout>} />
        <Route path="/weather" element={<Layout><Weather /></Layout>} />
        <Route path="/events" element={<Layout><Events /></Layout>} />
        <Route path="/news" element={<Layout><News /></Layout>} />
        <Route path="/pois" element={<Layout><POIs /></Layout>} />
        <Route path="/selfie" element={<Selfie />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
