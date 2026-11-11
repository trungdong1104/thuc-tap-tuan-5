import type { BaseEntity, PaginationQuery, SortQuery } from './api';

export type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product extends BaseEntity {
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  quantity: number;
  status: ProductStatus;
  description: string;
  imageUrl: string;
}

export type CreateProductRequest = Omit<
  Product,
  keyof BaseEntity | 'status' | 'categoryName'
>;

export type UpdateProductRequest = Partial<CreateProductRequest>;

export type PatchProductStockRequest = Pick<Product, 'quantity'>;

export type ProductSummary = Pick<
  Product,
  'id' | 'name' | 'categoryId' | 'categoryName' | 'price' | 'quantity' | 'status' | 'imageUrl' | 'createdAt'
>;

export type ProductSortField = keyof Pick<Product, 'name' | 'price' | 'quantity' | 'createdAt'>;

export type ProductQueryParams = Partial<Pick<Product, 'categoryId' | 'status'>> &
  PaginationQuery &
  SortQuery<ProductSortField> & {
    search?: string;
  };

export type ProductStatusConfig = Record<
  ProductStatus,
  {
    label: string;
    badgeClassName: string;
    dotClassName: string;
  }
>;

export interface ProductFormValues {
  name: string;
  categoryId: string;
  price: string;
  quantity: string;
  description: string;
  imageUrl: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  count: number;
}

export interface ProductStatsResponse {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  categoryBreakdown: CategoryBreakdownItem[];
  recentProducts: Product[];
}
