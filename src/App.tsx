import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ProductsLayout } from '@/components/layout/ProductsLayout';
import { RootLayout } from '@/components/layout/RootLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProductCreatePage } from '@/pages/ProductCreatePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { ProductEditPage } from '@/pages/ProductEditPage';
import { ProductListPage } from '@/pages/ProductListPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="home" element={<HomePage />} />

        <Route path="products" element={<ProductsLayout />}>
          <Route index element={<ProductListPage />} />
          <Route path="create" element={<ProductCreatePage />} />
          <Route path=":id" element={<Outlet />}>
            <Route index element={<ProductDetailPage />} />
            <Route path="edit" element={<ProductEditPage />} />
          </Route>
        </Route>

        <Route path="categories" element={<CategoriesPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
