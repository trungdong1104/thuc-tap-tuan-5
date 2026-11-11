import { Home, LayoutList } from 'lucide-react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';

interface HeaderMeta {
  title: string;
  subtitle: string;
  breadcrumbs: Array<{ label: string; to?: string }>;
}

function resolveProductsHeaderMeta(pathname: string, id?: string): HeaderMeta {
  if (pathname === '/products/create') {
    return {
      title: 'Thêm sản phẩm mới',
      subtitle: 'Tạo mới thông tin sản phẩm và lưu vào hệ thống qua API',
      breadcrumbs: [
        { label: 'Sản phẩm', to: '/products' },
        { label: 'Thêm mới' },
      ],
    };
  }

  if (id && pathname.endsWith('/edit')) {
    return {
      title: 'Chỉnh sửa sản phẩm',
      subtitle: `Cập nhật thông tin chi tiết cho sản phẩm mã ${id}`,
      breadcrumbs: [
        { label: 'Sản phẩm', to: '/products' },
        { label: 'Chi tiết', to: `/products/${id}` },
        { label: 'Chỉnh sửa' },
      ],
    };
  }

  if (id) {
    return {
      title: 'Chi tiết sản phẩm',
      subtitle: 'Xem thông tin đầy đủ và trạng thái tồn kho của sản phẩm',
      breadcrumbs: [
        { label: 'Sản phẩm', to: '/products' },
        { label: 'Chi tiết sản phẩm' },
      ],
    };
  }

  return {
    title: 'Quản lý sản phẩm',
    subtitle: 'Thêm mới sản phẩm và quản lý danh sách sản phẩm',
    breadcrumbs: [{ label: 'Sản phẩm' }],
  };
}

export function ProductsLayout() {
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();
  const meta = resolveProductsHeaderMeta(pathname, id);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d6e4ff] bg-[#eaf1ff] text-[#1d6ce0]">
            <LayoutList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold leading-tight text-[#1e293b]">
              {meta.title}
            </h1>
            <p className="mt-0.5 text-[13px] text-[#64748b]">{meta.subtitle}</p>
          </div>
        </div>

        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px]">
          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 text-[#64748b] transition-colors hover:text-[#1d6ce0]"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>

          {meta.breadcrumbs.map((crumb, index) => (
            <span key={index} className="inline-flex items-center gap-1.5">
              <span className="text-[#94a3b8]">/</span>
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="text-[#64748b] transition-colors hover:text-[#1d6ce0]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[#1e293b]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </header>

      <Outlet />
    </div>
  );
}
