import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/BottomNav.module.css';

const BottomNav: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className={styles.bottomNav}>
      <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <span className={styles.icon}>🏠</span>
        <span className={styles.label}>{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/navigation" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <span className={styles.icon}>🗺️</span>
        <span className={styles.label}>{t('nav.navigation')}</span>
      </NavLink>
      <NavLink to="/weather" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <span className={styles.icon}>🌤️</span>
        <span className={styles.label}>{t('nav.weather')}</span>
      </NavLink>
      <NavLink to="/events" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <span className={styles.icon}>📅</span>
        <span className={styles.label}>{t('nav.events')}</span>
      </NavLink>
      <NavLink to="/news" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <span className={styles.icon}>📰</span>
        <span className={styles.label}>{t('nav.news')}</span>
      </NavLink>
      <NavLink to="/pois" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <span className={styles.icon}>📍</span>
        <span className={styles.label}>{t('nav.services')}</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
