import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Layers,
  Package,
  PlusCircle,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ProductThumbnail } from '@/components/common/ProductThumbnail';
import { StatusBadge } from '@/components/common/StatusBadge';
import { normalizeApiError } from '@/services/httpClient';
import { productService } from '@/services/productService';
import type { AppApiError } from '@/types/api';
import type { ProductStatsResponse } from '@/types/product';
import { formatCurrencyVnd, formatDateVi, formatNumber } from '@/utils/formatters';

export function HomePage() {
  const [stats, setStats] = useState<ProductStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppApiError | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getStats();
      setStats(response.data);
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Hệ thống Quản lý Kho &amp; Sản phẩm
            </span>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900">
              Tổng quan sản phẩm
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi tồn kho, danh mục và điều hướng nhanh tới luồng CRUD sản phẩm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1d6ce0] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#1658bd]"
            >
              <span>Quản lý sản phẩm</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/products/create"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <PlusCircle className="h-4 w-4 text-[#1d6ce0]" />
              <span>Thêm sản phẩm</span>
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Danh mục</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span>Phiên API / Token</span>
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingState message="Đang tải thống kê hệ thống..." />
      ) : error ? (
        <ErrorState
          error={error}
          title="Không thể tải dữ liệu tổng quan"
          onRetry={fetchStats}
        />
      ) : !stats || stats.totalProducts === 0 ? (
        <EmptyState
          title="Hệ thống chưa có sản phẩm nào"
          description="Hãy thêm sản phẩm đầu tiên để bắt đầu quản lý tồn kho và theo dõi thống kê."
          action={
            <Link
              to="/products/create"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Thêm sản phẩm đầu tiên</span>
            </Link>
          }
        />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Tổng sản phẩm</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
              <p className="mt-1 text-xs text-slate-500">Đang quản lý trong hệ thống</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Còn hàng</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-emerald-700">{stats.inStockCount}</p>
              <p className="mt-1 text-xs text-slate-500">Số lượng lớn hơn 5</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Sắp hết hàng</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-amber-700">{stats.lowStockCount}</p>
              <p className="mt-1 text-xs text-slate-500">Số lượng từ 1 đến 5</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Hết hàng</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <XCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-rose-700">{stats.outOfStockCount}</p>
              <p className="mt-1 text-xs text-slate-500">Cần nhập thêm hàng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Category Breakdown & Inventory Value */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">Phân bổ danh mục</h2>
                </div>
                <Link
                  to="/categories"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-3">
                {stats.categoryBreakdown.map((item) => {
                  const percent = stats.totalProducts
                    ? Math.round((item.count / stats.totalProducts) * 100)
                    : 0;
                  return (
                    <div key={item.categoryId}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <Link
                          to={`/products?categoryId=${encodeURIComponent(item.categoryId)}`}
                          className="font-medium text-slate-700 hover:text-blue-600"
                        >
                          {item.categoryName}
                        </Link>
                        <span className="text-xs font-semibold text-slate-500">
                          {item.count} SP ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <span>Tổng giá trị tồn kho ước tính</span>
                </div>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {formatCurrencyVnd(stats.totalInventoryValue)}
                </p>
              </div>
            </section>

            {/* Recent Products */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Sản phẩm mới nhất</h2>
                  <p className="text-xs text-slate-500">
                    Nhấn vào từng sản phẩm để đi tới màn hình chi tiết (/products/:id)
                  </p>
                </div>
                <Link
                  to="/products"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Danh sách đầy đủ →
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {stats.recentProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${encodeURIComponent(product.id)}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-slate-50/80 rounded-lg px-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductThumbnail src={product.imageUrl} alt={product.name} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.categoryName} • Ngày tạo {formatDateVi(product.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-sm font-semibold tabular-nums text-slate-800 sm:inline">
                        {formatNumber(product.price)} đ
                      </span>
                      <StatusBadge status={product.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
