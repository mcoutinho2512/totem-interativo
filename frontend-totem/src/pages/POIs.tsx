import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTotemStore } from '../store/totemStore';
import { contentService } from '../services/api';
import styles from '../styles/POIs.module.css';

const POIs: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { totem } = useTotemStore();
  const [pois, setPois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState(searchParams.get('type') || '');

  const poiTypes = [
    { key: '', label: t('pois.all') },
    { key: 'hospital', label: t('pois.hospitals') },
    { key: 'restaurant', label: t('pois.restaurants') },
    { key: 'hotel', label: t('pois.hotels') },
    { key: 'transport', label: t('pois.transport') },
    { key: 'attraction', label: t('pois.attractions') },
  ];

  useEffect(() => {
    contentService.getPOIs(activeType || undefined)
      .then(res => {
        setPois(res.data.results || res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeType]);

  if (loading) return <div className={styles.loading}>{t('app.loading')}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('pois.title')}</h1>
      
      <div className={styles.filters}>
        {poiTypes.map((type) => (
          <button
            key={type.key}
            className={`${styles.filterBtn} ${activeType === type.key ? styles.active : ''}`}
            onClick={() => setActiveType(type.key)}
          >
            {type.label}
          </button>
        ))}
      </div>

      {pois.length === 0 ? (
        <p className={styles.noPois}>{t('pois.noPois')}</p>
      ) : (
        <div className={styles.poisList}>
          {pois.map((poi) => (
            <div key={poi.id} className={styles.poiCard}>
              <div className={styles.poiInfo}>
                <h3 className={styles.poiName}>{poi.name}</h3>
                <p className={styles.poiAddress}>{poi.address}</p>
                {poi.phone && (
                  <p className={styles.poiPhone}>
                    <a href={`tel:${poi.phone}`}>{poi.phone}</a>
                  </p>
                )}
              </div>
              <div className={styles.poiActions}>
                {poi.phone && (
                  <a href={`tel:${poi.phone}`} className={styles.callBtn}>
                    {t('pois.call')}
                  </a>
                )}
                {poi.latitude && poi.longitude && (
                  <button 
                    className={styles.routeBtn}
                    onClick={() => navigate(`/navigation?lat=${poi.latitude}&lng=${poi.longitude}&name=${encodeURIComponent(poi.name)}`)}
                  >
                    {t('pois.routeTo')}
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

export default POIs;
