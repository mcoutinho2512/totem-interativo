import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTotemStore } from '../store/totemStore';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totem, language, setLanguage } = useTotemStore();

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Início' },
    { path: '/navigation', icon: '🗺️', label: 'Navegação' },
    { path: '/weather', icon: '🌤️', label: 'Clima' },
    { path: '/events', icon: '📅', label: 'Eventos' },
    { path: '/news', icon: '📰', label: 'Notícias' },
    { path: '/pois', icon: '📍', label: 'Serviços' },
  ];

  const languages = [
    { code: 'pt-BR', label: 'PT' },
    { code: 'en-US', label: 'EN' },
    { code: 'es-ES', label: 'ES' },
  ];

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
              className={`${styles.langBtn} ${language === lang.code ? styles.active : ''}`}
              onClick={() => setLanguage(lang.code)}
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
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
