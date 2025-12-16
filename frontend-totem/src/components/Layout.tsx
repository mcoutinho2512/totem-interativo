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

  // Build logo URL with backend prefix if needed
  const logoUrl = totem?.logo
    ? (totem.logo.startsWith('http') ? totem.logo : `http://10.50.30.168:8000${totem.logo}`)
    : null;

  // Build background style
  const backgroundStyle: React.CSSProperties = {};
  if (totem?.background_image) {
    const bgUrl = totem.background_image.startsWith('http')
      ? totem.background_image
      : `http://10.50.30.168:8000${totem.background_image}`;
    backgroundStyle.backgroundImage = `url(${bgUrl})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
  } else if (totem?.background_color) {
    backgroundStyle.background = totem.background_color;
  } else {
    // Default gradient
    backgroundStyle.background = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';
  }

  return (
    <div className={styles.container} style={backgroundStyle}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          {logoUrl ? (
            <img src={logoUrl} alt={totem?.city_name || 'Logo'} className={styles.logoImage} />
          ) : (
            <>
              <span className={styles.logoIcon}>🏙️</span>
              <span className={styles.logoText}>
                {totem?.city_name || 'Sanaris City Totem'}
              </span>
            </>
          )}
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
