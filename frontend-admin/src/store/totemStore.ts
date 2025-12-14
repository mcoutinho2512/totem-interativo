import { create } from 'zustand';
import { api } from '../services/api';

interface TotemInfo {
  id: number;
  name: string;
  identifier: string;
  city: number;
  city_name: string;
  city_slug: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface TotemState {
  totem: TotemInfo | null;
  sessionId: string | null;
  language: string;
  isLoading: boolean;
  error: string | null;
  
  initialize: () => Promise<void>;
  setLanguage: (lang: string) => void;
  resetSession: () => void;
}

const TOTEM_IDENTIFIER = process.env.REACT_APP_TOTEM_IDENTIFIER || 'TOTEM-001';

export const useTotemStore = create<TotemState>((set, get) => ({
  totem: null,
  sessionId: null,
  language: 'pt-BR',
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Identify totem with backend
      const response = await api.post('/totems/identify/', {
        identifier: TOTEM_IDENTIFIER
      });
      
      const totem = response.data;
      
      // Create session
      const sessionResponse = await api.post('/totems/sessions/', {
        totem: totem.id,
        session_id: `session-${Date.now()}`,
        language: get().language
      });
      
      set({
        totem,
        sessionId: sessionResponse.data.id,
        isLoading: false
      });
      
      // Set city header for future requests
      api.defaults.headers.common['X-City-ID'] = totem.city;
      
    } catch (error: any) {
      set({
        error: error.message || 'Erro ao conectar com o servidor',
        isLoading: false
      });
    }
  },

  setLanguage: (lang: string) => {
    set({ language: lang });
  },

  resetSession: () => {
    const { sessionId } = get();
    if (sessionId) {
      api.post(`/totems/sessions/${sessionId}/end/`).catch(() => {});
    }
    set({ sessionId: null });
  }
}));
