export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedData<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}

export type PaginatedApiResponse<TItem> = ApiResponse<PaginatedData<TItem>>;

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export type SortOrder = 'asc' | 'desc';

export interface SortQuery<TField extends string> {
  sortBy?: TField;
  sortOrder?: SortOrder;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: Record<string, string> | null;
  timestamp?: string;
}

export interface AppApiError {
  status: number;
  code: string;
  message: string;
  details: Record<string, string> | null;
  isNetworkError: boolean;
  isTimeout: boolean;
}

export interface AsyncState<TData> {
  data: TData | null;
  isLoading: boolean;
  error: AppApiError | null;
}

export type FormErrors<TValues> = Partial<Record<keyof TValues, string>>;

export type Nullable<T> = T | null;

export interface UploadedFileResponse {
  url: string;
  relativeUrl: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}
