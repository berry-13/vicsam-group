import { useState, useEffect } from 'react';

export interface AppSettings {
  apiBaseUrl: string;
  debug: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000'),
  debug: import.meta.env.VITE_DEBUG === 'true' || false,
};

const SETTINGS_STORAGE_KEY = 'vicsam-app-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Errore nel caricamento delle impostazioni:', error);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Errore nel salvataggio delle impostazioni:', error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  };

  const getApiUrl = (endpoint: string = '') => {
    const baseUrl = settings.apiBaseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return cleanEndpoint ? `${baseUrl}/${cleanEndpoint}` : baseUrl;
  };

  // Auto-detect GitHub Codespaces URL
  const detectCodespaceUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const hostname = window.location.hostname;
    if (hostname.includes('github.dev') || hostname.includes('githubpreview.dev')) {
      // Extract the codespace name and generate the backend URL
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const codespaceId = parts[0];
        return `https://${codespaceId}-3000.${parts.slice(1).join('.')}`;
      }
    }
    return null;
  };

  const autoConfigureForCodespaces = () => {
    const codespaceUrl = detectCodespaceUrl();
    if (codespaceUrl) {
      updateSettings({ apiBaseUrl: codespaceUrl });
      return codespaceUrl;
    }
    return null;
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    getApiUrl,
    detectCodespaceUrl,
    autoConfigureForCodespaces,
  };
};
