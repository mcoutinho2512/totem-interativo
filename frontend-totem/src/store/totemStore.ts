import { create } from 'zustand';
import api from '../services/api';

interface TotemInfo {
  id: number;
  identifier: string;
  city: number;
  city_name: string;
  latitude: string;
  longitude: string;
  address: string;
  // Branding/Theme
  theme: string;
  logo: string | null;
  background_image: string | null;
  background_color: string;
}

interface TotemState {
  totem: TotemInfo | null;
  sessionId: number | null;
  language: string;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  setLanguage: (lang: string) => void;
  startSession: () => Promise<void>;
  resetSession: () => void;
}

export const useTotemStore = create<TotemState>((set, get) => ({
  totem: null,
  sessionId: null,
  language: 'pt-BR',
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const identifier = process.env.REACT_APP_TOTEM_IDENTIFIER || 'TOTEM-001';
      const response = await api.post('/totems/identify/', { identifier });
      
      if (response.data) {
        set({ totem: response.data, isLoading: false });
        localStorage.setItem('totem_id', response.data.id);
        localStorage.setItem('city_id', response.data.city);
        
        // Start session
        get().startSession();
      }
    } catch (error: any) {
      console.error('Failed to initialize totem:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to connect',
        isLoading: false 
      });
    }
  },

  setLanguage: (lang: string) => {
    set({ language: lang });
    localStorage.setItem('language', lang);
  },

  startSession: async () => {
    const { totem, language } = get();
    if (!totem) return;

    try {
      const response = await api.post('/totems/sessions/', {
        totem: totem.id,
        language,
      });
      set({ sessionId: response.data.id });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  },

  resetSession: () => {
    const { sessionId } = get();
    if (sessionId) {
      api.patch(`/totems/sessions/${sessionId}/`, {
        ended_at: new Date().toISOString(),
      }).catch(() => {});
    }
    set({ sessionId: null, language: 'pt-BR' });
    localStorage.setItem('language', 'pt-BR');
  },
}));
