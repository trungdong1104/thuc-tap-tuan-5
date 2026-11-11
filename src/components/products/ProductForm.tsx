import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Loader2, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import { ProductThumbnail } from '@/components/common/ProductThumbnail';
import { normalizeApiError } from '@/services/httpClient';
import { uploadService } from '@/services/uploadService';
import type { AppApiError, FormErrors } from '@/types/api';
import type { Category } from '@/types/category';
import type { CreateProductRequest, ProductFormValues } from '@/types/product';
import { hasFormErrors, validateProductForm } from '@/utils/validators';

interface ProductFormProps {
  mode: 'create' | 'edit';
  categories: Category[];
  isCategoriesLoading?: boolean;
  initialValues?: ProductFormValues;
  onSubmit: (payload: CreateProductRequest) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

const EMPTY_VALUES: ProductFormValues = {
  name: '',
  categoryId: '',
  price: '',
  quantity: '',
  description: '',
  imageUrl: '',
};

export function ProductForm({
  mode,
  categories,
  isCategoriesLoading = false,
  initialValues,
  onSubmit,
  onCancel,
  title,
  subtitle,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues ?? EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors<ProductFormValues>>({});
  const [submitError, setSubmitError] = useState<AppApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
      setErrors({});
      setSubmitError(null);
      setSelectedFileName(initialValues.imageUrl ? 'Ảnh hiện tại' : '');
    }
  }, [initialValues]);

  const handleFieldChange = (field: keyof ProductFormValues, nextValue: string) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploadError(null);
    setIsUploadingImage(true);

    try {
      const response = await uploadService.uploadImage(file);
      setValues((prev) => ({ ...prev, imageUrl: response.data.url }));
    } catch (err) {
      const normalized = normalizeApiError(err);
      setUploadError(normalized.message);
      setSelectedFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleClearImage = () => {
    setValues((prev) => ({ ...prev, imageUrl: '' }));
    setSelectedFileName('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setValues(initialValues ?? EMPTY_VALUES);
    setErrors({});
    setSubmitError(null);
    setUploadError(null);
    setSelectedFileName(initialValues?.imageUrl ? 'Ảnh hiện tại' : '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateProductForm(values);
    if (hasFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload: CreateProductRequest = {
      name: values.name.trim(),
      categoryId: values.categoryId.trim(),
      price: Number(values.price),
      quantity: Number(values.quantity),
      description: values.description.trim(),
      imageUrl: values.imageUrl.trim(),
    };

    try {
      await onSubmit(payload);
      if (mode === 'create') {
        handleReset();
      }
    } catch (err) {
      const normalized = normalizeApiError(err);
      setSubmitError(normalized);
      if (normalized.details) {
        setErrors((prev) => ({ ...prev, ...normalized.details }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedTitle =
    title ?? (mode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa thông tin sản phẩm');
  const resolvedSubtitle =
    subtitle ??
    (mode === 'create'
      ? 'Điền đầy đủ thông tin để thêm sản phẩm vào hệ thống'
      : 'Cập nhật thông tin sản phẩm và lưu thay đổi qua API');

  return (
    <section className="rounded-xl border border-[#e5e9f0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f0ff] text-[#1d6ce0]">
          {mode === 'create' ? <Plus className="h-4 w-4 stroke-[2.2]" /> : <Pencil className="h-4 w-4" />}
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#1e293b]">{resolvedTitle}</h2>
          <p className="text-[12.5px] text-[#64748b]">{resolvedSubtitle}</p>
        </div>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700"
        >
          <p className="font-medium">{submitError.message}</p>
        </div>
      )}

      <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
          {/* Tên sản phẩm */}
          <div>
            <label
              htmlFor={`product-name-${mode}`}
              className="mb-1.5 block text-[13px] font-semibold text-[#334155]"
            >
              Tên sản phẩm <span className="text-[#ef4444]">*</span>
            </label>
            <input
              id={`product-name-${mode}`}
              type="text"
              value={values.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Nhập tên sản phẩm"
              className={`h-[38px] w-full rounded-md border bg-white px-3 text-[13.5px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:ring-2 ${
                errors.name
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-[#dce1e8] focus:border-[#1d6ce0] focus:ring-[#1d6ce0]/15'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          {/* Danh mục */}
          <div>
            <label
              htmlFor={`product-category-${mode}`}
              className="mb-1.5 block text-[13px] font-semibold text-[#334155]"
            >
              Danh mục <span className="text-[#ef4444]">*</span>
            </label>
            <select
              id={`product-category-${mode}`}
              value={values.categoryId}
              disabled={isCategoriesLoading}
              onChange={(e) => handleFieldChange('categoryId', e.target.value)}
              className={`h-[38px] w-full rounded-md border bg-white px-3 text-[13.5px] outline-none transition-colors focus:ring-2 disabled:bg-slate-50 ${
                errors.categoryId
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-[#dce1e8] focus:border-[#1d6ce0] focus:ring-[#1d6ce0]/15'
              } ${!values.categoryId ? 'text-[#64748b]' : 'text-[#0f172a]'}`}
            >
              <option value="">
                {isCategoriesLoading ? 'Đang tải danh mục...' : 'Chọn danh mục'}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="text-[#0f172a]">
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-600">{errors.categoryId}</p>
            )}
          </div>

          {/* Giá (VNĐ) */}
          <div>
            <label
              htmlFor={`product-price-${mode}`}
              className="mb-1.5 block text-[13px] font-semibold text-[#334155]"
            >
              Giá (VNĐ) <span className="text-[#ef4444]">*</span>
            </label>
            <input
              id={`product-price-${mode}`}
              type="number"
              min={0}
              step={1000}
              value={values.price}
              onChange={(e) => handleFieldChange('price', e.target.value)}
              placeholder="Nhập giá sản phẩm"
              className={`h-[38px] w-full rounded-md border bg-white px-3 text-[13.5px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:ring-2 ${
                errors.price
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-[#dce1e8] focus:border-[#1d6ce0] focus:ring-[#1d6ce0]/15'
              }`}
            />
            {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-x-5 gap-y-4 md:grid-cols-3">
          {/* Số lượng */}
          <div>
            <label
              htmlFor={`product-quantity-${mode}`}
              className="mb-1.5 block text-[13px] font-semibold text-[#334155]"
            >
              Số lượng <span className="text-[#ef4444]">*</span>
            </label>
            <input
              id={`product-quantity-${mode}`}
              type="number"
              min={0}
              step={1}
              value={values.quantity}
              onChange={(e) => handleFieldChange('quantity', e.target.value)}
              placeholder="Nhập số lượng"
              className={`h-[38px] w-full rounded-md border bg-white px-3 text-[13.5px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:ring-2 ${
                errors.quantity
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-[#dce1e8] focus:border-[#1d6ce0] focus:ring-[#1d6ce0]/15'
              }`}
            />
            {errors.quantity && <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p>}
          </div>

          {/* Mô tả */}
          <div>
            <label
              htmlFor={`product-description-${mode}`}
              className="mb-1.5 block text-[13px] font-semibold text-[#334155]"
            >
              Mô tả
            </label>
            <textarea
              id={`product-description-${mode}`}
              rows={2}
              value={values.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Nhập mô tả sản phẩm (tùy chọn)"
              className="min-h-[66px] w-full resize-y rounded-md border border-[#dce1e8] bg-white px-3 py-2 text-[13.5px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:border-[#1d6ce0] focus:ring-2 focus:ring-[#1d6ce0]/15"
            />
          </div>

          {/* Hình ảnh */}
          <div>
            <label
              htmlFor={`product-image-${mode}`}
              className="mb-1.5 block text-[13px] font-semibold text-[#334155]"
            >
              Hình ảnh
            </label>
            <div className="flex h-[38px] items-center overflow-hidden rounded-md border border-[#dce1e8] bg-white">
              <label
                htmlFor={`product-image-${mode}`}
                className="flex h-full shrink-0 cursor-pointer items-center border-r border-[#dce1e8] bg-[#f1f5f9] px-3.5 text-[13px] font-medium text-[#334155] transition-colors hover:bg-[#e2e8f0]"
              >
                {isUploadingImage ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1d6ce0]" />
                    Đang tải...
                  </span>
                ) : (
                  'Chọn file'
                )}
              </label>
              <input
                ref={fileInputRef}
                id={`product-image-${mode}`}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              <span className="flex-1 truncate px-3 text-[13px] text-[#64748b]">
                {selectedFileName || 'Chưa có file nào được chọn'}
              </span>
              {values.imageUrl && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="mr-1.5 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Xóa ảnh"
                  aria-label="Xóa ảnh"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {uploadError && <p className="mt-1 text-xs text-rose-600">{uploadError}</p>}

            {values.imageUrl && mode === 'edit' && (
              <div className="mt-2 flex items-center gap-2">
                <ProductThumbnail
                  src={values.imageUrl}
                  alt={values.name || 'Xem trước hình ảnh'}
                  className="h-9 w-9 rounded-md border border-slate-200 p-0.5"
                />
                <span className="truncate text-xs text-slate-500">Ảnh hiện tại</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-md bg-[#1d6ce0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1658bd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'create' ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
            <span>{mode === 'create' ? 'Thêm sản phẩm' : 'Lưu thay đổi'}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleReset}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-[#f1f5f9] px-4 text-[13px] font-medium text-[#334155] transition-colors hover:bg-[#e2e8f0] disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>

          {onCancel && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="inline-flex h-[36px] items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-4 text-[13px] font-medium text-[#475569] transition-colors hover:bg-slate-50"
            >
              <span>Hủy</span>
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
