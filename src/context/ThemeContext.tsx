import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  sidebar: string;
  header: string;
}

export interface BrandingConfig {
  logo: string | null;
  logoUrl: string;
  favicon: string;
  companyName: string;
  portalName: string;
  tagline: string;
  poweredByText: string;
  footerText: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  branding: BrandingConfig;
}

interface ThemeContextType {
  theme: ThemeConfig;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setColors: (colors: Partial<ThemeColors>) => void;
  setBranding: (branding: Partial<BrandingConfig>) => void;
  resetTheme: () => void;
  resetBranding: () => void;
}

const defaultColors: ThemeColors = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  accent: '#8B5CF6',
  sidebar: '#0F172A',
  header: '#1E293B',
};

const defaultBranding: BrandingConfig = {
  logo: null,
  logoUrl: '',
  favicon: '/favicon.ico',
  companyName: 'HoduCC',
  portalName: 'Tenant Portal',
  tagline: 'Operations Management',
  poweredByText: 'Powered by HoduCC',
  footerText: '© 2026 HoduCC. All rights reserved.',
};

const defaultTheme: ThemeConfig = {
  colors: defaultColors,
  branding: defaultBranding,
};

const STORAGE_KEY = 'tenant-portal-theme';
const DARK_MODE_KEY = 'tenant-portal-dark-mode';

function loadTheme(): ThemeConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        colors: { ...defaultColors, ...parsed.colors },
        branding: { ...defaultBranding, ...parsed.branding },
      };
    }
  } catch {}
  return defaultTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDarkMode: true,
  toggleDarkMode: () => {},
  setColors: () => {},
  setBranding: () => {},
  resetTheme: () => {},
  resetBranding: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(loadTheme);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--color-primary-dark', theme.colors.primaryDark);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-sidebar', theme.colors.sidebar);
    root.style.setProperty('--color-header', theme.colors.header);

    // Update document title
    document.title = `${theme.branding.portalName} | ${theme.branding.companyName}`;

    // Update favicon if changed
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon && theme.branding.favicon) {
      favicon.href = theme.branding.favicon;
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const setColors = (colors: Partial<ThemeColors>) => {
    setTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, ...colors },
    }));
  };

  const setBranding = (branding: Partial<BrandingConfig>) => {
    setTheme(prev => ({
      ...prev,
      branding: { ...prev.branding, ...branding },
    }));
  };

  const resetTheme = () => {
    setTheme(prev => ({ ...prev, colors: defaultColors }));
  };

  const resetBranding = () => {
    setTheme(prev => ({ ...prev, branding: defaultBranding }));
  };

  return (
    <ThemeContext.Provider
      value={{ theme, isDarkMode, toggleDarkMode, setColors, setBranding, resetTheme, resetBranding }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
