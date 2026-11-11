import { SquarePen, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductThumbnail } from '@/components/common/ProductThumbnail';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Product } from '@/types/product';
import { formatDateVi, formatNumber } from '@/utils/formatters';

interface ProductTableProps {
  products: Product[];
  page: number;
  limit: number;
  onRequestDelete: (product: Product) => void;
}

export function ProductTable({
  products,
  page,
  limit,
  onRequestDelete,
}: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-[#e2e8f0] text-[13px] font-semibold text-[#334155]">
            <th className="w-12 py-3 pl-2 pr-3">#</th>
            <th className="w-24 py-3 px-3">Hình ảnh</th>
            <th className="py-3 px-3">Tên sản phẩm</th>
            <th className="py-3 px-3">Danh mục</th>
            <th className="py-3 px-3">Giá (VNĐ)</th>
            <th className="py-3 px-3">Số lượng</th>
            <th className="py-3 px-3">Trạng thái</th>
            <th className="py-3 px-3">Ngày tạo</th>
            <th className="py-3 pl-3 pr-2 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {products.map((product, idx) => {
            const stt = (page - 1) * limit + idx + 1;
            return (
              <tr
                key={product.id}
                className="transition-colors hover:bg-slate-50/70"
              >
                <td className="py-3.5 pl-2 pr-3 text-[#475569]">{stt}</td>
                <td className="py-3.5 px-3">
                  <Link
                    to={`/products/${encodeURIComponent(product.id)}`}
                    className="inline-block"
                    title={`Xem chi tiết ${product.name}`}
                  >
                    <ProductThumbnail
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-9 w-9"
                    />
                  </Link>
                </td>
                <td className="py-3.5 px-3">
                  <Link
                    to={`/products/${encodeURIComponent(product.id)}`}
                    className="font-medium text-[#1e293b] transition-colors hover:text-[#1d6ce0] hover:underline"
                  >
                    {product.name}
                  </Link>
                </td>
                <td className="py-3.5 px-3 text-[#475569]">{product.categoryName}</td>
                <td className="py-3.5 px-3 font-medium tabular-nums text-[#334155]">
                  {formatNumber(product.price)}
                </td>
                <td className="py-3.5 px-3 tabular-nums text-[#475569]">
                  {product.quantity}
                </td>
                <td className="py-3.5 px-3">
                  <StatusBadge status={product.status} />
                </td>
                <td className="py-3.5 px-3 tabular-nums text-[#475569]">
                  {formatDateVi(product.createdAt)}
                </td>
                <td className="py-3.5 pl-3 pr-2">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/products/${encodeURIComponent(product.id)}/edit`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#1d6ce0] text-white transition-colors hover:bg-[#1658bd]"
                      title="Chỉnh sửa"
                      aria-label={`Chỉnh sửa ${product.name}`}
                    >
                      <SquarePen className="h-4 w-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => onRequestDelete(product)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#ef4444] text-white transition-colors hover:bg-[#dc2626]"
                      title="Xóa"
                      aria-label={`Xóa ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
