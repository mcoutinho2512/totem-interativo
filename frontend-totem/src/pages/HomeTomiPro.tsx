import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { weatherService, contentService, advertisingService } from '../services/api';
import styles from '../styles/HomeTomiPro.module.css';

const HomeTomiPro: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { totem } = useTotemStore();
  const [weather, setWeather] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const menuItems = [
    { icon: '🗺️', label: 'MAPA', path: '/navigation' },
    { icon: '⭐', label: 'DESTAQUES', path: '/pois' },
    { icon: '📍', label: 'ROTAS', path: '/navigation' },
    { icon: '🚌', label: 'TRANSPORTE', path: '/pois?type=transport' },
    { icon: '📅', label: 'AGENDA', path: '/events' },
    { icon: '📷', label: 'FOTO', path: '/selfie' },
  ];

  const languages = [
    { code: 'pt', flag: '🇧🇷' },
    { code: 'en', flag: '🇺🇸' },
    { code: 'es', flag: '🇪🇸' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cityId = totem?.city || 1;

    weatherService.getCurrent(cityId)
      .then(res => setWeather(res.data))
      .catch(() => {});

    contentService.getEvents(6)
      .then(res => setEvents(res.data.results || res.data || []))
      .catch(() => {});

    contentService.getNews(4)
      .then(res => setNews(res.data.results || res.data || []))
      .catch(() => {});

    advertisingService.getActiveAds(totem?.id || 1)
      .then(res => setAds(res.data || []))
      .catch(() => {});
  }, [totem]);

  // Rotacao de anuncios
  useEffect(() => {
    if (ads.length > 1) {
      const timer = setInterval(() => {
        setCurrentAd(prev => (prev + 1) % ads.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [ads.length]);

  const getLocale = () => {
    const lang = i18n.language;
    if (lang === 'en') return 'en-US';
    if (lang === 'es') return 'es-ES';
    return 'pt-BR';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString(getLocale(), { day: '2-digit' }),
      month: date.toLocaleDateString(getLocale(), { month: 'short' }).toUpperCase(),
    };
  };

  const currentAdData = ads[currentAd];

  return (
    <div className={styles.container}>
      {/* Top Status Bar */}
      <header className={styles.statusBar}>
        <div className={styles.statusLeft}>
          {totem?.logo ? (
            <img
              src={totem.logo.startsWith('http') ? totem.logo : `http://10.50.30.168:8000${totem.logo}`}
              alt="Logo"
              className={styles.logo}
            />
          ) : (
            <span className={styles.logoText}>{totem?.city_name || 'SANARIS'}</span>
          )}
          <div className={styles.statusIcons}>
            <span className={styles.statusIcon} title="WiFi">📶</span>
            <span className={styles.statusIcon} title="Acessibilidade">♿</span>
          </div>
        </div>

        <div className={styles.statusCenter}>
          <span className={styles.statusDot + ' ' + styles.online}></span>
          <span className={styles.statusText}>ONLINE</span>
          <span className={styles.separator}>|</span>
          <span className={styles.location}>📍 {totem?.address || 'Centro'}</span>
        </div>

        <div className={styles.statusRight}>
          <div className={styles.datetime}>
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

      {/* Main Banner / Ad Area */}
      <section className={styles.bannerSection}>
        {currentAdData ? (
          <div className={styles.bannerContent}>
            <img
              src={currentAdData.file?.startsWith('http') ? currentAdData.file : `http://10.50.30.168:8000${currentAdData.file}`}
              alt=""
              className={styles.bannerImage}
            />
            <div className={styles.bannerOverlay}>
              <div className={styles.bannerCTA}>
                <span className={styles.ctaIcon}>👆</span>
                <span>TOQUE AQUI</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.bannerPlaceholder}>
            <h2>Bem-vindo a {totem?.city_name || 'Niteroi'}</h2>
            <p>Explore nossa cidade</p>
          </div>
        )}

        {/* Banner Indicators */}
        {ads.length > 1 && (
          <div className={styles.bannerIndicators}>
            {ads.map((_, idx) => (
              <span
                key={idx}
                className={`${styles.indicator} ${idx === currentAd ? styles.active : ''}`}
                onClick={() => setCurrentAd(idx)}
              />
            ))}
          </div>
        )}

        {/* Interactive hints on banner */}
        <div className={styles.bannerHints}>
          <div className={styles.hintLeft}>
            <span className={styles.hintIcon}>🗺️</span>
            <span>VER NO MAPA</span>
          </div>
          <div className={styles.hintRight}>
            <span className={styles.hintIcon}>👆</span>
            <span>SAIBA MAIS</span>
          </div>
        </div>
      </section>

      {/* Menu Bar */}
      <nav className={styles.menuBar}>
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            <span className={styles.menuLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <section className={styles.contentArea}>
        {/* Featured Event (Large) */}
        <div className={styles.featuredSection}>
          {events[0] && (
            <div className={styles.featuredCard} onClick={() => navigate('/events')}>
              <div className={styles.featuredImage}>
                {events[0].image ? (
                  <img src={events[0].image} alt="" />
                ) : (
                  <div className={styles.placeholderImage}>📅</div>
                )}
              </div>
              <div className={styles.featuredInfo}>
                {events[0].start_date && (
                  <div className={styles.featuredDate}>
                    <span className={styles.dateDay}>{formatDate(events[0].start_date).day}</span>
                    <span className={styles.dateMonth}>{formatDate(events[0].start_date).month}</span>
                  </div>
                )}
                <div className={styles.featuredText}>
                  <h3>{events[0].title}</h3>
                  <p>{events[0].location || events[0].description?.substring(0, 80)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Events List (Right Side) */}
        <div className={styles.eventsList}>
          <div className={styles.eventsHeader}>
            <span>📅 AGENDA</span>
            <button onClick={() => navigate('/events')}>Ver todos →</button>
          </div>
          <div className={styles.eventsScroll}>
            {events.slice(1, 5).map((event, idx) => (
              <div key={idx} className={styles.eventItem} onClick={() => navigate('/events')}>
                {event.start_date && (
                  <div className={styles.eventDate}>
                    <span className={styles.eventDay}>{formatDate(event.start_date).day}</span>
                    <span className={styles.eventMonth}>{formatDate(event.start_date).month}</span>
                  </div>
                )}
                <div className={styles.eventInfo}>
                  <span className={styles.eventTitle}>{event.title}</span>
                  <span className={styles.eventLocation}>{event.location}</span>
                </div>
                {event.image && (
                  <img src={event.image} alt="" className={styles.eventThumb} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Language Selector */}
      <div className={styles.languageBar}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`${styles.langBtn} ${i18n.language === lang.code ? styles.active : ''}`}
            onClick={() => i18n.changeLanguage(lang.code)}
          >
            {lang.flag}
          </button>
        ))}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>SANARIS</span>
        </div>
        <div className={styles.footerInfo}>
          <span>📍 {totem?.address || 'Praca Arariboia, Centro'}</span>
        </div>
      </footer>
    </div>
  );
};

export default HomeTomiPro;
