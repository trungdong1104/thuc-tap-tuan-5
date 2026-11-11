import type { Product } from '@/types/product';
import { formatDateVi, formatNumber, PRODUCT_STATUS_CONFIG } from './formatters';

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export function exportProductsToCsv(products: Product[], filenamePrefix = 'danh-sach-san-pham'): void {
  const headers = [
    'STT',
    'Mã sản phẩm',
    'Tên sản phẩm',
    'Danh mục',
    'Giá (VNĐ)',
    'Số lượng',
    'Trạng thái',
    'Ngày tạo',
    'Mô tả',
  ];

  const rows = products.map((product, index) => [
    index + 1,
    product.id,
    product.name,
    product.categoryName,
    formatNumber(product.price),
    product.quantity,
    PRODUCT_STATUS_CONFIG[product.status].label,
    formatDateVi(product.createdAt),
    product.description,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${filenamePrefix}-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
