import type { BaseEntity, PaginationQuery } from './api';

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  productCount?: number;
}

export type CreateCategoryRequest = Pick<Category, 'name'> &
  Partial<Pick<Category, 'description'>>;

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export type CategoryQueryParams = PaginationQuery & {
  search?: string;
};
