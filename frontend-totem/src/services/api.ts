import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://10.50.30.168:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const totemId = localStorage.getItem('totem_id');
  const cityId = localStorage.getItem('city_id');
  
  if (totemId) {
    config.headers['X-Totem-ID'] = totemId;
  }
  if (cityId) {
    config.headers['X-City-ID'] = cityId;
  }
  
  return config;
});

export const totemService = {
  identify: (identifier: string) => api.post('/totems/identify/', { identifier }),
  heartbeat: (id: number) => api.post(`/totems/${id}/heartbeat/`),
  startSession: (totemId: number, language: string) => 
    api.post('/totems/sessions/', { totem: totemId, language }),
  endSession: (sessionId: number) => 
    api.patch(`/totems/sessions/${sessionId}/`, { ended_at: new Date().toISOString() }),
};

export const weatherService = {
  getCurrent: (cityId: number) => api.get(`/weather/current/?city=${cityId}`),
  getForecast: (cityId: number) => api.get(`/weather/forecast/?city=${cityId}`),
  getAlerts: (cityId: number) => api.get(`/weather/alerts/?city=${cityId}`),
};

export const contentService = {
  getNews: (limit?: number) => api.get(`/content/news/${limit ? '?limit=' + limit : ''}`),
  getFeaturedNews: () => api.get('/content/news/featured/'),
  getEvents: (limit?: number) => api.get(`/content/events/${limit ? '?limit=' + limit : ''}`),
  getUpcomingEvents: () => api.get('/content/events/upcoming/'),
  getFeaturedEvents: () => api.get('/content/events/featured/'),
  getGallery: () => api.get('/content/gallery/active/'),
  getPOIs: (type?: string) => api.get(`/content/pois/${type ? '?poi_type=' + type : ''}`),
  getNearbyPOIs: (lat: number, lng: number, radius?: number) => 
    api.get(`/content/pois/nearby/?lat=${lat}&lng=${lng}${radius ? '&radius=' + radius : ''}`),
  getCategories: () => api.get('/content/categories/'),
  getCurrentPlaylist: () => api.get('/content/playlists/current/'),
  getPlaylist: (id: number) => api.get(`/content/playlists/${id}/`),
  getAllPlaylists: () => api.get('/content/playlists/'),
};

export const navigationService = {
  getRoute: (from: [number, number], to: [number, number], mode: string = 'foot-walking') =>
    api.post('/navigation/route/', {
      from_lat: from[0],
      from_lng: from[1],
      to_lat: to[0],
      to_lng: to[1],
      mode,
    }),
  getAllRoutes: (from: [number, number], to: [number, number]) =>
    api.post('/navigation/routes/', {
      from_lat: from[0],
      from_lng: from[1],
      to_lat: to[0],
      to_lng: to[1],
    }),
  geocode: (query: string) => api.get(`/navigation/geocode/?q=${encodeURIComponent(query)}`),
  getQRCode: (from: [number, number], to: [number, number]) =>
    api.post('/navigation/qrcode/', {
      from_lat: from[0],
      from_lng: from[1],
      to_lat: to[0],
      to_lng: to[1],
    }),
};

export const advertisingService = {
  getActiveAds: (totemId: number) => api.get(`/advertising/active/?totem=${totemId}`),
  logImpression: (creativeId: number, totemId: number, duration: number) =>
    api.post('/advertising/active/', { creative_id: creativeId, totem_id: totemId, view_duration: duration }),
};

export default api;
