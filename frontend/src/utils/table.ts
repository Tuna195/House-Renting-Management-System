// Hàm dùng chung cho sắp xếp và tìm kiếm ở các bảng (Table của Ant Design).

// numeric: true → "P2" đứng trước "P10" (so sánh số trong chuỗi), sensitivity 'base' → không phân biệt hoa/thường
const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

/** Dùng cho `sorter` của cột chữ: tên phòng, họ tên... Giá trị rỗng xếp đầu. */
export const compareText = (a?: string | null, b?: string | null) => collator.compare(a ?? '', b ?? '');

/** Dùng cho `sorter` của cột số: tầng, diện tích, giá... Giá trị rỗng (null) xếp đầu. */
export const compareNumber = (a?: number | null, b?: number | null) => {
  if (a == null || b == null) return (a == null ? 0 : 1) - (b == null ? 0 : 1);
  return a - b;
};

/**
 * Bỏ dấu tiếng Việt + chữ thường: "Nguyễn Đức" → "nguyen duc" (để gõ "nguyen" vẫn tìm thấy).
 * NFD tách "ễ" thành "e" + các dấu (Unicode Mark) → xóa \p{M}. Riêng "đ" không tách được nên thay tay.
 */
export const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

/** true nếu một trong các giá trị chứa từ khóa (không phân biệt dấu, hoa/thường). Từ khóa rỗng → true. */
export const matchesKeyword = (keyword: string, ...values: (string | null | undefined)[]) => {
  const k = normalizeText(keyword);
  return !k || values.some((v) => v && normalizeText(v).includes(k));
};
