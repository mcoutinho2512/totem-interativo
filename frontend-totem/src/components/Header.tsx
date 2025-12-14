import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Header.module.css';

const Header: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>🏛️</span>
        <span className={styles.logoText}>Sanaris City Totem</span>
      </Link>
      
      <div className={styles.languages}>
        <button 
          className={`${styles.langBtn} ${i18n.language === 'pt' ? styles.active : ''}`}
          onClick={() => changeLanguage('pt')}
        >
          PT
        </button>
        <button 
          className={`${styles.langBtn} ${i18n.language === 'en' ? styles.active : ''}`}
          onClick={() => changeLanguage('en')}
        >
          EN
        </button>
        <button 
          className={`${styles.langBtn} ${i18n.language === 'es' ? styles.active : ''}`}
          onClick={() => changeLanguage('es')}
        >
          ES
        </button>
      </div>
    </header>
  );
};

export default Header;
