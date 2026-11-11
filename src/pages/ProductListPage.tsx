import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, Plus, Table2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Pagination } from '@/components/common/Pagination';
import { ProductFilterBar } from '@/components/products/ProductFilterBar';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductTable } from '@/components/products/ProductTable';
import { useToast } from '@/contexts/ToastContext';
import { useCategories } from '@/hooks/useCategories';
import { normalizeApiError } from '@/services/httpClient';
import { productService } from '@/services/productService';
import type { AppApiError, PaginationMeta } from '@/types/api';
import type { CreateProductRequest, Product, ProductStatus } from '@/types/product';
import { exportProductsToCsv } from '@/utils/exportCsv';

const DEFAULT_META: PaginationMeta = {
  page: 1,
  limit: 5,
  totalItems: 0,
  totalPages: 1,
};

export function ProductListPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '5', 10) || 5);
  const querySearch = searchParams.get('search') || '';
  const queryCategoryId = searchParams.get('categoryId') || '';
  const queryStatus = (searchParams.get('status') || '') as ProductStatus | '';

  const [searchDraft, setSearchDraft] = useState(querySearch);

  useEffect(() => {
    setSearchDraft(querySearch);
  }, [querySearch]);

  const { categories, isLoading: isCategoriesLoading } = useCategories();

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppApiError | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        return next;
      });
    },
    [setSearchParams]
  );

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getList({
        search: querySearch || undefined,
        categoryId: queryCategoryId || undefined,
        status: queryStatus || undefined,
        page,
        limit,
      });
      setProducts(response.data.items);
      setMeta(response.data.meta);
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [querySearch, queryCategoryId, queryStatus, page, limit]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (payload: CreateProductRequest) => {
    const response = await productService.create(payload);
    toast.success('Thêm sản phẩm thành công', `Đã thêm "${response.data.name}" vào hệ thống.`);
    if (page !== 1) {
      updateUrlParams({ page: 1 });
    } else {
      await fetchProducts();
    }
  };

  const handleSearchSubmit = () => {
    updateUrlParams({
      search: searchDraft.trim() || null,
      page: 1,
    });
  };

  const handleCategoryChange = (value: string) => {
    updateUrlParams({
      categoryId: value || null,
      page: 1,
    });
  };

  const handleStatusChange = (value: string) => {
    updateUrlParams({
      status: value || null,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setSearchDraft('');
    updateUrlParams({
      search: null,
      categoryId: null,
      status: null,
      page: 1,
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateUrlParams({ page: nextPage });
  };

  const handleLimitChange = (nextLimit: number) => {
    updateUrlParams({ limit: nextLimit, page: 1 });
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const allMatching = await productService.getAllForExport({
        search: querySearch || undefined,
        categoryId: queryCategoryId || undefined,
        status: queryStatus || undefined,
      });
      if (allMatching.length === 0) {
        toast.info('Không có dữ liệu', 'Danh sách hiện tại trống, không thể xuất tệp.');
        return;
      }
      exportProductsToCsv(allMatching);
      toast.success('Xuất Excel thành công', `Đã tải xuống ${allMatching.length} sản phẩm.`);
    } catch (err) {
      const normalized = normalizeApiError(err);
      toast.error('Xuất tệp thất bại', normalized.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await productService.remove(deleteTarget.id);
      toast.success('Xóa sản phẩm thành công', `Đã xóa "${deleteTarget.name}".`);
      setDeleteTarget(null);

      if (products.length === 1 && page > 1) {
        updateUrlParams({ page: page - 1 });
      } else {
        await fetchProducts();
      }
    } catch (err) {
      const normalized = normalizeApiError(err);
      toast.error('Không thể xóa sản phẩm', normalized.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(querySearch || queryCategoryId || queryStatus);

  return (
    <div className="space-y-5">
      {/* Card 1: Thêm sản phẩm mới */}
      <ProductForm
        mode="create"
        categories={categories}
        isCategoriesLoading={isCategoriesLoading}
        onSubmit={handleCreateProduct}
      />

      {/* Card 2: Danh sách sản phẩm */}
      <section className="rounded-xl border border-[#e5e9f0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f7ed] text-[#16a34a]">
              <Table2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#1e293b]">Danh sách sản phẩm</h2>
              <p className="text-[12.5px] text-[#64748b]">
                Tổng số {meta.totalItems} sản phẩm trong hệ thống
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isExporting || isLoading}
            onClick={handleExportExcel}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-[13px] font-medium text-[#334155] transition-colors hover:bg-[#f1f5f9] disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1d6ce0]" />
            ) : (
              <Download className="h-3.5 w-3.5 text-[#475569]" />
            )}
            <span>Xuất Excel</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mb-4">
          <ProductFilterBar
            search={searchDraft}
            categoryId={queryCategoryId}
            status={queryStatus}
            categories={categories}
            onSearchChange={setSearchDraft}
            onCategoryChange={handleCategoryChange}
            onStatusChange={handleStatusChange}
            onSubmitSearch={handleSearchSubmit}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Loading / Error / Empty / Data states */}
        {isLoading ? (
          <LoadingState
            variant="table"
            rows={limit}
            message="Đang tải danh sách sản phẩm từ API..."
          />
        ) : error ? (
          <ErrorState
            error={error}
            title="Không thể tải danh sách sản phẩm"
            onRetry={fetchProducts}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title={
              hasActiveFilters
                ? 'Không tìm thấy sản phẩm phù hợp'
                : 'Chưa có sản phẩm nào trong hệ thống'
            }
            description={
              hasActiveFilters
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc để xem toàn bộ sản phẩm.'
                : 'Hãy điền biểu mẫu phía trên hoặc nhấn nút bên dưới để thêm sản phẩm mới.'
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              ) : (
                <Link
                  to="/products/create"
                  className="inline-flex items-center gap-2 rounded-md bg-[#1d6ce0] px-4 py-2 text-sm font-medium text-white hover:bg-[#1658bd]"
                >
                  <Plus className="h-4 w-4" />
                  Thêm sản phẩm mới
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            <ProductTable
              products={products}
              page={meta.page}
              limit={meta.limit}
              onRequestDelete={setDeleteTarget}
            />

            <Pagination
              page={meta.page}
              limit={meta.limit}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa sản phẩm"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa sản phẩm "${deleteTarget.name}" không? Hành động này không thể hoàn tác.`
            : ''
        }
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
