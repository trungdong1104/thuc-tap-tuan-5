import type { ProductStatus } from '@/types/product';
import { PRODUCT_STATUS_CONFIG } from '@/utils/formatters';

interface StatusBadgeProps {
  status: ProductStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = PRODUCT_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${config.badgeClassName}`}
    >
      {config.label}
    </span>
  );
}
