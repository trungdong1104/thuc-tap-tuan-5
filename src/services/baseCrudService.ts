import type { ApiResponse, PaginatedApiResponse } from '@/types/api';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './httpClient';

export interface CrudService<
  TEntity,
  TCreatePayload,
  TUpdatePayload = Partial<TCreatePayload>,
  TQueryParams extends object = Record<string, unknown>,
> {
  getList(params?: TQueryParams): Promise<PaginatedApiResponse<TEntity>>;
  getById(id: string): Promise<ApiResponse<TEntity>>;
  create(payload: TCreatePayload): Promise<ApiResponse<TEntity>>;
  update(id: string, payload: TUpdatePayload): Promise<ApiResponse<TEntity>>;
  patch(id: string, payload: Partial<TUpdatePayload>): Promise<ApiResponse<TEntity>>;
  remove(id: string): Promise<ApiResponse<{ id: string }>>;
}

function cleanQueryParams<TParams extends object>(params?: TParams): Record<string, unknown> {
  if (!params) return {};
  return Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function createCrudService<
  TEntity,
  TCreatePayload,
  TUpdatePayload = Partial<TCreatePayload>,
  TQueryParams extends object = Record<string, unknown>,
>(
  resourcePath: string
): CrudService<TEntity, TCreatePayload, TUpdatePayload, TQueryParams> {
  return {
    getList(params?: TQueryParams) {
      return apiGet(resourcePath, {
        params: cleanQueryParams(params),
      }) as Promise<PaginatedApiResponse<TEntity>>;
    },

    getById(id: string) {
      return apiGet<TEntity>(`${resourcePath}/${encodeURIComponent(id)}`);
    },

    create(payload: TCreatePayload) {
      return apiPost<TEntity, TCreatePayload>(resourcePath, payload);
    },

    update(id: string, payload: TUpdatePayload) {
      return apiPut<TEntity, TUpdatePayload>(
        `${resourcePath}/${encodeURIComponent(id)}`,
        payload
      );
    },

    patch(id: string, payload: Partial<TUpdatePayload>) {
      return apiPatch<TEntity, Partial<TUpdatePayload>>(
        `${resourcePath}/${encodeURIComponent(id)}`,
        payload
      );
    },

    remove(id: string) {
      return apiDelete<{ id: string }>(`${resourcePath}/${encodeURIComponent(id)}`);
    },
  };
}
