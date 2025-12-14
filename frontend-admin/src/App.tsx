import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTotemStore } from './store/totemStore';
import Home from './pages/Home';
import Navigation from './pages/Navigation';
import Weather from './pages/Weather';
import Events from './pages/Events';
import News from './pages/News';
import POIs from './pages/POIs';
import Layout from './components/Layout';

function App() {
  const { initialize, resetSession } = useTotemStore();

  useEffect(() => {
    // Initialize totem on mount
    initialize();

    // Reset session on inactivity
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        resetSession();
        window.location.href = '/';
      }, 60000); // 60 seconds
    };

    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('mousemove', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('mousemove', resetTimer);
    };
  }, [initialize, resetSession]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/navigation" element={<Navigation />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/events" element={<Events />} />
          <Route path="/news" element={<News />} />
          <Route path="/pois" element={<POIs />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
