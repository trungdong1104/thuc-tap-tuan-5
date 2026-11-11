import { ArrowLeft, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ProductForm } from '@/components/products/ProductForm';
import { useToast } from '@/contexts/ToastContext';
import { useCategories } from '@/hooks/useCategories';
import { productService } from '@/services/productService';
import type { CreateProductRequest } from '@/types/product';

export function ProductCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { categories, isLoading, error, refetch } = useCategories();

  const handleSubmit = async (payload: CreateProductRequest) => {
    const response = await productService.create(payload);
    toast.success('Tạo sản phẩm thành công', `Đã tạo "${response.data.name}".`);
    navigate(`/products/${encodeURIComponent(response.data.id)}`);
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
        <LoadingState message="Đang tải danh mục sản phẩm..." />
      ) : error ? (
        <ErrorState
          error={error}
          title="Không thể tải danh sách danh mục"
          onRetry={refetch}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Chưa có danh mục nào"
          description="Cần có ít nhất một danh mục trước khi tạo sản phẩm mới."
          icon={<Layers className="h-6 w-6" />}
          action={
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tạo danh mục ngay
            </Link>
          }
        />
      ) : (
        <ProductForm
          mode="create"
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/products')}
        />
      )}
    </div>
  );
}
