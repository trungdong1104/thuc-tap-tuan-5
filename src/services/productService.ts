import type { ApiResponse } from '@/types/api';
import type {
  CreateProductRequest,
  PatchProductStockRequest,
  Product,
  ProductQueryParams,
  ProductStatsResponse,
  UpdateProductRequest,
} from '@/types/product';
import { createCrudService } from './baseCrudService';
import { apiGet, apiPatch } from './httpClient';

const baseProductCrud = createCrudService<
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams
>('/products');

export const productService = {
  ...baseProductCrud,

  getStats(): Promise<ApiResponse<ProductStatsResponse>> {
    return apiGet<ProductStatsResponse>('/products/stats');
  },

  patchStock(id: string, payload: PatchProductStockRequest): Promise<ApiResponse<Product>> {
    return apiPatch<Product, PatchProductStockRequest>(
      `/products/${encodeURIComponent(id)}`,
      payload
    );
  },

  async getAllForExport(
    params?: Omit<ProductQueryParams, 'page' | 'limit'>
  ): Promise<Product[]> {
    const response = await baseProductCrud.getList({
      ...params,
      page: 1,
      limit: 100,
    });
    return response.data.items;
  },
};
