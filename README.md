# Quản lý sản phẩm — React + TypeScript + Axios + Nested Routing

Ứng dụng thực hành xây dựng hệ thống **Quản lý sản phẩm** hoàn chỉnh theo kiến trúc chuẩn doanh nghiệp:

- **Routing nhiều cấp (Nested Routes)** với `react-router-dom`:
  - `/` (`RootLayout`) -> `HomePage` (Trang chủ tổng quan)
  - `/products` (`ProductsLayout` + Breadcrumb động)
    - `/products` -> `ProductListPage` (Form thêm mới + Danh sách, tìm kiếm, lọc, phân trang, xuất Excel/CSV)
    - `/products/create` -> `ProductCreatePage` (Trang tạo sản phẩm mới)
    - `/products/:id` -> `ProductDetailPage` (Chi tiết sản phẩm qua URL param `:id`)
    - `/products/:id/edit` -> `ProductEditPage` (Chỉnh sửa sản phẩm qua URL param `:id`)
  - `/categories` -> `CategoriesPage` (Quản lý danh mục, tái sử dụng cùng Generic CRUD service)
  - `/login` -> `LoginPage` (Quản lý phiên đăng nhập / Bearer token & kiểm thử lỗi 401)
  - `*` -> `NotFoundPage`
- **API Service tách biệt khỏi UI** (`src/services/`) với **Axios instance + Interceptors**:
  - Request interceptor tự động gắn `Authorization: Bearer <token>` từ `tokenStorage` (key cấu hình qua `.env`) và `X-Request-Id`.
  - Response interceptor chuẩn hóa toàn bộ lỗi HTTP/mạng/timeout thành `AppApiError` và tự động xử lý `401 Unauthorized`.
- **TypeScript nâng cao (Generics & Utility Types)** (`src/types/`, `src/services/baseCrudService.ts`):
  - Generics: `ApiResponse<TData>`, `PaginatedData<TItem>`, `PaginatedApiResponse<TItem>`, `AsyncState<TData>`, `CrudService<TEntity, TCreatePayload, TUpdatePayload, TQueryParams>`, `createCrudService<...>()`.
  - Utility Types: `Omit`, `Partial`, `Pick`, `Record`, `keyof`, `FormErrors<TValues>`, `ProductStatusConfig`.
- **Biến môi trường (`.env`, `.env.development`, `.env.production`, `.env.example`)**:
  - Không hard-code URL hoặc token trong mã nguồn.
- **Xử lý đầy đủ 3 trạng thái Loading / Error / Empty** trên mọi màn hình, kèm `ErrorBoundary` chống trắng trang khi gặp sự cố.

## Khởi chạy dự án

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy cả Backend API và Frontend cùng lúc (Khuyến nghị)
```bash
npm run dev
```
- Frontend Vite: `http://localhost:5173`
- Backend REST API: `http://localhost:3001/api`

### Các lệnh khác
- `npm run dev:client`: Chỉ chạy Vite frontend
- `npm run dev:server`: Chỉ chạy Express API server
- `npm run typecheck`: Kiểm tra TypeScript (`tsc --noEmit`)
- `npm test`: Chạy unit/component tests với Vitest
- `npm run build`: Build bản production (`dist/`)
