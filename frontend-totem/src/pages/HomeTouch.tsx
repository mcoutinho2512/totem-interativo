import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTotemStore } from '../store/totemStore';
import { weatherService, contentService } from '../services/api';
import styles from '../styles/HomeTouch.module.css';

interface QuickAction {
  icon: string;
  label: string;
  path: string;
  color: string;
  description: string;
}

const HomeTouch: React.FC = () => {
  const navigate = useNavigate();
  const { totem } = useTotemStore();
  const [weather, setWeather] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ads, setAds] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState(0);

  const quickActions: QuickAction[] = [
    { icon: '🗺️', label: 'Como Chegar', path: '/navigation', color: '#3182ce', description: 'Encontre rotas' },
    { icon: '🚌', label: 'Transporte', path: '/pois?type=transport', color: '#38a169', description: 'Ônibus e metrô' },
    { icon: '🏥', label: 'Hospitais', path: '/pois?type=hospital', color: '#e53e3e', description: 'Emergências' },
    { icon: '🍽️', label: 'Restaurantes', path: '/pois?type=restaurant', color: '#dd6b20', description: 'Onde comer' },
    { icon: '📅', label: 'Eventos', path: '/events', color: '#805ad5', description: 'Agenda cultural' },
    { icon: '🎭', label: 'Cultura', path: '/pois?type=attraction', color: '#d53f8c', description: 'Pontos turísticos' },
    { icon: '🏖️', label: 'Praias', path: '/pois?type=attraction', color: '#00b5d8', description: 'Lazer e sol' },
    { icon: '📰', label: 'Notícias', path: '/news', color: '#718096', description: 'Últimas notícias' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (totem?.city) {
      weatherService.getCurrent(totem.city).then(res => setWeather(res.data)).catch(() => {});
      contentService.getGallery().then(res => setAds(res.data || [])).catch(() => {});
    }
  }, [totem]);

  useEffect(() => {
    if (ads.length > 1) {
      const timer = setInterval(() => setCurrentAd(prev => (prev + 1) % ads.length), 6000);
      return () => clearInterval(timer);
    }
  }, [ads.length]);

  return (
    <div className={styles.touchHome}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brandSection}>
          <h1 className={styles.cityName}>{totem?.city_name || 'Sanaris City'}</h1>
          <p className={styles.tagline}>Explore a cidade</p>
        </div>
        
        <div className={styles.infoSection}>
          <div className={styles.weatherBox}>
            {weather?.icon_url && <img src={weather.icon_url} alt="" />}
            <span className={styles.temp}>{weather ? Math.round(weather.temperature) : '--'}°C</span>
          </div>
          <div className={styles.timeBox}>
            <span className={styles.time}>
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className={styles.date}>
              {currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      </header>

      {/* Grid de ações */}
      <div className={styles.actionsGrid}>
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            className={styles.actionCard}
            style={{ '--card-color': action.color } as React.CSSProperties}
            onClick={() => navigate(action.path)}
          >
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionLabel}>{action.label}</span>
            <span className={styles.actionDesc}>{action.description}</span>
          </button>
        ))}
      </div>

      {/* Banner de publicidade */}
      <div className={styles.adSection}>
        {ads.length > 0 ? (
          <>
            <img src={ads[currentAd]?.image} alt="" className={styles.adImage} />
            <div className={styles.adOverlay}>
              <span>{ads[currentAd]?.title}</span>
            </div>
          </>
        ) : (
          <div className={styles.adPlaceholder}>
            <span>🎯 Anuncie Aqui</span>
            <p>Espaço publicitário disponível</p>
          </div>
        )}
        {ads.length > 1 && (
          <div className={styles.adIndicators}>
            {ads.map((_, idx) => (
              <span key={idx} className={`${styles.indicator} ${idx === currentAd ? styles.active : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* Localização */}
      <footer className={styles.footer}>
        <span className={styles.location}>📍 {totem?.address || 'Carregando localização...'}</span>
      </footer>
    </div>
  );
};

export default HomeTouch;
