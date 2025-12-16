import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTotemStore } from './store/totemStore';

// Public Totem Pages
import Home from './pages/Home';
import Navigation from './pages/Navigation';
import Weather from './pages/Weather';
import Events from './pages/Events';
import News from './pages/News';
import POIs from './pages/POIs';
import Layout from './components/Layout';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import CampaignsAdmin from './pages/admin/CampaignsAdmin';
import AdvertisersAdmin from './pages/admin/AdvertisersAdmin';
import CreativesAdmin from './pages/admin/CreativesAdmin';
import ReportsAdmin from './pages/admin/ReportsAdmin';
import EventsAdmin from './pages/admin/EventsAdmin';
import NewsAdmin from './pages/admin/NewsAdmin';
import POIsAdmin from './pages/admin/POIsAdmin';
import GalleryAdmin from './pages/admin/GalleryAdmin';
import TotemsAdmin from './pages/admin/TotemsAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';

function App() {
  const { initialize, resetSession } = useTotemStore();

  useEffect(() => {
    // Initialize totem on mount
    initialize();

    // Reset session on inactivity (only for public pages)
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      // Don't reset session on admin pages
      if (window.location.pathname.startsWith('/admin')) {
        return;
      }

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
      <Routes>
        {/* Public Totem Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/navigation" element={<Layout><Navigation /></Layout>} />
        <Route path="/weather" element={<Layout><Weather /></Layout>} />
        <Route path="/events" element={<Layout><Events /></Layout>} />
        <Route path="/news" element={<Layout><News /></Layout>} />
        <Route path="/pois" element={<Layout><POIs /></Layout>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/admin/campaigns" element={<AdminLayout><CampaignsAdmin /></AdminLayout>} />
        <Route path="/admin/advertisers" element={<AdminLayout><AdvertisersAdmin /></AdminLayout>} />
        <Route path="/admin/creatives" element={<AdminLayout><CreativesAdmin /></AdminLayout>} />
        <Route path="/admin/reports" element={<AdminLayout><ReportsAdmin /></AdminLayout>} />
        <Route path="/admin/events" element={<AdminLayout><EventsAdmin /></AdminLayout>} />
        <Route path="/admin/news" element={<AdminLayout><NewsAdmin /></AdminLayout>} />
        <Route path="/admin/pois" element={<AdminLayout><POIsAdmin /></AdminLayout>} />
        <Route path="/admin/gallery" element={<AdminLayout><GalleryAdmin /></AdminLayout>} />
        <Route path="/admin/totems" element={<AdminLayout><TotemsAdmin /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><SettingsAdmin /></AdminLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
