import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { contentService, weatherService, advertisingService } from '../services/api';
import styles from '../styles/Home.module.css';

interface WeatherData {
  temperature: number;
  description: string;
  icon_url: string;
}

interface SlideItem {
  id: number;
  title: string;
  image: string;
  type: 'gallery' | 'ad';
  advertiser?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { totem } = useTotemStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar clima
        if (totem?.city) {
          const weatherRes = await weatherService.getCurrent(totem.city);
          setWeather(weatherRes.data);
        }

        // Carregar galeria
        const galleryRes = await contentService.getGallery();
        const gallerySlides: SlideItem[] = (galleryRes.data?.results || galleryRes.data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          image: item.image,
          type: 'gallery' as const
        }));

        // Carregar anúncios
        const adsRes = await advertisingService.getActiveAds(totem?.id || 1);
        const adSlides: SlideItem[] = (adsRes.data || []).map((ad: any) => ({
          id: ad.id,
          title: ad.name,
          image: ad.file.startsWith('http') ? ad.file : `http://10.50.30.168:8000${ad.file}`,
          type: 'ad' as const,
          advertiser: ad.name
        }));

        // Intercalar: galeria, ad, galeria, ad...
        const combined: SlideItem[] = [];
        const maxLen = Math.max(gallerySlides.length, adSlides.length);
        for (let i = 0; i < maxLen; i++) {
          if (gallerySlides[i]) combined.push(gallerySlides[i]);
          if (adSlides[i]) combined.push(adSlides[i]);
        }

        setSlides(combined.length > 0 ? combined : gallerySlides);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    // Recarregar a cada 5 minutos
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, [totem]);

  // Auto-rotate slides
  useEffect(() => {
    if (slides.length > 1 && !isInteracting) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [slides.length, isInteracting]);

  // Registrar impressão de anúncio
  useEffect(() => {
    const currentItem = slides[currentSlide];
    if (currentItem?.type === 'ad' && totem?.id) {
      advertisingService.logImpression(currentItem.id, totem.id, 6).catch(() => {});
    }
  }, [currentSlide, slides, totem]);

  const handleInteraction = () => {
    setIsInteracting(true);
    navigate('/home-tomi');
  };

  const quickActions = [
    { icon: '🗺️', labelKey: 'home.directions', path: '/navigation' },
    { icon: '🌤️', labelKey: 'home.weather', path: '/weather' },
    { icon: '📅', labelKey: 'home.events', path: '/events' },
    { icon: '🏥', labelKey: 'home.hospitals', path: '/pois?type=hospital' },
    { icon: '🍽️', labelKey: 'home.restaurants', path: '/pois?type=restaurant' },
    { icon: '🚌', labelKey: 'home.transport', path: '/pois?type=transport' },
  ];

  const currentItem = slides[currentSlide];

  return (
    <div className={styles.home} onClick={handleInteraction}>
      {/* Background Slideshow */}
      <div className={styles.backgroundSlideshow}>
        {slides.length > 0 && (
          <img 
            src={currentItem?.image} 
            alt={currentItem?.title}
            className={styles.backgroundImage}
          />
        )}
        <div className={styles.backgroundOverlay} />
      </div>

      {/* Weather Widget */}
      {weather && (
        <div className={styles.weatherWidget}>
          <img src={weather.icon_url} alt={weather.description} />
          <span className={styles.temp}>{Math.round(weather.temperature)}°C</span>
        </div>
      )}

      {/* City Name */}
      <div className={styles.cityInfo}>
        <h1>{totem?.city_name || 'Niteroi'}</h1>
        {weather && <p>{weather.description}</p>}
      </div>

      {/* Ad Badge - mostrar quando for anúncio */}
      {currentItem?.type === 'ad' && (
        <div className={styles.adBadge}>
          <span>📢 {currentItem.advertiser}</span>
        </div>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className={styles.slideIndicators}>
          {slides.map((slide, idx) => (
            <span 
              key={idx}
              className={`${styles.indicator} ${idx === currentSlide ? styles.active : ''} ${slide.type === 'ad' ? styles.adIndicator : ''}`}
            />
          ))}
        </div>
      )}

      {/* Call to Action */}
      <div className={styles.callToAction}>
        <span className={styles.handIcon}>👆</span>
        <p>{t('home.touchToInteract', 'Toque para interagir')}</p>
      </div>

      {/* Location */}
      <div className={styles.location}>
        <span>📍 {totem?.address || 'Praça Arariboia, Centro'}</span>
      </div>
    </div>
  );
};

export default Home;
