import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <main className="mx-auto max-w-[1160px] px-4 py-6 sm:px-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
