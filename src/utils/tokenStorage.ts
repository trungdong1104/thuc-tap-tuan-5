import { env } from '@/config/env';

function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    const storage = getStorage();
    if (!storage) return null;
    const token = storage.getItem(env.tokenStorageKey);
    return token && token.trim() ? token : null;
  },

  setAccessToken(token: string): void {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(env.tokenStorageKey, token.trim());
  },

  clearAccessToken(): void {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(env.tokenStorageKey);
  },

  hasAccessToken(): boolean {
    return Boolean(this.getAccessToken());
  },
};
