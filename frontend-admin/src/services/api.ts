import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Weather Service
export const weatherService = {
  getCurrent: (cityId: number) => 
    api.get(`/weather/current/?city_id=${cityId}`),
  
  getForecast: (cityId: number) => 
    api.get(`/weather/forecast/?city_id=${cityId}`),
  
  getAlerts: (cityId: number) => 
    api.get(`/weather/alerts/?city=${cityId}`),
};

// Navigation Service
export const navigationService = {
  getRoute: (origin: [number, number], destination: [number, number], mode: string) =>
    api.post('/navigation/route/', {
      origin_lat: origin[0],
      origin_lng: origin[1],
      destination_lat: destination[0],
      destination_lng: destination[1],
      mode,
    }),

  getAllRoutes: (origin: [number, number], destination: [number, number]) =>
    api.post('/navigation/routes/', {
      origin_lat: origin[0],
      origin_lng: origin[1],
      destination_lat: destination[0],
      destination_lng: destination[1],
    }),

  geocode: (query: string) =>
    api.get(`/navigation/geocode/?q=${encodeURIComponent(query)}`),

  getQRCode: (destination: [number, number], name: string) =>
    api.post('/navigation/qrcode/', {
      destination_lat: destination[0],
      destination_lng: destination[1],
      destination_name: name,
    }),
};

// Content Service
export const contentService = {
  getNews: (limit = 10) =>
    api.get(`/content/news/?limit=${limit}`),

  getFeaturedNews: () =>
    api.get('/content/news/featured/'),

  getEvents: (limit = 10) =>
    api.get(`/content/events/upcoming/?limit=${limit}`),

  getFeaturedEvents: () =>
    api.get('/content/events/featured/'),

  getGallery: () =>
    api.get('/content/gallery/active/'),

  getPOIs: (type?: string) =>
    api.get(`/content/pois/${type ? `?poi_type=${type}` : ''}`),

  getCategories: () =>
    api.get('/content/categories/'),
};

export default api;
