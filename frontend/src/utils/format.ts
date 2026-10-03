import dayjs from 'dayjs';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/** 3500000 → "3.500.000 ₫" */
export const formatVND = (amount: number) => vnd.format(amount);

/** "2026-10-03T..." → "03/10/2026" */
export const formatDate = (value: string | Date) => dayjs(value).format('DD/MM/YYYY');

/** "2026-10" → "Tháng 10/2026" */
export const formatPeriod = (period: string) => {
  const [year, month] = period.split('-');
  return `Tháng ${Number(month)}/${year}`;
};
