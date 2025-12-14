import React, { useEffect, useState } from 'react';
import { contentService } from '../services/api';
import styles from '../styles/Content.module.css';

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => { contentService.getEvents(20).then(res => setEvents(res.data.results || res.data || [])); }, []);

  return (
    <div className={styles.content}>
      <h2>📅 Eventos</h2>
      <div className={styles.list}>
        {events.map(event => (
          <div key={event.id} className={styles.card}>
            {event.image && <img src={event.image} alt={event.title} className={styles.image} />}
            <div className={styles.info}>
              <h3>{event.title}</h3>
              <p className={styles.meta}>📍 {event.venue}</p>
              <p className={styles.meta}>🗓️ {new Date(event.start_date).toLocaleDateString('pt-BR')}</p>
              <p className={styles.price}>{event.price}</p>
            </div>
          </div>
        ))}
        {events.length === 0 && <p>Nenhum evento encontrado.</p>}
      </div>
    </div>
  );
};
export default Events;
