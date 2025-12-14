import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { weatherService } from '../services/api';
import styles from '../styles/Weather.module.css';

const Weather: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { totem } = useTotemStore();
  const [current, setCurrent] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getWeatherType = (icon: string, description: string): string => {
    const desc = description?.toLowerCase() || '';
    const iconCode = icon || '01d';
    
    if (iconCode.includes('n')) return 'night';
    if (desc.includes('storm') || desc.includes('thunder')) return 'stormy';
    if (desc.includes('rain') || desc.includes('chuva')) return 'rainy';
    if (desc.includes('cloud') || desc.includes('nublado')) {
      if (desc.includes('parcial') || desc.includes('partly') || desc.includes('few')) {
        return 'partlyCloudy';
      }
      return 'cloudy';
    }
    return 'sunny';
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return t('weather.today');
    if (date.toDateString() === tomorrow.toDateString()) return t('weather.tomorrow');
    
    const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
    return date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
  };

  useEffect(() => {
    const cityId = totem?.city || 1;
    
    Promise.all([
      weatherService.getCurrent(cityId),
      weatherService.getForecast(cityId)
    ]).then(([currentRes, forecastRes]) => {
      setCurrent(currentRes.data);
      setForecast(forecastRes.data.forecast?.slice(0, 5) || []);
      setLoading(false);
    }).catch(err => {
      console.error('Weather error:', err);
      setCurrent({
        temperature: 28,
        feels_like: 30,
        humidity: 65,
        wind_speed: 12,
        description: 'Parcialmente nublado',
        icon: '02d',
        icon_url: 'https://openweathermap.org/img/wn/02d@4x.png'
      });
      setLoading(false);
    });
  }, [totem]);

  if (loading) return <div className={styles.loading}>{t('weather.loading')}</div>;

  const weatherType = getWeatherType(current?.icon, current?.description);

  return (
    <div className={styles.weather}>
      <div className={`${styles.weatherBackground} ${styles[weatherType]}`} />
      
      <div className={styles.content}>
        <div className={styles.current}>
          <div className={styles.location}>Niteroi, RJ</div>
          <div className={styles.temp}>{Math.round(current?.temperature || 0)}°</div>
          <div className={styles.desc}>{current?.description}</div>
          <div className={styles.highLow}>
            Max: 32° Min: 24°
          </div>
        </div>

        <div className={styles.forecast}>
          <h3>{t('weather.forecast')}</h3>
          <div className={styles.forecastGrid}>
            {forecast.map((item, idx) => (
              <div key={idx} className={styles.forecastItem}>
                <span className={styles.dayName}>{getDayName(item.date)}</span>
                <img 
                  src={item.icon_url || 'https://openweathermap.org/img/wn/02d@2x.png'} 
                  alt="" 
                />
                <span className={styles.forecastTemp}>
                  <span className={styles.high}>{item.temp_max}°</span>
                  {' / '}
                  <span className={styles.low}>{item.temp_min}°</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.additionalInfo}>
          <div className={styles.infoCard}>
            <h4>{t('weather.humidity')}</h4>
            <div className={styles.value}>
              {current?.humidity}
              <span className={styles.unit}>%</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <h4>{t('weather.feelsLike')}</h4>
            <div className={styles.value}>
              {Math.round(current?.feels_like || 0)}
              <span className={styles.unit}>°C</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <h4>{t('weather.wind')}</h4>
            <div className={styles.value}>
              {Math.round(current?.wind_speed || 0)}
              <span className={styles.unit}>km/h</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <h4>{t('weather.uv')}</h4>
            <div className={styles.value}>
              6
              <span className={styles.unit}>{t('weather.high')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
