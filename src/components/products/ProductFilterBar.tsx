import { type FormEvent } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import type { Category } from '@/types/category';
import type { ProductStatus } from '@/types/product';

interface ProductFilterBarProps {
  search: string;
  categoryId: string;
  status: string;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSubmitSearch: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: 'IN_STOCK', label: 'Còn hàng' },
  { value: 'LOW_STOCK', label: 'Sắp hết' },
  { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
];

export function ProductFilterBar({
  search,
  categoryId,
  status,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onSubmitSearch,
  onResetFilters,
  hasActiveFilters,
}: ProductFilterBarProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmitSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-stretch gap-3 md:flex-row md:items-center"
    >
      <div className="flex h-[38px] flex-1 items-center overflow-hidden rounded-md border border-[#dce1e8] bg-white transition-colors focus-within:border-[#1d6ce0] focus-within:ring-2 focus-within:ring-[#1d6ce0]/15">
        <span className="flex h-full items-center justify-center border-r border-[#dce1e8] bg-[#f8fafc] px-3 text-[#64748b]">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên sản phẩm..."
          aria-label="Tìm kiếm theo tên sản phẩm"
          className="h-full w-full px-3 text-[13.5px] text-[#0f172a] placeholder-[#94a3b8] outline-none"
        />
      </div>

      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        aria-label="Lọc theo danh mục"
        className="h-[38px] rounded-md border border-[#dce1e8] bg-white px-3 text-[13.5px] text-[#334155] outline-none transition-colors focus:border-[#1d6ce0] focus:ring-2 focus:ring-[#1d6ce0]/15 md:w-[220px]"
      >
        <option value="">Tất cả danh mục</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Lọc theo trạng thái"
        className="h-[38px] rounded-md border border-[#dce1e8] bg-white px-3 text-[13.5px] text-[#334155] outline-none transition-colors focus:border-[#1d6ce0] focus:ring-2 focus:ring-[#1d6ce0]/15 md:w-[220px]"
      >
        <option value="">Tất cả trạng thái</option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="submit"
          className="inline-flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-md bg-[#1d6ce0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1658bd] md:flex-none"
        >
          <Search className="h-4 w-4" />
          <span>Tìm kiếm</span>
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            title="Xóa bộ lọc"
            aria-label="Xóa bộ lọc"
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-[#dce1e8] bg-white text-[#475569] transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
