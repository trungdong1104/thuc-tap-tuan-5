import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ProductForm } from '@/components/products/ProductForm';
import { useToast } from '@/contexts/ToastContext';
import { useCategories } from '@/hooks/useCategories';
import { normalizeApiError } from '@/services/httpClient';
import { productService } from '@/services/productService';
import type { AppApiError } from '@/types/api';
import type { CreateProductRequest, Product, ProductFormValues } from '@/types/product';

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppApiError | null>(null);

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

  const initialValues = useMemo<ProductFormValues | undefined>(() => {
    if (!product) return undefined;
    return {
      name: product.name,
      categoryId: product.categoryId,
      price: String(product.price),
      quantity: String(product.quantity),
      description: product.description,
      imageUrl: product.imageUrl,
    };
  }, [product]);

  const handleUpdate = async (payload: CreateProductRequest) => {
    if (!id) return;
    const response = await productService.update(id, payload);
    toast.success('Cập nhật thành công', `Đã lưu thay đổi cho "${response.data.name}".`);
    navigate(`/products/${encodeURIComponent(id)}`);
  };

  const combinedError = error ?? categoriesError;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link
          to={id ? `/products/${encodeURIComponent(id)}` : '/products'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại chi tiết</span>
        </Link>
      </div>

      {isLoading || isCategoriesLoading ? (
        <LoadingState message="Đang tải dữ liệu sản phẩm để chỉnh sửa..." />
      ) : combinedError ? (
        <ErrorState
          error={combinedError}
          title="Không thể tải thông tin chỉnh sửa"
          onRetry={() => {
            void fetchProduct();
            void refetchCategories();
          }}
        />
      ) : !product ? (
        <EmptyState
          title="Không tìm thấy sản phẩm cần chỉnh sửa"
          description={`Sản phẩm với mã "${id ?? ''}" không tồn tại hoặc đã bị xóa.`}
          action={
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Quay lại danh sách
            </Link>
          }
        />
      ) : (
        <ProductForm
          mode="edit"
          categories={categories}
          initialValues={initialValues}
          onSubmit={handleUpdate}
          onCancel={() => navigate(`/products/${encodeURIComponent(product.id)}`)}
          title={`Chỉnh sửa: ${product.name}`}
          subtitle="Cập nhật thông tin và nhấn Lưu thay đổi để ghi nhận qua API PUT"
        />
      )}
    </div>
  );
}
