import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { weatherService, contentService } from '../services/api';
import styles from '../styles/HomeTomi.module.css';

const HomeTomi: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { totem } = useTotemStore();
  const [weather, setWeather] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [currentBg, setCurrentBg] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const menuItems = [
    { icon: 'M', labelKey: 'tomi.map', path: '/navigation' },
    { icon: 'S', labelKey: 'tomi.highlights', path: '/pois' },
    { icon: 'R', labelKey: 'tomi.routes', path: '/navigation' },
    { icon: 'T', labelKey: 'tomi.transport', path: '/pois?type=transport' },
    { icon: 'E', labelKey: 'tomi.events', path: '/events' },
    { icon: 'P', labelKey: 'tomi.photo', path: '/selfie' },
  ];

  const languages = [
    { code: 'pt', label: 'PT', flag: 'BR' },
    { code: 'en', label: 'EN', flag: 'US' },
    { code: 'es', label: 'ES', flag: 'ES' },
  ];
  // Imagens de Niterói como padrão
  const niteroiGallery = [
    { image: '/images/niteroi/slide1.jpg', title: 'Niterói' },
    { image: '/images/niteroi/slide2.jpg', title: 'Niterói' },
    { image: '/images/niteroi/slide3.jpg', title: 'Niterói' },
    { image: '/images/niteroi/slide4.jpg', title: 'Niterói' },
    { image: '/images/niteroi/slide5.jpg', title: 'Niterói' },
    { image: '/images/niteroi/slide6.jpg', title: 'Niterói' },
  ];


  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cityId = totem?.city || 1;
    weatherService.getCurrent(cityId).then(res => setWeather(res.data)).catch(() => {});
    contentService.getEvents(5).then(res => setEvents(res.data.results || res.data || [])).catch(() => {});
    contentService.getNews(5).then(res => setNews(res.data.results || res.data || [])).catch(() => {});
    contentService.getGallery().then(res => setGallery(res.data?.length > 0 ? res.data : niteroiGallery)).catch(() => setGallery(niteroiGallery));
  }, [totem]);

  useEffect(() => {
    if (gallery.length > 1) {
      const timer = setInterval(() => {
        setCurrentBg(prev => (prev + 1) % gallery.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [gallery.length]);

  const allContent = [...events.map(e => ({...e, type: 'event'})), ...news.map(n => ({...n, type: 'news'}))].slice(0, 6);

  const getLocale = () => {
    const lang = i18n.language;
    if (lang === 'en') return 'en-US';
    if (lang === 'es') return 'es-ES';
    return 'pt-BR';
  };

  const iconMap: {[key: string]: string} = {
    'M': '🗺️', 'S': '⭐', 'R': '📍', 'T': '🚌', 'E': '📅', 'P': '📷'
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundWrapper}>
        {gallery.length > 0 ? (
          <img src={gallery[currentBg]?.image} alt="" className={styles.backgroundImage} />
        ) : (
          <div className={styles.defaultBackground} />
        )}
        <div className={styles.backgroundOverlay} />
      </div>

      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏙️</span>
          <span className={styles.logoText}>{totem?.city_name || 'SANARIS'}</span>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <span className={styles.time}>
              {currentTime.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className={styles.date}>
              {currentTime.toLocaleDateString(getLocale(), { day: '2-digit', month: 'short' }).toUpperCase()}
            </span>
          </div>
          
          {weather && (
            <div className={styles.weather}>
              <img src={weather.icon_url} alt="" className={styles.weatherIcon} />
              <span className={styles.temp}>{Math.round(weather.temperature)}°</span>
            </div>
          )}
        </div>
      </header>

      <div className={styles.languageBar}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`${styles.langBtn} ${i18n.language === lang.code ? styles.langActive : ''}`}
            onClick={() => changeLanguage(lang.code)}
          >
            <span className={styles.flag}>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>

      <nav className={styles.menuBar}>
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.menuIcon}>{iconMap[item.icon]}</span>
            <span className={styles.menuLabel}>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>📰 {t('tomi.highlights')}</span>
        </div>
        <div className={styles.sidebarContent}>
          {allContent.map((item, idx) => (
            <div 
              key={idx} 
              className={styles.contentCard}
              onClick={() => navigate(item.type === 'event' ? '/events' : '/news')}
            >
              {item.image && (
                <div className={styles.cardImage}>
                  <img src={item.image} alt="" />
                </div>
              )}
              <div className={styles.cardInfo}>
                {item.type === 'event' && item.start_date && (
                  <span className={styles.cardDate}>
                    {new Date(item.start_date).toLocaleDateString(getLocale(), { day: '2-digit', month: 'short' })}
                  </span>
                )}
                <span className={styles.cardTitle}>{item.title}</span>
              </div>
            </div>
          ))}
          
          {allContent.length === 0 && (
            <div className={styles.noContent}>
              <p>{t('tomi.contentSoon')}</p>
            </div>
          )}
        </div>
      </aside>

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span>SANARIS</span>
        </div>
        <div className={styles.footerLocation}>
          📍 {totem?.address || t('tomi.interactiveTotem')}
        </div>
      </footer>

      {gallery.length > 1 && (
        <div className={styles.galleryIndicators}>
          {gallery.map((_, idx) => (
            <span 
              key={idx} 
              className={`${styles.indicator} ${idx === currentBg ? styles.indicatorActive : ''}`}
              onClick={() => setCurrentBg(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeTomi;
