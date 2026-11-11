import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { ApiErrorResponse, ApiResponse, AppApiError } from '@/types/api';
import { tokenStorage } from '@/utils/tokenStorage';

type UnauthorizedListener = (error: AppApiError) => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function subscribeUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  400: 'Dữ liệu gửi lên không hợp lệ.',
  401: 'Phiên làm việc đã hết hạn hoặc chưa được xác thực.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  409: 'Dữ liệu bị xung đột hoặc đã tồn tại.',
  422: 'Dữ liệu không thỏa mãn điều kiện kiểm tra.',
  500: 'Máy chủ gặp sự cố nội bộ. Vui lòng thử lại sau.',
  502: 'Không nhận được phản hồi hợp lệ từ máy chủ.',
  503: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.',
};

export function normalizeApiError(error: unknown): AppApiError {
  if (isAppApiError(error)) {
    return error;
  }

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    const isTimeout =
      axiosErr.code === 'ECONNABORTED' ||
      axiosErr.message.toLowerCase().includes('timeout');
    const isNetworkError = !axiosErr.response && !isTimeout;

    if (isTimeout) {
      return {
        status: 408,
        code: 'REQUEST_TIMEOUT',
        message: 'Yêu cầu tới máy chủ quá thời gian chờ. Vui lòng thử lại.',
        details: null,
        isNetworkError: false,
        isTimeout: true,
      };
    }

    if (isNetworkError) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message:
          'Không thể kết nối đến máy chủ API. Vui lòng kiểm tra kết nối mạng hoặc khởi động backend.',
        details: null,
        isNetworkError: true,
        isTimeout: false,
      };
    }

    const status = axiosErr.response?.status ?? 500;
    const payload = axiosErr.response?.data;
    const fallbackMessage =
      DEFAULT_STATUS_MESSAGES[status] ?? 'Đã xảy ra lỗi không xác định khi gọi API.';

    return {
      status,
      code: payload?.code || `HTTP_${status}`,
      message: payload?.message || fallbackMessage,
      details: payload?.details ?? null,
      isNetworkError: false,
      isTimeout: false,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      code: 'CLIENT_ERROR',
      message: error.message || 'Đã xảy ra lỗi phía ứng dụng.',
      details: null,
      isNetworkError: false,
      isTimeout: false,
    };
  }

  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: 'Đã xảy ra lỗi không xác định.',
    details: null,
    isNetworkError: false,
    isTimeout: false,
  };
}

export function isAppApiError(value: unknown): value is AppApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'status' in value &&
    'isNetworkError' in value
  );
}

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use(
  (config) => {
    if (!config.baseURL && !env.apiBaseUrl) {
      const envError: AppApiError = {
        status: 0,
        code: 'ENV_NOT_CONFIGURED',
        message: 'Chưa cấu hình biến môi trường VITE_API_BASE_URL.',
        details: null,
        isNetworkError: false,
        isTimeout: false,
      };
      return Promise.reject(envError);
    }

    const headers = AxiosHeaders.from(config.headers);
    const token = tokenStorage.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('X-Request-Id', generateRequestId());
    headers.set('Accept-Language', 'vi');
    config.headers = headers;

    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);

    if (normalized.status === 401) {
      tokenStorage.clearAccessToken();
      unauthorizedListeners.forEach((listener) => listener(normalized));
    }

    return Promise.reject(normalized);
  }
);

export async function apiGet<TData>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<TData>> {
  const response = await httpClient.get<ApiResponse<TData>>(url, config);
  return response.data;
}

export async function apiPost<TData, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: AxiosRequestConfig
): Promise<ApiResponse<TData>> {
  const response = await httpClient.post<ApiResponse<TData>>(url, payload, config);
  return response.data;
}

export async function apiPut<TData, TPayload = unknown>(
  url: string,
  payload: TPayload,
  config?: AxiosRequestConfig
): Promise<ApiResponse<TData>> {
  const response = await httpClient.put<ApiResponse<TData>>(url, payload, config);
  return response.data;
}

export async function apiPatch<TData, TPayload = unknown>(
  url: string,
  payload: TPayload,
  config?: AxiosRequestConfig
): Promise<ApiResponse<TData>> {
  const response = await httpClient.patch<ApiResponse<TData>>(url, payload, config);
  return response.data;
}

export async function apiDelete<TData = { id: string }>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<TData>> {
  const response = await httpClient.delete<ApiResponse<TData>>(url, config);
  return response.data;
}
