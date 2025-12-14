import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/BottomNav.module.css';

const BottomNav: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: '🏠', label: t('nav.home') },
    { path: '/navigation', icon: '🗺️', label: t('nav.navigation') },
    { path: '/weather', icon: '🌤️', label: t('nav.weather') },
    { path: '/events', icon: '📅', label: t('nav.events') },
    { path: '/news', icon: '📰', label: t('nav.news') },
    { path: '/pois', icon: '📍', label: t('nav.services') },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
