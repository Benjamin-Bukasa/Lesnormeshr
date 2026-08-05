import { create } from 'zustand';

const THEME_STORAGE_KEY = 'lesnormes_theme_mode';
const REQUEST_EVENT = 'lesnormes:theme:set-mode';
const CHANGED_EVENT = 'lesnormes:theme:mode-changed';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') {
      return;
    }

    set({ theme: nextTheme });
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: { mode: nextTheme } }));
    }
  },
  toggleTheme: () => {
    const current = get().theme;
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener(CHANGED_EVENT, (event) => {
    const mode = event?.detail?.mode;
    if (mode === 'light' || mode === 'dark') {
      useThemeStore.setState({ theme: mode });
    }
  });
}

export default useThemeStore;
