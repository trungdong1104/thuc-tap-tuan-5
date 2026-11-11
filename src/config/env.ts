export interface AppEnvConfig {
  readonly appName: string;
  readonly appEnv: string;
  readonly apiBaseUrl: string;
  readonly apiTimeout: number;
  readonly tokenStorageKey: string;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readEnvConfig(): AppEnvConfig {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

  return {
    appName: (import.meta.env.VITE_APP_NAME || 'Quản lý sản phẩm').trim(),
    appEnv: (import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development').trim(),
    apiBaseUrl,
    apiTimeout: parsePositiveInt(import.meta.env.VITE_API_TIMEOUT, 10000),
    tokenStorageKey: (import.meta.env.VITE_TOKEN_STORAGE_KEY || 'pm_access_token').trim(),
  };
}

export const env: AppEnvConfig = readEnvConfig();
