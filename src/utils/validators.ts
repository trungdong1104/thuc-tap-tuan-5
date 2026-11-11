import type { FormErrors } from '@/types/api';
import type { ProductFormValues } from '@/types/product';

export function validateProductForm(values: ProductFormValues): FormErrors<ProductFormValues> {
  const errors: FormErrors<ProductFormValues> = {};

  const trimmedName = values.name.trim();
  if (!trimmedName) {
    errors.name = 'Vui lòng nhập tên sản phẩm.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Tên sản phẩm phải có ít nhất 2 ký tự.';
  }

  if (!values.categoryId.trim()) {
    errors.categoryId = 'Vui lòng chọn danh mục sản phẩm.';
  }

  if (!values.price.trim()) {
    errors.price = 'Vui lòng nhập giá sản phẩm.';
  } else {
    const parsedPrice = Number(values.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = 'Giá sản phẩm phải là số không âm.';
    }
  }

  if (!values.quantity.trim()) {
    errors.quantity = 'Vui lòng nhập số lượng.';
  } else {
    const parsedQty = Number(values.quantity);
    if (Number.isNaN(parsedQty) || !Number.isInteger(parsedQty) || parsedQty < 0) {
      errors.quantity = 'Số lượng phải là số nguyên không âm.';
    }
  }

  return errors;
}

export function hasFormErrors<TValues>(errors: FormErrors<TValues>): boolean {
  return Object.values(errors).some((msg) => Boolean(msg));
}
