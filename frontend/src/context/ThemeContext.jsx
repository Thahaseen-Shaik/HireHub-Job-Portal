import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const ThemeContext = createContext(null);

export const themes = {
  DEFAULT: 'default',
  ARCTIC: 'arctic',
  EMBER: 'ember',
  FOREST: 'forest',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    
    return localStorage.getItem('app-theme') || themes.DEFAULT;
  });

  useEffect(() => {
    
    const body = document.body;
    
    // Remove all theme classes first
    Object.values(themes).forEach(t => {
      body.classList.remove(`theme-${t}`);
    });
    
    
    body.classList.add(`theme-${theme}`);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleGlobalThemeChange = (e) => {
      if (e.detail?.theme && Object.values(themes).includes(e.detail.theme)) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('hirehub-theme-change', handleGlobalThemeChange);
    return () => window.removeEventListener('hirehub-theme-change', handleGlobalThemeChange);
  }, []);

  const value = useMemo(() => ({
    theme,
    setTheme,
    themes,
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
