import type {
  Category,
  CategoryQueryParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/category';
import { createCrudService } from './baseCrudService';

export const categoryService = createCrudService<
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryQueryParams
>('/categories');
