import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTotemStore } from '../store/totemStore';
import { navigationService } from '../services/api';
import styles from '../styles/Navigation.module.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SearchResult {
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry: [number, number][];
}

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
};

const Navigation: React.FC = () => {
  const { totem } = useTotemStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<SearchResult | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [transportMode, setTransportMode] = useState('foot-walking');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQRCode] = useState<string | null>(null);

  const position: [number, number] = totem 
    ? [Number(totem.latitude), Number(totem.longitude)]
    : [-22.8833, -43.1033];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await navigationService.geocode(searchQuery);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Geocode error:', error);
      setSearchResults([]);
    }
    setIsLoading(false);
  };

  const handleSelectDestination = async (result: SearchResult) => {
    setSelectedDestination(result);
    setSearchResults([]);
    setSearchQuery(result.name);
    await calculateRoute(result);
  };

  const calculateRoute = async (destination: SearchResult) => {
    setIsLoading(true);
    try {
      const response = await navigationService.getRoute(
        position,
        [destination.latitude, destination.longitude],
        transportMode
      );
      setRoute(response.data);
    } catch (error) {
      console.error('Route error:', error);
    }
    setIsLoading(false);
  };

  const handleModeChange = async (mode: string) => {
    setTransportMode(mode);
    if (selectedDestination) {
      setIsLoading(true);
      try {
        const response = await navigationService.getRoute(
          position,
          [selectedDestination.latitude, selectedDestination.longitude],
          mode
        );
        setRoute(response.data);
      } catch (error) {
        console.error('Route error:', error);
      }
      setIsLoading(false);
    }
  };

  const handleGetQRCode = async () => {
    if (!selectedDestination) return;
    
    try {
      const response = await navigationService.getQRCode(
        position,
        [selectedDestination.latitude, selectedDestination.longitude]
      );
      setQRCode(response.data.qr_code);
    } catch (error) {
      console.error('QR Code error:', error);
    }
  };

  const clearRoute = () => {
    setSelectedDestination(null);
    setRoute(null);
    setSearchQuery('');
    setQRCode(null);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)} seg`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}min`;
  };

  const transportModes = [
    { id: 'foot-walking', icon: '🚶', label: 'A pé' },
    { id: 'cycling-regular', icon: '🚴', label: 'Bicicleta' },
    { id: 'driving-car', icon: '🚗', label: 'Carro' },
  ];

  return (
    <div className={styles.navigation}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Para onde você quer ir?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className={styles.searchBtn} onClick={handleSearch}>
          🔍
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className={styles.results}>
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              className={styles.resultItem}
              onClick={() => handleSelectDestination(result)}
            >
              <span className={styles.resultIcon}>📍</span>
              <span className={styles.resultText}>{result.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.mapContainer}>
        <MapContainer center={position} zoom={15} className={styles.map}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <MapUpdater center={position} />
          <Marker position={position}>
            <Popup>📍 Você está aqui</Popup>
          </Marker>
          {selectedDestination && (
            <Marker position={[selectedDestination.latitude, selectedDestination.longitude]}>
              <Popup>🎯 {selectedDestination.name}</Popup>
            </Marker>
          )}
          {route && route.geometry && (
            <Polyline positions={route.geometry} color="#3182ce" weight={5} />
          )}
        </MapContainer>
        {isLoading && <div className={styles.loading}>Calculando...</div>}
      </div>

      {selectedDestination && route && (
        <div className={styles.routePanel}>
          <div className={styles.destination}>
            <h3>🎯 {selectedDestination.name}</h3>
            <button className={styles.clearBtn} onClick={clearRoute}>✕</button>
          </div>

          <div className={styles.modes}>
            {transportModes.map((mode) => (
              <button
                key={mode.id}
                className={`${styles.modeBtn} ${transportMode === mode.id ? styles.active : ''}`}
                onClick={() => handleModeChange(mode.id)}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          <div className={styles.routeSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryIcon}>📏</span>
              <span className={styles.summaryValue}>{formatDistance(route.distance)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryIcon}>⏱️</span>
              <span className={styles.summaryValue}>{formatDuration(route.duration)}</span>
            </div>
          </div>

          <button className={styles.qrBtn} onClick={handleGetQRCode}>
            📱 Enviar para celular
          </button>

          {qrCode && (
            <div className={styles.qrCode}>
              <img src={qrCode} alt="QR Code" />
              <p>Escaneie para abrir no Google Maps</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navigation;
