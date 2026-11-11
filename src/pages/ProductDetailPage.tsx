import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Package,
  Pencil,
  Tag,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ProductThumbnail } from '@/components/common/ProductThumbnail';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useToast } from '@/contexts/ToastContext';
import { normalizeApiError } from '@/services/httpClient';
import { productService } from '@/services/productService';
import type { AppApiError } from '@/types/api';
import type { Product } from '@/types/product';
import { formatCurrencyVnd, formatDateTimeVi } from '@/utils/formatters';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppApiError | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getById(id);
      setProduct(response.data);
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (normalized.status === 404) {
        setProduct(null);
        setError(null);
      } else {
        setError(normalized);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  const handleDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      await productService.remove(product.id);
      toast.success('Đã xóa sản phẩm', `Sản phẩm "${product.name}" đã được xóa khỏi hệ thống.`);
      navigate('/products', { replace: true });
    } catch (err) {
      const normalized = normalizeApiError(err);
      toast.error('Xóa sản phẩm thất bại', normalized.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách sản phẩm</span>
        </Link>
      </div>

      {isLoading ? (
        <LoadingState variant="detail" message="Đang tải thông tin chi tiết sản phẩm..." />
      ) : error ? (
        <ErrorState
          error={error}
          title="Không thể tải chi tiết sản phẩm"
          onRetry={fetchProduct}
        />
      ) : !product ? (
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description={`Sản phẩm có mã "${id ?? ''}" không tồn tại hoặc đã bị xóa khỏi hệ thống.`}
          action={
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Về danh sách sản phẩm
            </Link>
          }
        />
      ) : (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Image box */}
            <div className="md:col-span-4">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <ProductThumbnail
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full rounded-xl border-0 bg-transparent"
                />
              </div>
            </div>

            {/* Detail content */}
            <div className="flex flex-col justify-between md:col-span-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <Tag className="h-3 w-3" />
                        {product.id}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <Layers className="h-3 w-3" />
                        {product.categoryName}
                      </span>
                    </div>
                    <h2 className="mt-2.5 text-2xl font-bold text-slate-900">{product.name}</h2>
                  </div>

                  <StatusBadge status={product.status} />
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Giá bán</p>
                      <p className="mt-1 text-xl font-bold text-blue-600 tabular-nums">
                        {formatCurrencyVnd(product.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Số lượng tồn kho</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-slate-900 tabular-nums">
                        <Package className="h-4 w-4 text-slate-400" />
                        {product.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Tổng giá trị tồn</p>
                      <p className="mt-1 text-base font-semibold text-slate-800 tabular-nums">
                        {formatCurrencyVnd(product.price * product.quantity)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Mô tả sản phẩm</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Ngày tạo: <strong className="text-slate-700">{formatDateTimeVi(product.createdAt)}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Cập nhật lần cuối: <strong className="text-slate-700">{formatDateTimeVi(product.updatedAt)}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <Link
                  to={`/products/${encodeURIComponent(product.id)}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-blue-700"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Chỉnh sửa sản phẩm</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Xóa sản phẩm</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Xác nhận xóa sản phẩm"
        description={
          product
            ? `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"? Dữ liệu sẽ bị xóa khỏi hệ thống.`
            : ''
        }
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isDeleting) setIsConfirmOpen(false);
        }}
      />
    </div>
  );
}
