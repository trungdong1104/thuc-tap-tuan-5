import { useState, type FormEvent } from 'react';
import { KeyRound, Loader2, LogIn, LogOut, RefreshCw, Server, ShieldCheck, ShieldOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { env } from '@/config/env';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { normalizeApiError } from '@/services/httpClient';

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAuthenticated, tokenPreview, login, initGuestSession, logout } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login({ username, password });
      toast.success('Đăng nhập thành công', 'Token mới đã được lưu và gắn vào Axios interceptor.');
      navigate('/products');
    } catch (err) {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitSession = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await initGuestSession();
      toast.success('Đã cấp phiên làm việc', 'Bearer token đã được khởi tạo từ API server.');
    } catch (err) {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.info(
      'Đã đăng xuất',
      'Token đã bị xóa khỏi storage. Các thao tác tạo/sửa/xóa sẽ nhận lỗi 401 từ API.'
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Phiên xác thực &amp; Cấu hình API</h1>
            <p className="text-sm text-slate-500">
              Kiểm tra cấu hình môi trường (.env) và token gắn tự động qua Axios Interceptor
            </p>
          </div>
        </div>

        {/* Env & Token Status */}
        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Server className="h-3.5 w-3.5" />
              API Base URL (.env)
            </span>
            <p className="mt-1 truncate font-mono text-xs font-semibold text-slate-800">
              {env.apiBaseUrl || '(Chưa cấu hình)'}
            </p>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-500">Môi trường / Timeout</span>
            <p className="mt-1 font-mono text-xs font-semibold text-slate-800">
              {env.appEnv} • {env.apiTimeout}ms
            </p>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-500">Trạng thái Bearer Token</span>
            <div className="mt-1 flex items-center gap-1.5">
              {isAuthenticated ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Đang hoạt động ({user?.username})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                  <ShieldOff className="h-4 w-4" />
                  Chưa có token (sẽ nhận HTTP 401 khi ghi dữ liệu)
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-500">
              Token trong Storage ({env.tokenStorageKey})
            </span>
            <p className="mt-1 font-mono text-xs text-slate-700">
              {tokenPreview || 'Không có token'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleInitSession}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Cấp lại phiên từ API</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất (test lỗi 401)</span>
            </button>
          )}
        </div>
      </div>

      {/* Login form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900">Đăng nhập tài khoản</h2>
        <p className="mt-1 text-xs text-slate-500">
          Nhập tên đăng nhập bất kỳ (thử nhập mật khẩu <code className="rounded bg-slate-100 px-1">wrong</code> để kiểm thử xử lý lỗi 401 từ Axios Interceptor).
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-4 space-y-4">
          <div>
            <label htmlFor="login-username" className="mb-1.5 block text-sm font-medium text-slate-700">
              Tên đăng nhập
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: admin"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link to="/products" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              ← Quay lại Sản phẩm
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              <span>Đăng nhập</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
