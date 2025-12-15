import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { weatherService, advertisingService } from '../services/api';
import styles from '../styles/Home.module.css';

interface WeatherData {
  temperature: number;
  description: string;
  icon_url: string;
}

interface SlideItem {
  id: number;
  image: string;
  duration: number;
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

        // Carregar SOMENTE anúncios ativos
        const adsRes = await advertisingService.getActiveAds(totem?.id || 1);
        const adSlides: SlideItem[] = (adsRes.data || []).map((ad: any) => ({
          id: ad.id,
          image: ad.file.startsWith('http') ? ad.file : `http://10.50.30.168:8000${ad.file}`,
          duration: ad.duration || 8
        }));

        setSlides(adSlides);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    // Recarregar a cada 5 minutos
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, [totem]);

  // Auto-rotate slides usando a duração de cada anúncio
  useEffect(() => {
    if (slides.length > 0 && !isInteracting) {
      const currentDuration = (slides[currentSlide]?.duration || 8) * 1000;
      const timer = setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, currentDuration);
      return () => clearTimeout(timer);
    }
  }, [slides, currentSlide, isInteracting]);

  // Registrar impressão de anúncio
  useEffect(() => {
    const currentItem = slides[currentSlide];
    if (currentItem && totem?.id) {
      advertisingService.logImpression(currentItem.id, totem.id, currentItem.duration || 8).catch(() => {});
    }
  }, [currentSlide, slides, totem]);

  const handleInteraction = () => {
    setIsInteracting(true);
    navigate('/home-tomi');
  };

  const currentItem = slides[currentSlide];

  return (
    <div className={styles.home} onClick={handleInteraction}>
      {/* Background Slideshow - Imagem sem título */}
      <div className={styles.backgroundSlideshow}>
        {slides.length > 0 && currentItem && (
          <img
            src={currentItem.image}
            alt=""
            className={styles.backgroundImage}
          />
        )}
      </div>

      {/* Header com cidade e hora */}
      <div className={styles.topBar}>
        <span className={styles.cityName}>{totem?.city_name || 'Niteroi'}</span>
        <span className={styles.clock}>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className={styles.slideIndicators}>
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`${styles.indicator} ${idx === currentSlide ? styles.active : ''}`}
            />
          ))}
        </div>
      )}

      {/* Call to Action */}
      <div className={styles.callToAction}>
        <span className={styles.handIcon}>👆</span>
        <p>{t('home.touchToInteract', 'TOQUE PARA INTERAGIR')}</p>
      </div>
    </div>
  );
};

export default Home;
