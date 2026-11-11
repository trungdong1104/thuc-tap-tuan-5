import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function buildPageNumbers(currentPage: number, totalPages: number): number[] {
  const maxVisible = 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, currentPage - 2);
  let end = start + maxVisible - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-4 pt-3 sm:flex-row">
      <div className="flex items-center gap-2 text-[13px] text-[#475569]">
        <span>Hiển thị</span>
        <select
          aria-label="Số bản ghi mỗi trang"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-[34px] rounded-md border border-[#dce1e8] bg-white px-2.5 text-[13px] font-medium text-[#1e293b] outline-none focus:border-[#1d6ce0] focus:ring-2 focus:ring-[#1d6ce0]/15"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <span>bản ghi mỗi trang</span>
      </div>

      <nav aria-label="Phân trang" className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Trang trước"
          title="Trang trước"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-medium transition-colors ${
              p === page
                ? 'bg-[#1d6ce0] text-white'
                : 'border border-[#e2e8f0] bg-white text-[#334155] hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Trang sau"
          title="Trang sau"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}
