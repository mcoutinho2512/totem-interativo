import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://10.50.30.168:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add city header to all requests
api.interceptors.request.use((config) => {
  const cityId = localStorage.getItem('cityId') || '1';
  config.headers['X-City-ID'] = cityId;
  return config;
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
  // News
  getNews: (limit = 10) =>
    api.get(`/content/news/?limit=${limit}`),

  getFeaturedNews: () =>
    api.get('/content/news/featured/'),

  createNews: (data: any) =>
    api.post('/content/news/', data),

  updateNews: (id: number, data: any) =>
    api.put(`/content/news/${id}/`, data),

  deleteNews: (id: number) =>
    api.delete(`/content/news/${id}/`),

  // Events
  getEvents: (limit = 10) =>
    api.get(`/content/events/upcoming/?limit=${limit}`),

  getAllEvents: () =>
    api.get('/content/events/'),

  getFeaturedEvents: () =>
    api.get('/content/events/featured/'),

  createEvent: (data: FormData) =>
    api.post('/content/events/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateEvent: (id: number, data: FormData) =>
    api.put(`/content/events/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteEvent: (id: number) =>
    api.delete(`/content/events/${id}/`),

  // Gallery
  getGallery: () =>
    api.get('/content/gallery/active/'),

  getAllGallery: () =>
    api.get('/content/gallery/'),

  createGalleryImage: (data: any) =>
    api.post('/content/gallery/', data),

  updateGalleryImage: (id: number, data: any) =>
    api.put(`/content/gallery/${id}/`, data),

  deleteGalleryImage: (id: number) =>
    api.delete(`/content/gallery/${id}/`),

  uploadGallery: (formData: FormData) =>
    api.post('/content/gallery/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  bulkUploadGallery: (formData: FormData) =>
    api.post('/content/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // POIs
  getPOIs: (type?: string) =>
    api.get(`/content/pois/${type ? `?poi_type=${type}` : ''}`),

  createPOI: (data: any) =>
    api.post('/content/pois/', data),

  updatePOI: (id: number, data: any) =>
    api.put(`/content/pois/${id}/`, data),

  deletePOI: (id: number) =>
    api.delete(`/content/pois/${id}/`),

  // Categories
  getCategories: () =>
    api.get('/content/categories/'),

  // Upload
  upload: (formData: FormData) =>
    api.post('/content/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Advertising Service
export const advertisingService = {
  // Stats
  getStats: (days = 30) =>
    api.get(`/advertising/stats/?days=${days}`),

  getCampaignStats: (campaignId: number, days = 30) =>
    api.get(`/advertising/stats/campaign/${campaignId}/?days=${days}`),

  getDailyStats: (startDate?: string, endDate?: string, campaignId?: number) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (campaignId) params.append('campaign_id', campaignId.toString());
    return api.get(`/advertising/stats/daily/?${params.toString()}`);
  },

  exportImpressions: (startDate?: string, endDate?: string, campaignId?: number) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (campaignId) params.append('campaign_id', campaignId.toString());
    return api.get(`/advertising/impressions/export/?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  // Advertisers
  getAdvertisers: () =>
    api.get('/advertising/advertisers/'),

  createAdvertiser: (data: any) =>
    api.post('/advertising/advertisers/', data),

  updateAdvertiser: (id: number, data: any) =>
    api.put(`/advertising/advertisers/${id}/`, data),

  deleteAdvertiser: (id: number) =>
    api.delete(`/advertising/advertisers/${id}/`),

  // Campaigns
  getCampaigns: (status?: string) =>
    api.get(`/advertising/campaigns/${status ? `?status=${status}` : ''}`),

  getCampaign: (id: number) =>
    api.get(`/advertising/campaigns/${id}/`),

  createCampaign: (data: any) =>
    api.post('/advertising/campaigns/', data),

  updateCampaign: (id: number, data: any) =>
    api.put(`/advertising/campaigns/${id}/`, data),

  deleteCampaign: (id: number) =>
    api.delete(`/advertising/campaigns/${id}/`),

  // Creatives
  getCreatives: (campaignId?: number) =>
    api.get(`/advertising/creatives/${campaignId ? `?campaign=${campaignId}` : ''}`),

  createCreative: (data: FormData) =>
    api.post('/advertising/creatives/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateCreative: (id: number, data: FormData) =>
    api.put(`/advertising/creatives/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteCreative: (id: number) =>
    api.delete(`/advertising/creatives/${id}/`),

  // Upload
  uploadAd: (formData: FormData) =>
    api.post('/advertising/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Active Ads
  getActiveAds: (totemId?: number) =>
    api.get(`/advertising/active/${totemId ? `?totem_id=${totemId}` : ''}`),

  logImpression: (creativeId: number, totemId: number, duration: number) =>
    api.post(`/advertising/active/${creativeId}/impression/`, {
      totem_id: totemId,
      duration,
    }),
};

// Totems Service
export const totemsService = {
  getTotems: () =>
    api.get('/totems/'),

  getTotem: (id: number) =>
    api.get(`/totems/${id}/`),

  updateTotem: (id: number, data: FormData) =>
    api.patch(`/totems/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateTotemJson: (id: number, data: any) =>
    api.patch(`/totems/${id}/`, data),
};

// Content Blocks Service
export const contentBlocksService = {
  getBlocks: (totemId?: number) =>
    api.get(`/totems/blocks/${totemId ? `?totem=${totemId}` : ''}`),

  getBlock: (id: number) =>
    api.get(`/totems/blocks/${id}/`),

  createBlock: (data: FormData) =>
    api.post('/totems/blocks/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateBlock: (id: number, data: FormData) =>
    api.patch(`/totems/blocks/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateBlockJson: (id: number, data: any) =>
    api.patch(`/totems/blocks/${id}/`, data),

  deleteBlock: (id: number) =>
    api.delete(`/totems/blocks/${id}/`),

  reorderBlocks: (totemId: number, positions: { id: number; position: number }[]) =>
    Promise.all(
      positions.map((p) =>
        api.patch(`/totems/blocks/${p.id}/`, { position: p.position })
      )
    ),
};

export default api;
