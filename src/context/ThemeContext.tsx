import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode, CustomThemeConfig } from '../types';

export interface AccentPreset {
  id: string;
  name: string;
  color: string;
  hover: string;
  subtle: string;
  text: string;
}

export interface CanvasTonePreset {
  id: CustomThemeConfig['canvasTone'];
  name: string;
  appBg: string;
  cardBg: string;
  cardSubtleBg: string;
  inputBg: string;
  borderSubtle: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'sapphire',
    name: 'Sapphire Blue',
    color: '#2563eb',
    hover: '#1d4ed8',
    subtle: 'rgba(37, 99, 235, 0.12)',
    text: '#93c5fd',
  },
  {
    id: 'emerald',
    name: 'Sage Emerald',
    color: '#059669',
    hover: '#047857',
    subtle: 'rgba(5, 150, 105, 0.12)',
    text: '#6ee7b7',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    color: '#4f46e5',
    hover: '#4338ca',
    subtle: 'rgba(79, 70, 229, 0.12)',
    text: '#a5b4fc',
  },
  {
    id: 'amethyst',
    name: 'Amethyst Violet',
    color: '#7c3aed',
    hover: '#6d28d9',
    subtle: 'rgba(124, 58, 237, 0.12)',
    text: '#c4b5fd',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    color: '#d97706',
    hover: '#b45309',
    subtle: 'rgba(217, 119, 6, 0.12)',
    text: '#fde68a',
  },
  {
    id: 'slate',
    name: 'Monochrome Slate',
    color: '#475569',
    hover: '#334155',
    subtle: 'rgba(71, 85, 105, 0.12)',
    text: '#cbd5e1',
  },
];

export const CANVAS_TONE_PRESETS: CanvasTonePreset[] = [
  {
    id: 'light-slate',
    name: 'Nordic Snow (Light)',
    appBg: '#f8fafc',
    cardBg: '#ffffff',
    cardSubtleBg: '#f1f5f9',
    inputBg: '#ffffff',
    borderSubtle: '#e2e8f0',
    borderStrong: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
  },
  {
    id: 'warm-paper',
    name: 'Warm Cashmere (Light)',
    appBg: '#faf8f5',
    cardBg: '#ffffff',
    cardSubtleBg: '#f5f0ea',
    inputBg: '#ffffff',
    borderSubtle: '#ebe3d8',
    borderStrong: '#ded2c3',
    textPrimary: '#1c1917',
    textSecondary: '#44403c',
    textMuted: '#78716c',
  },
  {
    id: 'dark-obsidian',
    name: 'Obsidian Slate (Dark)',
    appBg: '#0b0f17',
    cardBg: '#131823',
    cardSubtleBg: '#182030',
    inputBg: '#0e131d',
    borderSubtle: '#212c40',
    borderStrong: '#303d54',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#7e8f9f',
  },
  {
    id: 'deep-navy',
    name: 'Deep Midnight (Dark)',
    appBg: '#0a0e1a',
    cardBg: '#111827',
    cardSubtleBg: '#17223b',
    inputBg: '#0b1120',
    borderSubtle: '#1e293b',
    borderStrong: '#334155',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
  },
  {
    id: 'crystal-white',
    name: 'Porcelain White (Light)',
    appBg: '#ffffff',
    cardBg: '#fcfcfd',
    cardSubtleBg: '#f4f5f7',
    inputBg: '#ffffff',
    borderSubtle: '#eaecf0',
    borderStrong: '#d0d5dd',
    textPrimary: '#101828',
    textSecondary: '#344054',
    textMuted: '#667085',
  },
];

const DEFAULT_CUSTOM_THEME: CustomThemeConfig = {
  accentColor: '#2563eb',
  accentName: 'Sapphire Blue',
  canvasTone: 'light-slate',
  radius: 'md',
  borderOpacity: 100,
};

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  customThemeConfig: CustomThemeConfig;
  setCustomThemeConfig: (config: Partial<CustomThemeConfig>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'quant_terminal_theme_mode';
const CUSTOM_THEME_STORAGE_KEY = 'quant_terminal_custom_theme_config';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default theme is 'light' as explicitly requested
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && ['light', 'dark', 'clear', 'custom'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  const [customThemeConfig, setCustomThemeConfigState] = useState<CustomThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CUSTOM_THEME, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CUSTOM_THEME;
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  const setCustomThemeConfig = (updates: Partial<CustomThemeConfig>) => {
    setCustomThemeConfigState((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Synchronize CSS classes and custom CSS variables on document element
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-clear', 'theme-custom');
    body.classList.remove('theme-light', 'theme-dark', 'theme-clear', 'theme-custom');

    // Add current theme class
    root.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);

    // If custom theme, apply custom variables
    if (theme === 'custom') {
      const tone =
        CANVAS_TONE_PRESETS.find((t) => t.id === customThemeConfig.canvasTone) ||
        CANVAS_TONE_PRESETS[0];
      const accent =
        ACCENT_PRESETS.find((a) => a.color === customThemeConfig.accentColor) || ACCENT_PRESETS[0];

      root.style.setProperty('--custom-bg-app', tone.appBg);
      root.style.setProperty('--custom-bg-card', tone.cardBg);
      root.style.setProperty('--custom-bg-card-subtle', tone.cardSubtleBg);
      root.style.setProperty('--custom-bg-input', tone.inputBg);
      root.style.setProperty('--custom-bg-header', tone.cardBg);
      root.style.setProperty('--custom-bg-sidebar', tone.cardBg);
      root.style.setProperty('--custom-border-subtle', tone.borderSubtle);
      root.style.setProperty('--custom-border-strong', tone.borderStrong);
      root.style.setProperty('--custom-text-primary', tone.textPrimary);
      root.style.setProperty('--custom-text-secondary', tone.textSecondary);
      root.style.setProperty('--custom-text-muted', tone.textMuted);

      root.style.setProperty('--custom-accent', customThemeConfig.accentColor);
      root.style.setProperty('--custom-accent-hover', accent.hover);
      root.style.setProperty('--custom-accent-subtle', accent.subtle);
      root.style.setProperty('--custom-accent-text', accent.text);
    } else {
      // Clear custom properties
      root.style.removeProperty('--custom-bg-app');
      root.style.removeProperty('--custom-bg-card');
      root.style.removeProperty('--custom-bg-card-subtle');
      root.style.removeProperty('--custom-bg-input');
      root.style.removeProperty('--custom-bg-header');
      root.style.removeProperty('--custom-bg-sidebar');
      root.style.removeProperty('--custom-border-subtle');
      root.style.removeProperty('--custom-border-strong');
      root.style.removeProperty('--custom-text-primary');
      root.style.removeProperty('--custom-text-secondary');
      root.style.removeProperty('--custom-text-muted');
      root.style.removeProperty('--custom-accent');
      root.style.removeProperty('--custom-accent-hover');
      root.style.removeProperty('--custom-accent-subtle');
      root.style.removeProperty('--custom-accent-text');
    }
  }, [theme, customThemeConfig]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        customThemeConfig,
        setCustomThemeConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
