import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTotemStore } from '../store/totemStore';
import { contentService, weatherService } from '../services/api';
import styles from '../styles/Player.module.css';

interface PlaylistItem {
  id: number;
  item_type: string;
  name: string;
  image?: string;
  video_url?: string;
  html_content?: string;
  duration: number;
  transition: string;
  background_color: string;
  text_color: string;
}

interface Playlist {
  id: number;
  name: string;
  items: PlaylistItem[];
  total_duration: number;
}

const Player: React.FC = () => {
  const navigate = useNavigate();
  const { totem } = useTotemStore();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transitioning, setTransitioning] = useState(false);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load playlist
  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        const response = await contentService.getCurrentPlaylist();
        if (response.data && response.data.items?.length > 0) {
          setPlaylist(response.data);
        }
      } catch (error) {
        console.log('No playlist available, using default content');
      }
    };
    
    loadPlaylist();
    const interval = setInterval(loadPlaylist, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Load content for dynamic items
  useEffect(() => {
    if (totem?.city) {
      weatherService.getCurrent(totem.city).then(res => setWeather(res.data)).catch(() => {});
      contentService.getNews(5).then(res => setNews(res.data.results || res.data || [])).catch(() => {});
      contentService.getEvents(5).then(res => setEvents(res.data.results || res.data || [])).catch(() => {});
    }
  }, [totem]);

  // Auto-advance playlist
  useEffect(() => {
    if (!playlist || !isIdle || playlist.items.length === 0) return;
    
    const currentItem = playlist.items[currentIndex];
    const duration = currentItem?.duration || 10;
    
    const timer = setTimeout(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % playlist.items.length);
        setTransitioning(false);
      }, 500);
    }, duration * 1000);
    
    return () => clearTimeout(timer);
  }, [currentIndex, playlist, isIdle]);

  // Handle touch - go to interactive mode
  const handleTouch = useCallback(() => {
    setIsIdle(false);
    navigate('/?theme=tomi');
  }, [navigate]);

  // Render content based on item type
  const renderContent = (item: PlaylistItem) => {
    switch (item.item_type) {
      case 'image':
      case 'ad':
        return (
          <div className={styles.imageSlide} style={{ backgroundColor: item.background_color }}>
            {item.image && <img src={item.image} alt={item.name} />}
            {item.item_type === 'ad' && <div className={styles.adBadge}>Publicidade</div>}
          </div>
        );
      
      case 'video':
        return (
          <div className={styles.videoSlide}>
            <video autoPlay muted loop src={item.video_url} />
          </div>
        );
      
      case 'weather':
        return (
          <div className={styles.weatherSlide}>
            <div className={styles.weatherCity}>{totem?.city_name || 'Sua Cidade'}</div>
            {weather && (
              <>
                <img src={weather.icon_url} alt="" className={styles.weatherIcon} />
                <div className={styles.weatherTemp}>{Math.round(weather.temperature)}°C</div>
                <div className={styles.weatherDesc}>{weather.description}</div>
                <div className={styles.weatherDetails}>
                  <span>💧 {weather.humidity}%</span>
                  <span>💨 {weather.wind_speed} km/h</span>
                </div>
              </>
            )}
          </div>
        );
      
      case 'news':
        return (
          <div className={styles.newsSlide}>
            <h2>📰 Notícias</h2>
            <div className={styles.newsList}>
              {news.slice(0, 4).map((item, idx) => (
                <div key={idx} className={styles.newsItem}>
                  {item.image && <img src={item.image} alt="" />}
                  <div className={styles.newsContent}>
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'events':
        return (
          <div className={styles.eventsSlide}>
            <h2>📅 Eventos</h2>
            <div className={styles.eventsList}>
              {events.slice(0, 4).map((event, idx) => (
                <div key={idx} className={styles.eventItem}>
                  <div className={styles.eventDate}>
                    <span className={styles.eventDay}>
                      {new Date(event.start_date).getDate()}
                    </span>
                    <span className={styles.eventMonth}>
                      {new Date(event.start_date).toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>
                  <div className={styles.eventInfo}>
                    <h3>{event.title}</h3>
                    <p>�� {event.venue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'clock':
        return (
          <div className={styles.clockSlide}>
            <div className={styles.clockTime}>
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className={styles.clockDate}>
              {currentTime.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </div>
            <div className={styles.clockCity}>{totem?.city_name}</div>
          </div>
        );
      
      case 'html':
        return (
          <div 
            className={styles.htmlSlide}
            dangerouslySetInnerHTML={{ __html: item.html_content || '' }}
          />
        );
      
      default:
        return (
          <div className={styles.defaultSlide}>
            <h1>🏙️ {totem?.city_name || 'Sanaris City'}</h1>
            <p>Toque para explorar</p>
          </div>
        );
    }
  };

  // Default content if no playlist
  const renderDefaultContent = () => (
    <div className={styles.defaultSlide}>
      <div className={styles.defaultContent}>
        <span className={styles.defaultIcon}>🏙️</span>
        <h1>{totem?.city_name || 'Sanaris City Totem'}</h1>
        <p>Toque na tela para explorar</p>
        <div className={styles.defaultTime}>
          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        {weather && (
          <div className={styles.defaultWeather}>
            <img src={weather.icon_url} alt="" />
            <span>{Math.round(weather.temperature)}°C</span>
          </div>
        )}
      </div>
    </div>
  );

  const currentItem = playlist?.items[currentIndex];

  return (
    <div className={styles.player} onClick={handleTouch}>
      {/* Progress bar */}
      {playlist && playlist.items.length > 1 && (
        <div className={styles.progressBar}>
          {playlist.items.map((_, idx) => (
            <div 
              key={idx} 
              className={`${styles.progressDot} ${idx === currentIndex ? styles.active : ''} ${idx < currentIndex ? styles.done : ''}`}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className={`${styles.content} ${transitioning ? styles.fadeOut : styles.fadeIn}`}>
        {currentItem ? renderContent(currentItem) : renderDefaultContent()}
      </div>

      {/* Touch indicator */}
      <div className={styles.touchHint}>
        <span>👆</span>
        <p>Toque para interagir</p>
      </div>

      {/* Header overlay */}
      <div className={styles.headerOverlay}>
        <div className={styles.logo}>
          <span>🏙️</span>
          <span>{totem?.city_name || 'SANARIS'}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.time}>
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {weather && (
            <span className={styles.tempSmall}>{Math.round(weather.temperature)}°</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Player;
