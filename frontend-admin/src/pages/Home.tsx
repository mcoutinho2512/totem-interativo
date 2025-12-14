import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTotemStore } from '../store/totemStore';
import { contentService, weatherService } from '../services/api';
import styles from '../styles/Home.module.css';

interface WeatherData {
  temperature: number;
  description: string;
  icon_url: string;
}

interface GalleryImage {
  id: number;
  title: string;
  image: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { totem } = useTotemStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (totem?.city) {
      // Load weather
      weatherService.getCurrent(totem.city)
        .then(res => setWeather(res.data))
        .catch(console.error);

      // Load gallery
      contentService.getGallery()
        .then(res => setGallery(res.data))
        .catch(console.error);
    }
  }, [totem]);

  // Auto-rotate gallery
  useEffect(() => {
    if (gallery.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % gallery.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [gallery.length]);

  const quickActions = [
    { icon: '🗺️', label: 'Como Chegar', path: '/navigation' },
    { icon: '🌤️', label: 'Clima', path: '/weather' },
    { icon: '📅', label: 'Eventos', path: '/events' },
    { icon: '🏥', label: 'Hospitais', path: '/pois?type=hospital' },
    { icon: '🍽️', label: 'Restaurantes', path: '/pois?type=restaurant' },
    { icon: '🚌', label: 'Transporte', path: '/pois?type=transport' },
  ];

  return (
    <div className={styles.home}>
      {/* Weather Widget */}
      {weather && (
        <div className={styles.weatherWidget}>
          <img src={weather.icon_url} alt={weather.description} />
          <span className={styles.temp}>{Math.round(weather.temperature)}°C</span>
          <span className={styles.desc}>{weather.description}</span>
        </div>
      )}

      {/* Gallery Carousel */}
      <div className={styles.gallery}>
        {gallery.length > 0 ? (
          <>
            <img 
              src={gallery[currentSlide]?.image} 
              alt={gallery[currentSlide]?.title}
              className={styles.galleryImage}
            />
            <div className={styles.galleryDots}>
              {gallery.map((_, idx) => (
                <span 
                  key={idx}
                  className={`${styles.dot} ${idx === currentSlide ? styles.active : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.placeholder}>
            <h1>Bem-vindo a {totem?.city_name}</h1>
            <p>Toque para explorar</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        {quickActions.map((action) => (
          <button
            key={action.path}
            className={styles.actionBtn}
            onClick={() => navigate(action.path)}
          >
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Location Info */}
      <div className={styles.locationInfo}>
        <span>📍 {totem?.address}</span>
      </div>
    </div>
  );
};

export default Home;
