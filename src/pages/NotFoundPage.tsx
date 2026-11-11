import { FileQuestion, Home, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <FileQuestion className="h-7 w-7" />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider text-blue-600 uppercase">Lỗi 404</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-500">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Package className="h-4 w-4" />
            <span>Quản lý sản phẩm</span>
          </Link>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Home className="h-4 w-4" />
            <span>Trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
