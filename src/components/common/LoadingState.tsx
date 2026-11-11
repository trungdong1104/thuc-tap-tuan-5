import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'table' | 'detail';
  rows?: number;
}

export function LoadingState({
  message = 'Đang tải dữ liệu...',
  variant = 'spinner',
  rows = 5,
}: LoadingStateProps) {
  if (variant === 'table') {
    return (
      <div className="space-y-3 py-4" role="status" aria-label={message}>
        <div className="flex items-center justify-center gap-2 pb-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span>{message}</span>
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3"
          >
            <div className="h-4 w-6 rounded bg-slate-200" />
            <div className="h-10 w-10 rounded-lg bg-slate-200" />
            <div className="h-4 flex-1 rounded bg-slate-200" />
            <div className="hidden h-4 w-24 rounded bg-slate-200 sm:block" />
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
            <div className="h-8 w-20 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div
        className="animate-pulse rounded-xl border border-slate-200 bg-white p-6"
        role="status"
        aria-label={message}
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div className="aspect-square rounded-xl bg-slate-200" />
          <div className="space-y-4 md:col-span-2">
            <div className="h-7 w-2/3 rounded bg-slate-200" />
            <div className="h-5 w-1/3 rounded bg-slate-200" />
            <div className="h-24 w-full rounded bg-slate-200" />
            <div className="flex gap-3 pt-2">
              <div className="h-10 w-32 rounded-lg bg-slate-200" />
              <div className="h-10 w-32 rounded-lg bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-12 text-center"
      role="status"
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-3 text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
