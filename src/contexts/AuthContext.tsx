import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/authService';
import { normalizeApiError, subscribeUnauthorized } from '@/services/httpClient';
import type { AppApiError } from '@/types/api';
import type { LoginRequest, UserProfile } from '@/types/auth';
import { tokenStorage } from '@/utils/tokenStorage';
import { useToast } from './ToastContext';

const LOGGED_OUT_FLAG = 'pm_manual_logout';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  tokenPreview: string | null;
  login: (payload: LoginRequest) => Promise<void>;
  initGuestSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function maskToken(token: string | null): string | null {
  if (!token) return null;
  if (token.length <= 14) return `${token.slice(0, 4)}••••`;
  return `${token.slice(0, 10)}••••${token.slice(-4)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [token, setToken] = useState<string | null>(() => tokenStorage.getAccessToken());

  const initGuestSession = useCallback(async () => {
    const response = await authService.createSession();
    tokenStorage.setAccessToken(response.data.token);
    sessionStorage.removeItem(LOGGED_OUT_FLAG);
    setToken(response.data.token);
    setUser(response.data.user);
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    tokenStorage.setAccessToken(response.data.token);
    sessionStorage.removeItem(LOGGED_OUT_FLAG);
    setToken(response.data.token);
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.hasAccessToken()) {
        await authService.logout();
      }
    } catch {
      // Ignore network errors during logout cleanup
    } finally {
      tokenStorage.clearAccessToken();
      sessionStorage.setItem(LOGGED_OUT_FLAG, '1');
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeUnauthorized((err: AppApiError) => {
      setToken(null);
      setUser(null);
      toast.warning('Phiên xác thực hết hạn', err.message);
    });
    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      const existingToken = tokenStorage.getAccessToken();
      const manuallyLoggedOut = sessionStorage.getItem(LOGGED_OUT_FLAG) === '1';

      if (existingToken) {
        try {
          const response = await authService.getCurrentSession();
          if (active) {
            setToken(existingToken);
            setUser(response.data.user);
          }
          return;
        } catch (err) {
          const normalized = normalizeApiError(err);
          if (normalized.status !== 401) {
            return;
          }
        }
      }

      if (!manuallyLoggedOut) {
        try {
          const response = await authService.createSession();
          if (active) {
            tokenStorage.setAccessToken(response.data.token);
            setToken(response.data.token);
            setUser(response.data.user);
          }
        } catch {
          // Backend might be offline; pages handle API error states gracefully
        }
      }
    }

    bootstrapAuth().finally(() => {
      if (active) {
        setIsInitializing(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && token),
      isInitializing,
      tokenPreview: maskToken(token),
      login,
      initGuestSession,
      logout,
    }),
    [user, token, isInitializing, login, initGuestSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return ctx;
}
