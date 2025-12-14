import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTotemStore } from '../store/totemStore';
import { navigationService } from '../services/api';
import styles from '../styles/Navigation.module.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SearchResult {
  name: string;
  label: string;
  latitude: number;
  longitude: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry: string;
  steps: Array<{ instruction: string; distance: number }>;
}

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

const Navigation: React.FC = () => {
  const { totem } = useTotemStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<SearchResult | null>(null);
  const [transportMode, setTransportMode] = useState<'walking' | 'driving' | 'cycling'>('walking');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const origin: [number, number] = totem 
    ? [Number(totem.latitude), Number(totem.longitude)]
    : [-22.9068, -43.1729]; // Default: Rio de Janeiro

  // Search for places
  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 3) return;
    
    setIsLoading(true);
    try {
      const response = await navigationService.geocode(searchQuery);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Get route when destination or mode changes
  useEffect(() => {
    if (!selectedDestination) return;

    const getRoute = async () => {
      setIsLoading(true);
      try {
        const destination: [number, number] = [
          selectedDestination.latitude,
          selectedDestination.longitude
        ];
        
        const response = await navigationService.getRoute(origin, destination, transportMode);
        
        if (response.data.success) {
          setRoute(response.data);
          
          // Decode polyline geometry
          if (response.data.geometry) {
            const coords = decodePolyline(response.data.geometry);
            setRouteCoords(coords);
          }
        }
      } catch (error) {
        console.error('Route error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getRoute();
  }, [selectedDestination, transportMode, origin]);

  // Generate QR Code
  const handleGetQRCode = async () => {
    if (!selectedDestination) return;
    
    try {
      const response = await navigationService.getQRCode(
        [selectedDestination.latitude, selectedDestination.longitude],
        selectedDestination.name
      );
      setQRCode(response.data.qr_code);
    } catch (error) {
      console.error('QR Code error:', error);
    }
  };

  // Decode polyline (simplified version)
  const decodePolyline = (encoded: string): [number, number][] => {
    const coords: [number, number][] = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += (result & 1) ? ~(result >> 1) : (result >> 1);

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += (result & 1) ? ~(result >> 1) : (result >> 1);

      coords.push([lat / 1e5, lng / 1e5]);
    }
    return coords;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}min`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div className={styles.navigation}>
      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Para onde você quer ir?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className={styles.searchBtn} onClick={handleSearch}>
          🔍
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedDestination && (
        <div className={styles.results}>
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              className={styles.resultItem}
              onClick={() => {
                setSelectedDestination(result);
                setSearchResults([]);
              }}
            >
              <span className={styles.resultIcon}>📍</span>
              <span className={styles.resultText}>{result.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className={styles.mapContainer}>
        <MapContainer
          center={origin}
          zoom={14}
          className={styles.map}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          {/* Origin Marker */}
          <Marker position={origin}>
            <Popup>📍 Você está aqui</Popup>
          </Marker>

          {/* Destination Marker */}
          {selectedDestination && (
            <Marker position={[selectedDestination.latitude, selectedDestination.longitude]}>
              <Popup>🎯 {selectedDestination.name}</Popup>
            </Marker>
          )}

          {/* Route Line */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              color="#3182ce"
              weight={5}
              opacity={0.8}
            />
          )}

          <MapController 
            center={selectedDestination 
              ? [selectedDestination.latitude, selectedDestination.longitude] 
              : origin
            }
            zoom={selectedDestination ? 15 : 14}
          />
        </MapContainer>
      </div>

      {/* Route Info Panel */}
      {selectedDestination && (
        <div className={styles.routePanel}>
          <div className={styles.destination}>
            <h3>🎯 {selectedDestination.name}</h3>
            <button 
              className={styles.clearBtn}
              onClick={() => {
                setSelectedDestination(null);
                setRoute(null);
                setRouteCoords([]);
                setQRCode(null);
              }}
            >
              ✕
            </button>
          </div>

          {/* Transport Modes */}
          <div className={styles.modes}>
            <button
              className={`${styles.modeBtn} ${transportMode === 'walking' ? styles.active : ''}`}
              onClick={() => setTransportMode('walking')}
            >
              🚶 A pé
            </button>
            <button
              className={`${styles.modeBtn} ${transportMode === 'driving' ? styles.active : ''}`}
              onClick={() => setTransportMode('driving')}
            >
              🚗 Carro
            </button>
            <button
              className={`${styles.modeBtn} ${transportMode === 'cycling' ? styles.active : ''}`}
              onClick={() => setTransportMode('cycling')}
            >
              🚴 Bicicleta
            </button>
          </div>

          {/* Route Summary */}
          {route && (
            <div className={styles.routeSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryIcon}>⏱️</span>
                <span className={styles.summaryValue}>{formatDuration(route.duration)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryIcon}>📏</span>
                <span className={styles.summaryValue}>{formatDistance(route.distance)}</span>
              </div>
            </div>
          )}

          {/* QR Code Button */}
          <button className={styles.qrBtn} onClick={handleGetQRCode}>
            📱 Enviar para celular
          </button>

          {/* QR Code Display */}
          {qrCode && (
            <div className={styles.qrCode}>
              <img src={qrCode} alt="QR Code" />
              <p>Escaneie para abrir no celular</p>
            </div>
          )}
        </div>
      )}

      {isLoading && <div className={styles.loading}>Carregando...</div>}
    </div>
  );
};

export default Navigation;
