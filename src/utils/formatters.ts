import type { ProductStatusConfig } from '@/types/product';

export const PRODUCT_STATUS_CONFIG: ProductStatusConfig = {
  IN_STOCK: {
    label: 'Còn hàng',
    badgeClassName: 'bg-[#dcfce7] text-[#15803d]',
    dotClassName: 'bg-[#15803d]',
  },
  LOW_STOCK: {
    label: 'Sắp hết',
    badgeClassName: 'bg-[#fef3c7] text-[#b45309]',
    dotClassName: 'bg-[#b45309]',
  },
  OUT_OF_STOCK: {
    label: 'Hết hàng',
    badgeClassName: 'bg-[#fee2e2] text-[#dc2626]',
    dotClassName: 'bg-[#dc2626]',
  },
};

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatCurrencyVnd(value: number): string {
  return `${formatNumber(value)} VNĐ`;
}

export function formatDateVi(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTimeVi(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDateVi(isoDate)} ${hours}:${minutes}`;
}
