// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { invoicesApi } from '../../api/invoices';
import { InvoiceStatusTag } from '../../components/InvoiceStatusTag';
import type { InvoiceDetail } from '../../types';
import { formatVND } from '../../utils/format';
import InvoiceDetailPage from './InvoiceDetailPage';
import { isInvoiceOverdue } from './invoiceDates';

vi.mock('../../api/invoices', () => ({ invoicesApi: { get: vi.fn() } }));

const moneyText = (amount: number) => formatVND(amount).replace(/\s/g, ' ');

const p101: InvoiceDetail = {
  id: 11, contractId: 71, period: '2026-10', status: 'DRAFT', totalAmount: 3940000, paidAmount: 0,
  dueDate: '2026-11-04T17:00:00.000Z', issuedAt: null, paymentCode: 'HD71202610', note: null,
  room: { id: 1, name: 'P101' }, building: { id: 2, name: 'Nhà demo' },
  primaryTenant: { id: 3, fullName: 'Nguyễn An' }, payments: [],
  items: [
    { id: 1, type: 'RENT', description: 'Tiền phòng theo ngày', quantity: 0.516129, unitPrice: 6490625, amount: 3350000 },
    { id: 2, type: 'ELECTRICITY', description: 'Điện theo bậc (130 kWh)', quantity: 1, unitPrice: 315000, amount: 315000 },
    { id: 3, type: 'WATER', description: 'Nước 5 m³', quantity: 5, unitPrice: 25000, amount: 125000 },
    { id: 4, type: 'SERVICE', description: 'Internet', quantity: 1, unitPrice: 150000, amount: 150000 },
  ],
};

beforeEach(() => {
  vi.stubGlobal('innerWidth', 375);
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query.startsWith('(max-width:'), addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  const getStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => getStyle(element));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('chi tiết P101 hiển thị bốn khoản và tổng trả từ API trong bảng gọn 375 px', async () => {
  vi.mocked(invoicesApi.get).mockResolvedValue(p101);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/invoices/11']}>
        <Routes><Route path="/invoices/:id" element={<InvoiceDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  const total = await screen.findByText(moneyText(3940000));
  expect(total.closest('tfoot')).not.toBeNull();
  expect(screen.getByText('Nguyễn An')).toBeDefined();
  expect(screen.getByText('05/11/2026')).toBeDefined();
  expect(screen.getByText('Mã thanh toán')).toBeDefined();
  expect(screen.getByText(p101.paymentCode)).toBeDefined();
  expect(screen.getByText('Nháp')).toBeDefined();
  expect(screen.queryByText('Quá hạn')).toBeNull();
  expect(screen.getAllByRole('columnheader').map(({ textContent }) => textContent)).toEqual(['Khoản', 'Thành tiền']);
  expect(screen.getByText(`5 × ${moneyText(25000)}`)).toBeDefined();
  expect(screen.queryByText(`1 × ${moneyText(315000)}`)).toBeNull();
  expect(screen.queryByText(/0,5161 ×/)).toBeNull();
  for (const item of p101.items) {
    expect(screen.getByText(item.description)).toBeDefined();
    expect(screen.getByText(moneyText(item.amount))).toBeDefined();
  }
});

it('chỉ gắn quá hạn cho hóa đơn còn công nợ và dùng ngày Việt Nam', () => {
  expect(isInvoiceOverdue(p101.dueDate, new Date('2026-11-05T16:59:59.999Z'))).toBe(false);
  expect(isInvoiceOverdue(p101.dueDate, new Date('2026-11-05T17:00:00.000Z'))).toBe(true);
  const { rerender } = render(<InvoiceStatusTag status="PARTIAL" overdue />);
  expect(screen.getByText('Quá hạn')).toBeDefined();
  rerender(<InvoiceStatusTag status="PAID" overdue />);
  expect(screen.queryByText('Quá hạn')).toBeNull();
});
