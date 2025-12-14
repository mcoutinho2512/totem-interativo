import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { totem, setLanguage } = useTotemStore();

  const menuItems = [
    { path: '/', icon: '🏠', labelKey: 'nav.home' },
    { path: '/navigation', icon: '🗺️', labelKey: 'nav.navigation' },
    { path: '/weather', icon: '🌤️', labelKey: 'nav.weather' },
    { path: '/events', icon: '📅', labelKey: 'nav.events' },
    { path: '/news', icon: '📰', labelKey: 'nav.news' },
    { path: '/pois', icon: '📍', labelKey: 'nav.services' },
  ];

  const languages = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          <span className={styles.logoIcon}>🏙️</span>
          <span className={styles.logoText}>
            {totem?.city_name || 'Sanaris City Totem'}
          </span>
        </div>
        
        <div className={styles.languages}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.langBtn} ${i18n.language === lang.code ? styles.active : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
