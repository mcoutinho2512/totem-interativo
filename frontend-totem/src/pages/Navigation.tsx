import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSearchParams } from 'react-router-dom';
import { useTotemStore } from '../store/totemStore';
import { navigationService } from '../services/api';
import styles from '../styles/Navigation.module.css';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const FitBounds: React.FC<{ bounds: L.LatLngBoundsExpression | null }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
};

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const { totem } = useTotemStore();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const defaultCenter: [number, number] = [-22.8972, -43.1072];
  
  const getTotemLocation = (): [number, number] => {
    if (totem?.latitude && totem?.longitude) {
      return [Number(totem.latitude), Number(totem.longitude)];
    }
    return defaultCenter;
  };
  
  const totemLocation = getTotemLocation();

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const name = searchParams.get('name');
    
    if (lat && lng) {
      setSearch(name || lat + ', ' + lng);
      handleRoute(parseFloat(lat), parseFloat(lng));
    }
  }, [searchParams]);

  const handleRoute = async (destLat: number, destLng: number) => {
    setLoading(true);
    try {
      const res = await navigationService.getRoute(totemLocation, [destLat, destLng]);
      setRoute(res.data);
    } catch (err) {
      console.error('Route error:', err);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await navigationService.geocode(search);
      if (res.data.results?.length > 0) {
        const { lat, lng } = res.data.results[0];
        await handleRoute(lat, lng);
      }
    } catch (err) {
      console.error('Geocode error:', err);
    }
    setLoading(false);
  };

  const routeCoords = route?.geometry?.coordinates?.map((c: number[]) => [c[1], c[0]]) || [];
  const bounds = routeCoords.length > 0 ? L.latLngBounds(routeCoords) : null;

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder={t('navigation.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className={styles.searchInput}
        />
        <button onClick={handleSearch} className={styles.searchBtn} disabled={loading}>
          🔍
        </button>
      </div>

      <div className={styles.mapWrapper}>
        <MapContainer center={totemLocation} zoom={14} className={styles.map}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <Marker position={totemLocation}>
            <Popup>{t('navigation.myLocation')}</Popup>
          </Marker>
          {route?.destination && (
            <Marker position={[route.destination.lat, route.destination.lng]}>
              <Popup>{t('navigation.destination')}</Popup>
            </Marker>
          )}
          {routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} color="#1a73e8" weight={5} />
              <FitBounds bounds={bounds} />
            </>
          )}
        </MapContainer>
      </div>

      {route && (
        <div className={styles.routeInfo}>
          <div className={styles.routeDetail}>
            <span className={styles.label}>{t('navigation.distance')}:</span>
            <span className={styles.value}>{(route.distance / 1000).toFixed(1)} km</span>
          </div>
          <div className={styles.routeDetail}>
            <span className={styles.label}>{t('navigation.duration')}:</span>
            <span className={styles.value}>{Math.round(route.duration / 60)} min</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;
