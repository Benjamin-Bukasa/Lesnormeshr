import { create } from 'zustand';

const STORAGE_KEY = 'auth_user';
const SESSION_STORAGE_KEY = 'auth_user_session';

function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getInitialUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const sessionRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  const sessionParsed = safeParseJSON(sessionRaw);
  if (sessionParsed && typeof sessionParsed === 'object') {
    return sessionParsed;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParseJSON(raw);
  if (parsed && typeof parsed === 'object') {
    return parsed;
  }

  return null;
}

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  setUser: (user, options = {}) => {
    set({ user: user || null });
    if (typeof window !== 'undefined') {
      if (user) {
        const storageMode = options.storage === 'session' ? 'session' : 'local';
        if (storageMode === 'session') {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  },
  clearUser: () => {
    set({ user: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  },
}));

export default useAuthStore;
