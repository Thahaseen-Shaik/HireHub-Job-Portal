import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { settingsAPI } from '../api';

const defaultSettings = {
  platform_name: 'HireHub',
  logo_url: null,
  company_email: 'support@hirehub.com',
  company_phone: '+1 (555) 123-4567',
  address: '123 Business Street, Suite 100, New York, NY 10001',
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const next = response?.data?.data;
      if (next) {
        setSettings({ ...defaultSettings, ...next });
      }
    } catch (error) {
      // Defaults.
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    document.title = settings.platform_name || 'HireHub';
  }, [settings.platform_name]);

  const updateSettings = async (payload) => {
    const response = await settingsAPI.update(payload);
    const next = response?.data?.data;
    if (next) {
      setSettings({ ...defaultSettings, ...next });
    }
    return next;
  };

  const value = useMemo(() => ({
    settings,
    loading,
    refreshSettings,
    updateSettings,
  }), [settings, loading]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
