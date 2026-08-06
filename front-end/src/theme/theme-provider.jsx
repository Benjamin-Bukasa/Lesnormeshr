/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const MODE_STORAGE_KEY = 'lesnormes_theme_mode';
const PALETTE_STORAGE_KEY = 'lesnormes_theme_palette';
const THEME_MODE_REQUEST_EVENT = 'lesnormes:theme:set-mode';
const THEME_MODE_CHANGED_EVENT = 'lesnormes:theme:mode-changed';

const LIGHT_SURFACE_TOKENS = {
  bg: '210 40% 98%',
  surface: '0 0% 100%',
  text: '222 47% 11%',
  muted: '215 16% 47%',
  border: '214 32% 91%',
  ring: '220 75% 60%',
  onPrimary: '0 0% 100%',
};

const DARK_SURFACE_PRESETS = {
  slate: {
    bg: '222 47% 8%',
    surface: '222 35% 12%',
    text: '210 40% 96%',
    muted: '215 20% 70%',
    border: '217 19% 28%',
    ring: '210 90% 65%',
    onPrimary: '0 0% 100%',
  },
  stone: {
    bg: '24 10% 9%',
    surface: '24 9% 13%',
    text: '30 20% 95%',
    muted: '24 8% 70%',
    border: '24 7% 29%',
    ring: '24 90% 64%',
    onPrimary: '0 0% 100%',
  },
  neutral: {
    bg: '0 0% 9%',
    surface: '0 0% 13%',
    text: '0 0% 95%',
    muted: '0 0% 70%',
    border: '0 0% 29%',
    ring: '0 0% 66%',
    onPrimary: '0 0% 100%',
  },
};

const DARK_PRESET_BY_PALETTE = {
  blue: 'slate',
  orange: 'stone',
  red: 'stone',
  violet: 'neutral',
  green: 'neutral',
};

const SIDEBAR_TOKENS_BY_PALETTE = {
  orange: {
    bg: '24 22% 12%',
    border: '24 16% 24%',
    hover: '24 18% 20%',
  },
  violet: {
    bg: '258 24% 12%',
    border: '258 18% 25%',
    hover: '258 18% 21%',
  },
  blue: {
    bg: '220 28% 12%',
    border: '218 20% 24%',
    hover: '218 19% 20%',
  },
  red: {
    bg: '356 22% 12%',
    border: '356 16% 25%',
    hover: '356 18% 21%',
  },
  green: {
    bg: '154 24% 11%',
    border: '154 18% 24%',
    hover: '154 18% 19%',
  },
};

const COLOR_THEMES = {
  orange: {
    label: 'Orange',
    light: {
      primary: '25 95% 53%',
      secondary: '31 97% 89%',
      accent: '15 86% 56%',
    },
    dark: {
      primary: '25 95% 62%',
      secondary: '24 32% 24%',
      accent: '15 88% 64%',
    },
  },
  violet: {
    label: 'Violet',
    light: {
      primary: '262 83% 58%',
      secondary: '262 90% 94%',
      accent: '286 85% 60%',
    },
    dark: {
      primary: '263 88% 66%',
      secondary: '263 31% 24%',
      accent: '286 86% 70%',
    },
  },
  blue: {
    label: 'Bleu',
    light: {
      primary: '221 83% 53%',
      secondary: '214 95% 93%',
      accent: '199 89% 48%',
    },
    dark: {
      primary: '221 88% 63%',
      secondary: '220 34% 23%',
      accent: '199 90% 58%',
    },
  },
  red: {
    label: 'Rouge',
    light: {
      primary: '0 84% 60%',
      secondary: '0 86% 94%',
      accent: '14 90% 58%',
    },
    dark: {
      primary: '0 88% 67%',
      secondary: '0 34% 23%',
      accent: '14 92% 66%',
    },
  },
  green: {
    label: 'Vert',
    light: {
      primary: '142 72% 42%',
      secondary: '138 76% 92%',
      accent: '160 84% 39%',
    },
    dark: {
      primary: '142 74% 50%',
      secondary: '142 30% 22%',
      accent: '160 86% 48%',
    },
  },
};

