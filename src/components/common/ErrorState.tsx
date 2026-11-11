import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AppApiError } from '@/types/api';

interface ErrorStateProps {
  error: AppApiError;
  title?: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export function ErrorState({
  error,
  title = 'Không thể tải dữ liệu',
  onRetry,
  actionLabel = 'Thử lại',
}: ErrorStateProps) {
  const isUnauthorized = error.status === 401;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/40 px-6 py-10 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
        {isUnauthorized ? (
          <ShieldAlert className="h-6 w-6" />
        ) : (
          <AlertCircle className="h-6 w-6" />
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-600">{error.message}</p>

      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
        <span>Mã lỗi: {error.code}</span>
        {error.status > 0 && <span>• HTTP {error.status}</span>}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            {actionLabel}
          </button>
        )}

        {isUnauthorized && (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Đăng nhập / Cấp lại phiên
          </Link>
        )}
      </div>
    </div>
  );
}
