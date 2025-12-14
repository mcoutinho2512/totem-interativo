import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTotemStore } from '../store/totemStore';
import { contentService } from '../services/api';
import styles from '../styles/Events.module.css';

const Events: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { totem } = useTotemStore();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentService.getUpcomingEvents()
      .then(res => {
        setEvents(res.data.results || res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>{t('app.loading')}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('events.upcoming')}</h1>
      
      {events.length === 0 ? (
        <p className={styles.noEvents}>{t('events.noEvents')}</p>
      ) : (
        <div className={styles.eventsList}>
          {events.map((event) => (
            <div key={event.id} className={styles.eventCard}>
              {event.image && (
                <div className={styles.eventImage}>
                  <img src={event.image} alt={event.title} />
                </div>
              )}
              <div className={styles.eventInfo}>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                <p className={styles.eventDate}>
                  {new Date(event.start_date).toLocaleDateString()}
                </p>
                <p className={styles.eventVenue}>{event.venue}</p>
                <p className={styles.eventPrice}>
                  {event.price === 'Gratuito' || event.price === '0' ? t('events.free') : event.price}
                </p>
                {event.latitude && event.longitude && (
                  <button 
                    className={styles.routeBtn}
                    onClick={() => navigate(`/navigation?lat=${event.latitude}&lng=${event.longitude}&name=${encodeURIComponent(event.title)}`)}
                  >
                    {t('events.routeTo')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
