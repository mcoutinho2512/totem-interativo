import React, { useEffect, useState } from 'react';
import { contentService } from '../services/api';
import styles from '../styles/Content.module.css';

const News: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  useEffect(() => { contentService.getNews(20).then(res => setNews(res.data.results || res.data || [])); }, []);

  return (
    <div className={styles.content}>
      <h2>📰 Notícias</h2>
      <div className={styles.list}>
        {news.map(item => (
          <div key={item.id} className={styles.card}>
            {item.image && <img src={item.image} alt={item.title} className={styles.image} />}
            <div className={styles.info}>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
              <p className={styles.meta}>{new Date(item.publish_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        ))}
        {news.length === 0 && <p>Nenhuma notícia encontrada.</p>}
      </div>
    </div>
  );
};
export default News;
