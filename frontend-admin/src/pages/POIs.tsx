import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { contentService } from '../services/api';
import styles from '../styles/Content.module.css';

const poiTypes = [
  { value: '', label: 'Todos', icon: '📍' },
  { value: 'hospital', label: 'Hospitais', icon: '🏥' },
  { value: 'restaurant', label: 'Restaurantes', icon: '🍽️' },
  { value: 'hotel', label: 'Hotéis', icon: '🏨' },
  { value: 'transport', label: 'Transporte', icon: '🚌' },
  { value: 'attraction', label: 'Atrações', icon: '🎡' },
];

const POIs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pois, setPois] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');

  useEffect(() => {
    contentService.getPOIs(selectedType).then(res => setPois(res.data.results || res.data || []));
  }, [selectedType]);

  return (
    <div className={styles.content}>
      <h2>📍 Pontos de Interesse</h2>
      <div className={styles.filters}>
        {poiTypes.map(type => (
          <button key={type.value} className={`${styles.filterBtn} ${selectedType === type.value ? styles.active : ''}`}
            onClick={() => { setSelectedType(type.value); setSearchParams(type.value ? { type: type.value } : {}); }}>
            {type.icon} {type.label}
          </button>
        ))}
      </div>
      <div className={styles.list}>
        {pois.map(poi => (
          <div key={poi.id} className={styles.card}>
            <div className={styles.info}>
              <h3>{poi.name}</h3>
              <p className={styles.meta}>📍 {poi.address}</p>
              {poi.phone && <p className={styles.meta}>📞 {poi.phone}</p>}
            </div>
          </div>
        ))}
        {pois.length === 0 && <p>Nenhum ponto encontrado.</p>}
      </div>
    </div>
  );
};
export default POIs;
