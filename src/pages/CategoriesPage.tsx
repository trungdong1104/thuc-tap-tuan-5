import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Layers, Loader2, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { useToast } from '@/contexts/ToastContext';
import { categoryService } from '@/services/categoryService';
import { normalizeApiError } from '@/services/httpClient';
import type { AppApiError } from '@/types/api';
import type { Category } from '@/types/category';
import { formatDateVi } from '@/utils/formatters';

export function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppApiError | null>(null);
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async (keyword?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await categoryService.getList({
        search: keyword?.trim() || undefined,
      });
      setCategories(response.data.items);
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setNameError(null);
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description);
    setNameError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Vui lòng nhập tên danh mục.');
      return;
    }

    setIsSaving(true);
    setNameError(null);
    try {
      if (editingId) {
        const res = await categoryService.update(editingId, {
          name: name.trim(),
          description: description.trim(),
        });
        toast.success('Cập nhật danh mục thành công', `Đã lưu "${res.data.name}".`);
      } else {
        const res = await categoryService.create({
          name: name.trim(),
          description: description.trim(),
        });
        toast.success('Thêm danh mục thành công', `Đã tạo danh mục "${res.data.name}".`);
      }
      resetForm();
      await fetchCategories(search);
    } catch (err) {
      const normalized = normalizeApiError(err);
      toast.error('Không thể lưu danh mục', normalized.message);
      if (normalized.details?.name) {
        setNameError(normalized.details.name);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await categoryService.remove(deleteTarget.id);
      toast.success('Xóa danh mục thành công', `Đã xóa "${deleteTarget.name}".`);
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      await fetchCategories(search);
    } catch (err) {
      const normalized = normalizeApiError(err);
      toast.error('Không thể xóa danh mục', normalized.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quản lý danh mục</h1>
            <p className="text-sm text-slate-500">
              Tái sử dụng generic API service &amp; Axios interceptor cho danh mục sản phẩm
            </p>
          </div>
        </div>
        <Link
          to="/products"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Quay lại Quản lý sản phẩm
        </Link>
      </div>

      {/* Create / Edit Category Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label htmlFor="cat-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="Ví dụ: Màn hình"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {nameError && <p className="mt-1 text-xs text-rose-600">{nameError}</p>}
          </div>

          <div className="md:col-span-5">
            <label htmlFor="cat-desc" className="mb-1.5 block text-sm font-medium text-slate-700">
              Mô tả
            </label>
            <input
              id="cat-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn cho danh mục (tùy chọn)"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{editingId ? 'Cập nhật' : 'Thêm mới'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                title="Hủy chỉnh sửa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Category List Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-base font-semibold text-slate-900">
            Danh sách danh mục ({categories.length})
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void fetchCategories(search);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm danh mục..."
                className="rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tìm
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  void fetchCategories('');
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                title="Đặt lại"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
        </div>

        {isLoading ? (
          <LoadingState variant="table" rows={4} message="Đang tải danh sách danh mục..." />
        ) : error ? (
          <ErrorState
            error={error}
            title="Không thể tải danh mục"
            onRetry={() => fetchCategories(search)}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            title="Không có danh mục nào"
            description={
              search
                ? 'Không tìm thấy danh mục phù hợp với từ khóa.'
                : 'Chưa có danh mục nào được tạo trong hệ thống.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-3">Tên danh mục</th>
                  <th className="py-3 px-3">Mô tả</th>
                  <th className="py-3 px-3 text-center">Số sản phẩm</th>
                  <th className="py-3 px-3">Ngày tạo</th>
                  <th className="py-3 px-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-2 font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      <Link
                        to={`/products?categoryId=${encodeURIComponent(cat.id)}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {cat.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{cat.description || '—'}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {cat.productCount ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{formatDateVi(cat.createdAt)}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-white hover:bg-rose-600"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa danh mục"
        description={
          deleteTarget
            ? `Bạn muốn xóa danh mục "${deleteTarget.name}"? Lưu ý không thể xóa danh mục đang chứa sản phẩm.`
            : ''
        }
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
