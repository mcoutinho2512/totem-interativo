import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { contentService, weatherService, advertisingService } from '../services/api';
import styles from '../styles/Player.module.css';

interface SlideItem {
  id: number;
  type: 'gallery' | 'ad' | 'weather' | 'clock';
  title: string;
  image?: string;
  duration: number;
  advertiser?: string;
}

const Player: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { totem } = useTotemStore();
  
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weather, setWeather] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transitioning, setTransitioning] = useState(false);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load all content
  useEffect(() => {
    const loadContent = async () => {
      try {
        // Weather
        if (totem?.city) {
          const weatherRes = await weatherService.getCurrent(totem.city);
          setWeather(weatherRes.data);
        }

        const allSlides: SlideItem[] = [];

        // Slide de relógio/clima (primeiro)
        allSlides.push({
          id: 0,
          type: 'clock',
          title: 'Relógio',
          duration: 8
        });

        // Carregar galeria
        try {
          const galleryRes = await contentService.getGallery();
          const galleryData = galleryRes.data?.results || galleryRes.data || [];
          galleryData.forEach((item: any, idx: number) => {
            allSlides.push({
              id: item.id,
              type: 'gallery',
              title: item.title,
              image: item.image,
              duration: 6
            });
          });
        } catch (e) {
          console.log('No gallery');
        }

        // Carregar anúncios
        try {
          const adsRes = await advertisingService.getActiveAds(totem?.id || 1);
          const adsData = adsRes.data || [];
          adsData.forEach((ad: any) => {
            allSlides.push({
              id: ad.id,
              type: 'ad',
              title: ad.name,
              image: ad.file.startsWith('http') ? ad.file : `http://10.50.30.168:8000${ad.file}`,
              duration: ad.duration || 8,
              advertiser: ad.name
            });
          });
        } catch (e) {
          console.log('No ads');
        }

        // Intercalar: clock, gallery, ad, gallery, ad...
        const finalSlides: SlideItem[] = [];
        const galleries = allSlides.filter(s => s.type === 'gallery');
        const ads = allSlides.filter(s => s.type === 'ad');
        const clock = allSlides.find(s => s.type === 'clock');

        if (clock) finalSlides.push(clock);

        const maxLen = Math.max(galleries.length, ads.length);
        for (let i = 0; i < maxLen; i++) {
          if (galleries[i]) finalSlides.push(galleries[i]);
          if (ads[i]) finalSlides.push(ads[i]);
        }

        // Se não tem nada, pelo menos mostra o clock
        if (finalSlides.length === 0 && clock) {
          finalSlides.push(clock);
        }

        setSlides(finalSlides);
      } catch (error) {
        console.error('Error loading content:', error);
      }
    };

    loadContent();
    const interval = setInterval(loadContent, 300000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [totem]);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length === 0) return;
    
    const currentItem = slides[currentIndex];
    const duration = currentItem?.duration || 8;
    
    const timer = setTimeout(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
        setTransitioning(false);
      }, 500);
    }, duration * 1000);
    
    return () => clearTimeout(timer);
  }, [currentIndex, slides]);

  // Log ad impression
  useEffect(() => {
    const currentItem = slides[currentIndex];
    if (currentItem?.type === 'ad' && totem?.id) {
      advertisingService.logImpression(currentItem.id, totem.id, currentItem.duration).catch(() => {});
    }
  }, [currentIndex, slides, totem]);

  // Handle touch - go to interactive mode
  const handleTouch = useCallback(() => {
    navigate('/?theme=tomi');
  }, [navigate]);

  // Render slide content
  const renderSlide = (item: SlideItem) => {
    switch (item.type) {
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
            <div className={styles.clockCity}>{totem?.city_name || 'Niteroi'}</div>
            {weather && (
              <div className={styles.clockWeather}>
                <img src={weather.icon_url} alt="" />
                <span className={styles.clockTemp}>{Math.round(weather.temperature)}°C</span>
                <span className={styles.clockDesc}>{weather.description}</span>
              </div>
            )}
          </div>
        );

      case 'gallery':
      case 'ad':
        return (
          <div className={styles.imageSlide}>
            <img src={item.image} alt={item.title} className={styles.slideImage} />
            <div className={styles.imageOverlay} />
            {item.type === 'ad' && (
              <div className={styles.adBadge}>
                <span>📢 Publicidade</span>
                <span className={styles.advertiserName}>{item.advertiser}</span>
              </div>
            )}
            {item.type === 'gallery' && (
              <div className={styles.galleryTitle}>
                <span>{item.title}</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className={styles.defaultSlide}>
            <h1>🏙️ {totem?.city_name || 'Niteroi'}</h1>
            <p>Toque para explorar</p>
          </div>
        );
    }
  };

  const currentItem = slides[currentIndex];

  return (
    <div className={styles.player} onClick={handleTouch}>
      {/* Progress bar */}
      {slides.length > 1 && (
        <div className={styles.progressBar}>
          {slides.map((slide, idx) => (
            <div 
              key={idx} 
              className={`${styles.progressDot} ${idx === currentIndex ? styles.active : ''} ${slide.type === 'ad' ? styles.adDot : ''}`}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className={`${styles.content} ${transitioning ? styles.fadeOut : styles.fadeIn}`}>
        {currentItem ? renderSlide(currentItem) : (
          <div className={styles.clockSlide}>
            <div className={styles.clockTime}>
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className={styles.clockCity}>{totem?.city_name || 'Niteroi'}</div>
          </div>
        )}
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
          <span>{totem?.city_name || 'Niteroi'}</span>
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