const ThemeContext = createContext(null);

function isValidMode(value) {
  return value === 'light' || value === 'dark';
}

function isValidPalette(value) {
  return Boolean(COLOR_THEMES[value]);
}

function getInitialMode() {
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (isValidMode(stored)) {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialPalette() {
  const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
  if (isValidPalette(stored)) {
    return stored;
  }
  return 'orange';
}

function getSurfaceTokens(mode, palette) {
  if (mode === 'light') {
    return LIGHT_SURFACE_TOKENS;
  }

  const darkPreset = DARK_PRESET_BY_PALETTE[palette] || 'slate';
  return DARK_SURFACE_PRESETS[darkPreset];
}

function getSidebarTokens(palette) {
  return SIDEBAR_TOKENS_BY_PALETTE[palette] || SIDEBAR_TOKENS_BY_PALETTE.orange;
}

function applyThemeToDocument(mode, palette) {
  const root = document.documentElement;
  const surfaceTokens = getSurfaceTokens(mode, palette);
  const colorTokens = COLOR_THEMES[palette][mode];
  const sidebarTokens = getSidebarTokens(palette);

  root.classList.toggle('dark', mode === 'dark');
  root.setAttribute('data-theme-color', palette);
  root.style.setProperty('--color-bg', surfaceTokens.bg);
  root.style.setProperty('--color-surface', surfaceTokens.surface);
  root.style.setProperty('--color-text', surfaceTokens.text);
  root.style.setProperty('--color-muted', surfaceTokens.muted);
  root.style.setProperty('--color-border', surfaceTokens.border);
  root.style.setProperty('--color-ring', surfaceTokens.ring);
  root.style.setProperty('--color-on-primary', surfaceTokens.onPrimary);
  root.style.setProperty('--color-primary', colorTokens.primary);
  root.style.setProperty('--color-secondary', colorTokens.secondary);
  root.style.setProperty('--color-accent', colorTokens.accent);
  root.style.setProperty('--color-sidebar-bg', colorTokens.primary);
  root.style.setProperty('--color-sidebar-border', '0 0% 100%');
  root.style.setProperty('--color-sidebar-hover', '0 0% 100%');
  root.style.setProperty('--color-sidebar-text', '0 0% 100%');
  root.style.setProperty('--color-sidebar-muted', '0 0% 100%');
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getInitialMode);
  const [palette, setPaletteState] = useState(getInitialPalette);

  useEffect(() => {
    applyThemeToDocument(mode, palette);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    window.dispatchEvent(new CustomEvent(THEME_MODE_CHANGED_EVENT, { detail: { mode } }));
  }, [mode, palette]);

  useEffect(() => {
    const handleModeRequest = (event) => {
      const nextMode = event?.detail?.mode;
      if (isValidMode(nextMode)) {
        setModeState(nextMode);
      }
    };

    window.addEventListener(THEME_MODE_REQUEST_EVENT, handleModeRequest);
    return () => {
      window.removeEventListener(THEME_MODE_REQUEST_EVENT, handleModeRequest);
    };
  }, []);

  const api = useMemo(() => ({
    mode,
    palette,
    palettes: COLOR_THEMES,
    setMode: (nextMode) => {
      if (isValidMode(nextMode)) {
        setModeState(nextMode);
      }
    },
    toggleMode: () => {
      setModeState((previousMode) => (previousMode === 'dark' ? 'light' : 'dark'));
    },
    setPalette: (nextPalette) => {
      if (isValidPalette(nextPalette)) {
        setPaletteState(nextPalette);
      }
    },
  }), [mode, palette]);

  return (
    <ThemeContext.Provider value={api}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}

export default ThemeProvider;
