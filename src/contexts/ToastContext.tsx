import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: typeof CheckCircle2; iconClass: string }
> = {
  success: {
    container: 'border-emerald-200 bg-white text-slate-800 shadow-lg shadow-emerald-500/10',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  error: {
    container: 'border-rose-200 bg-white text-slate-800 shadow-lg shadow-rose-500/10',
    icon: AlertCircle,
    iconClass: 'text-rose-600',
  },
  warning: {
    container: 'border-amber-200 bg-white text-slate-800 shadow-lg shadow-amber-500/10',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
  },
  info: {
    container: 'border-blue-200 bg-white text-slate-800 shadow-lg shadow-blue-500/10',
    icon: Info,
    iconClass: 'text-blue-600',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, variant, title, message }]);
      window.setTimeout(() => {
        removeToast(id);
      }, 4200);
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (title, message) => showToast('success', title, message),
      error: (title, message) => showToast('error', title, message),
      info: (title, message) => showToast('info', title, message),
      warning: (title, message) => showToast('warning', title, message),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2.5"
      >
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 transition-all ${style.container}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                {toast.message && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast phải được sử dụng bên trong ToastProvider');
  }
  return ctx;
}
