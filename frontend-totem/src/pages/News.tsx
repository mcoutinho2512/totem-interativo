import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { contentService } from '../services/api';
import styles from '../styles/News.module.css';

const News: React.FC = () => {
  const { t } = useTranslation();
  const { totem } = useTotemStore();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentService.getNews()
      .then(res => {
        setNews(res.data.results || res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>{t('app.loading')}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('news.latest')}</h1>
      
      {news.length === 0 ? (
        <p className={styles.noNews}>{t('news.noNews')}</p>
      ) : (
        <div className={styles.newsList}>
          {news.map((item) => (
            <div key={item.id} className={styles.newsCard}>
              {item.image && (
                <div className={styles.newsImage}>
                  <img src={item.image} alt={item.title} />
                </div>
              )}
              <div className={styles.newsInfo}>
                <h3 className={styles.newsTitle}>{item.title}</h3>
                <p className={styles.newsSubtitle}>{item.subtitle}</p>
                <p className={styles.newsDate}>
                  {new Date(item.publish_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default News;
