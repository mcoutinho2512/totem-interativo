import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTotemStore } from '../store/totemStore';
import { contentService, weatherService } from '../services/api';
import styles from '../styles/HomeDashboard.module.css';

const HomeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { totem } = useTotemStore();
  const [weather, setWeather] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const position: [number, number] = totem 
    ? [Number(totem.latitude), Number(totem.longitude)]
    : [-22.8833, -43.1033];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (totem?.city) {
      weatherService.getCurrent(totem.city).then(res => setWeather(res.data)).catch(() => {});
      contentService.getEvents(5).then(res => setEvents(res.data.results || res.data || [])).catch(() => {});
      contentService.getNews(5).then(res => setNews(res.data.results || res.data || [])).catch(() => {});
      contentService.getGallery().then(res => setAds(res.data || [])).catch(() => {});
    }
  }, [totem]);

  useEffect(() => {
    if (ads.length > 1) {
      const timer = setInterval(() => {
        setCurrentAd(prev => (prev + 1) % ads.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [ads.length]);

  return (
    <div className={styles.dashboard}>
      {/* Header com cidade e hora */}
      <header className={styles.header}>
        <div className={styles.cityInfo}>
          <h1>{totem?.city_name || 'Sanaris City'}</h1>
          <span className={styles.date}>
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <div className={styles.timeDisplay}>
          <span className={styles.time}>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </header>

      {/* Grid principal */}
      <div className={styles.mainGrid}>
        {/* Widget Clima */}
        <div className={styles.weatherWidget}>
          <div className={styles.weatherMain}>
            {weather?.icon_url && <img src={weather.icon_url} alt="" className={styles.weatherIcon} />}
            <span className={styles.temperature}>{weather ? Math.round(weather.temperature) : '--'}°C</span>
          </div>
          <div className={styles.weatherDetails}>
            <span>{weather?.description || 'Carregando...'}</span>
            <div className={styles.weatherMeta}>
              <span>💧 {weather?.humidity || '--'}%</span>
              <span>💨 {weather?.wind_speed || '--'} km/h</span>
            </div>
          </div>
          <div className={styles.weatherForecast}>
            <span>Sensação: {weather ? Math.round(weather.feels_like) : '--'}°C</span>
          </div>
        </div>

        {/* Mapa */}
        <div className={styles.mapWidget}>
          <MapContainer center={position} zoom={15} className={styles.map} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position}>
              <Popup>📍 Você está aqui</Popup>
            </Marker>
          </MapContainer>
          <button className={styles.mapOverlay} onClick={() => navigate('/navigation')}>
            🗺️ Toque para navegar
          </button>
        </div>

        {/* Eventos */}
        <div className={styles.eventsWidget}>
          <h3>📅 Eventos</h3>
          <div className={styles.eventsList}>
            {events.length > 0 ? events.slice(0, 3).map((event, idx) => (
              <div key={idx} className={styles.eventItem} onClick={() => navigate('/events')}>
                <span className={styles.eventDate}>
                  {new Date(event.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                <span className={styles.eventTitle}>{event.title}</span>
              </div>
            )) : (
              <p className={styles.noData}>Nenhum evento próximo</p>
            )}
          </div>
        </div>

        {/* Notícias */}
        <div className={styles.newsWidget}>
          <h3>📰 Notícias</h3>
          <div className={styles.newsList}>
            {news.length > 0 ? news.slice(0, 3).map((item, idx) => (
              <div key={idx} className={styles.newsItem} onClick={() => navigate('/news')}>
                <span className={styles.newsTitle}>{item.title}</span>
              </div>
            )) : (
              <p className={styles.noData}>Nenhuma notícia</p>
            )}
          </div>
        </div>
      </div>

      {/* Banner de publicidade */}
      <div className={styles.adBanner}>
        {ads.length > 0 ? (
          <img src={ads[currentAd]?.image} alt={ads[currentAd]?.title} className={styles.adImage} />
        ) : (
          <div className={styles.adPlaceholder}>
            <span>Espaço Publicitário</span>
          </div>
        )}
        {ads.length > 1 && (
          <div className={styles.adDots}>
            {ads.map((_, idx) => (
              <span key={idx} className={`${styles.dot} ${idx === currentAd ? styles.active : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* Menu inferior */}
      <nav className={styles.bottomNav}>
        <button onClick={() => navigate('/')} className={styles.navActive}>🏠 Início</button>
        <button onClick={() => navigate('/navigation')}>🗺️ Rotas</button>
        <button onClick={() => navigate('/events')}>📅 Eventos</button>
        <button onClick={() => navigate('/pois?type=transport')}>🚌 Transporte</button>
        <button onClick={() => navigate('/pois?type=hospital')}>🏥 Emergência</button>
      </nav>
    </div>
  );
};

export default HomeDashboard;
