import React, { useEffect, useState } from 'react';
import { useTotemStore } from '../store/totemStore';
import { weatherService } from '../services/api';
import styles from '../styles/Weather.module.css';

const Weather: React.FC = () => {
  const { totem } = useTotemStore();
  const [current, setCurrent] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);

  useEffect(() => {
    if (totem?.city) {
      weatherService.getCurrent(totem.city).then(res => setCurrent(res.data));
      weatherService.getForecast(totem.city).then(res => setForecast(res.data.forecast?.slice(0, 8) || []));
    }
  }, [totem]);

  if (!current) return <div className={styles.loading}>Carregando clima...</div>;

  return (
    <div className={styles.weather}>
      <div className={styles.current}>
        <img src={current.icon_url} alt={current.description} className={styles.icon} />
        <div className={styles.temp}>{Math.round(current.temperature)}°C</div>
        <div className={styles.desc}>{current.description}</div>
        <div className={styles.details}>
          <span>💧 {current.humidity}%</span>
          <span>💨 {current.wind_speed} m/s</span>
          <span>🌡️ Sensação {Math.round(current.feels_like)}°C</span>
        </div>
      </div>
      <div className={styles.forecast}>
        <h3>Próximas Horas</h3>
        <div className={styles.forecastGrid}>
          {forecast.map((item, idx) => (
            <div key={idx} className={styles.forecastItem}>
              <span className={styles.time}>{item.datetime?.split(' ')[1]?.slice(0,5)}</span>
              <img src={item.icon_url} alt="" />
              <span className={styles.forecastTemp}>{Math.round(item.temperature)}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Weather;
