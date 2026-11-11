import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCrudService } from '@/services/baseCrudService';
import { httpClient, normalizeApiError, subscribeUnauthorized } from '@/services/httpClient';
import { tokenStorage } from '@/utils/tokenStorage';

describe('httpClient & interceptors', () => {
  beforeEach(() => {
    tokenStorage.clearAccessToken();
  });

  it('attaches Bearer token from tokenStorage and X-Request-Id in request interceptor', async () => {
    const generatedToken = ['test', 'tok', Date.now()].join('_');
    tokenStorage.setAccessToken(generatedToken);

    let capturedHeaders: AxiosHeaders | null = null;
    const originalAdapter = httpClient.defaults.adapter;

    httpClient.defaults.adapter = async (config) => {
      capturedHeaders = AxiosHeaders.from(config.headers);
      return {
        data: { success: true, message: 'OK', data: { ok: true }, timestamp: '' },
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config,
      };
    };

    try {
      await httpClient.get('/health');
      expect(capturedHeaders).not.toBeNull();
      expect(capturedHeaders!.get('Authorization')).toBe(`Bearer ${generatedToken}`);
      expect(capturedHeaders!.get('X-Request-Id')).toBeTruthy();
    } finally {
      httpClient.defaults.adapter = originalAdapter;
    }
  });

  it('clears token and notifies subscribers on 401 response', async () => {
    tokenStorage.setAccessToken('expired-token-value');
    const listener = vi.fn();
    const unsubscribe = subscribeUnauthorized(listener);

    const originalAdapter = httpClient.defaults.adapter;
    httpClient.defaults.adapter = async (config) => {
      const error = Object.assign(new Error('Unauthorized'), {
        isAxiosError: true,
        config,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          headers: new AxiosHeaders(),
          config,
          data: {
            success: false,
            code: 'INVALID_TOKEN',
            message: 'Token không hợp lệ.',
          },
        },
      });
      throw error;
    };

    try {
      await expect(httpClient.post('/products', {})).rejects.toMatchObject({
        status: 401,
        code: 'INVALID_TOKEN',
      });
      expect(tokenStorage.getAccessToken()).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      unsubscribe();
      httpClient.defaults.adapter = originalAdapter;
    }
  });

  it('normalizes network and timeout errors cleanly', () => {
    const timeoutErr = normalizeApiError({
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 10000ms exceeded',
    });
    expect(timeoutErr.isTimeout).toBe(true);
    expect(timeoutErr.status).toBe(408);

    const networkErr = normalizeApiError({
      isAxiosError: true,
      message: 'Network Error',
    });
    expect(networkErr.isNetworkError).toBe(true);
    expect(networkErr.code).toBe('NETWORK_ERROR');
  });

  it('createCrudService strips empty query params on getList', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: {
        success: true,
        message: 'OK',
        timestamp: '',
        data: { items: [], meta: { page: 1, limit: 5, totalItems: 0, totalPages: 1 } },
      },
    });

    const service = createCrudService('/items');
    await service.getList({ search: '', categoryId: 'cat-1', page: 2 });

    expect(spy).toHaveBeenCalledWith('/items', {
      params: { categoryId: 'cat-1', page: 2 },
    });
    spy.mockRestore();
  });
});
