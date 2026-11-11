import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { ProductListPage } from '@/pages/ProductListPage';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import type { Product } from '@/types/product';

vi.mock('@/services/productService', () => ({
  productService: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getStats: vi.fn(),
    getAllForExport: vi.fn(),
  },
}));

vi.mock('@/services/categoryService', () => ({
  categoryService: {
    getList: vi.fn(),
  },
}));

const SAMPLE_PRODUCT: Product = {
  id: 'prd-001',
  name: 'iPhone 15 Pro',
  categoryId: 'cat-phone',
  categoryName: 'Điện thoại',
  price: 28990000,
  quantity: 15,
  status: 'IN_STOCK',
  description: 'Flagship smartphone',
  imageUrl: '',
  createdAt: '2024-04-10T09:00:00.000Z',
  updatedAt: '2024-04-10T09:00:00.000Z',
};

function renderWithProviders(initialEntry: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('Screen states: Loading, Error, Empty & Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryService.getList).mockResolvedValue({
      success: true,
      message: 'OK',
      timestamp: '',
      data: {
        items: [
          {
            id: 'cat-phone',
            name: 'Điện thoại',
            slug: 'dien-thoai',
            description: '',
            createdAt: '',
            updatedAt: '',
          },
        ],
        meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      },
    });
  });

  it('renders Loading state then product list data', async () => {
    let resolveList!: (value: Awaited<ReturnType<typeof productService.getList>>) => void;
    vi.mocked(productService.getList).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        })
    );

    renderWithProviders('/products');
    expect(screen.getByRole('status')).toBeInTheDocument();

    resolveList({
      success: true,
      message: 'OK',
      timestamp: '',
      data: {
        items: [SAMPLE_PRODUCT],
        meta: { page: 1, limit: 5, totalItems: 1, totalPages: 1 },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('28,990,000')).toBeInTheDocument();
      expect(screen.getAllByText('Còn hàng').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders Error state gracefully without crashing when API fails', async () => {
    vi.mocked(productService.getList).mockRejectedValue({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi máy chủ khi tải sản phẩm.',
      details: null,
      isNetworkError: false,
      isTimeout: false,
    });

    renderWithProviders('/products');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Không thể tải danh sách sản phẩm')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
    });
  });

  it('renders Empty state when API returns no products', async () => {
    vi.mocked(productService.getList).mockResolvedValue({
      success: true,
      message: 'OK',
      timestamp: '',
      data: {
        items: [],
        meta: { page: 1, limit: 5, totalItems: 0, totalPages: 1 },
      },
    });

    renderWithProviders('/products');

    await waitFor(() => {
      expect(screen.getByText('Chưa có sản phẩm nào trong hệ thống')).toBeInTheDocument();
    });
  });

  it('renders ProductDetailPage using :id URL param and handles 404 empty state', async () => {
    vi.mocked(productService.getById).mockResolvedValue({
      success: true,
      message: 'OK',
      timestamp: '',
      data: SAMPLE_PRODUCT,
    });

    renderWithProviders('/products/prd-001');

    await waitFor(() => {
      expect(productService.getById).toHaveBeenCalledWith('prd-001');
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Flagship smartphone')).toBeInTheDocument();
    });

    vi.mocked(productService.getById).mockRejectedValue({
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'Not found',
      details: null,
      isNetworkError: false,
      isTimeout: false,
    });

    renderWithProviders('/products/missing-id');

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
    });
  });
});
