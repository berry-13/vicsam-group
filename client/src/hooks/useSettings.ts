import { useState, useEffect } from 'react';

export interface AppSettings {
  debug: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
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

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
