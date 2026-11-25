// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { buildingsApi } from '../../api/buildings';
import { invoicesApi } from '../../api/invoices';
import type { InvoiceSummary } from '../../types';
import InvoicesPage from './InvoicesPage';

vi.mock('../../api/buildings', () => ({ buildingsApi: { list: vi.fn() } }));
vi.mock('../../api/invoices', () => ({ invoicesApi: { list: vi.fn(), generate: vi.fn() } }));

const building = {
  id: 4, name: 'Tòa A', address: '', electricityPrice: 3500, waterPrice: 25000,
  waterBillingType: 'PER_M3' as const, invoiceDueDay: 5, description: null,
  createdAt: '2026-10-01T00:00:00Z', _count: { rooms: 3 },
};
const invoice: InvoiceSummary = {
  id: 10, contractId: 20, status: 'DRAFT', period: '2026-10', totalAmount: 3940000, paidAmount: 0,
  dueDate: '2026-11-04T17:00:00Z', building, room: { id: 101, name: 'P101' }, primaryTenant: null,
};

beforeEach(() => {
  vi.stubGlobal('innerWidth', 375);
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query.startsWith('(max-width:'), addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  const getStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => getStyle(element));
  vi.mocked(buildingsApi.list).mockResolvedValue([building]);
  vi.mocked(invoicesApi.list).mockResolvedValue([invoice]);
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetAllMocks(); });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter><App><InvoicesPage /></App></MemoryRouter>
    </QueryClientProvider>,
  );
}

async function selectOption(label: string, option: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(await screen.findByText(option, { selector: '.ant-select-item-option-content' }));
}

async function selectPeriod() {
  const input = screen.getByPlaceholderText('Chọn kỳ hóa đơn');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: '10/2026' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  fireEvent.blur(input);
  await waitFor(() => expect(invoicesApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ period: '2026-10' })));
}

it('hiển thị hóa đơn trong bảng gọn và gọi API khi thay đổi ba bộ lọc', async () => {
  renderPage();
  const link = await screen.findByRole('link', { name: /P101/ });
  expect(link.getAttribute('href')).toBe('/invoices/10');
  expect(screen.getAllByRole('columnheader').map(({ textContent }) => textContent)).toEqual(['Hóa đơn', 'Tổng tiền']);
  expect(screen.getByRole('table').style.tableLayout).toBe('fixed');
  expect(invoicesApi.list).toHaveBeenLastCalledWith({ buildingId: undefined, period: undefined, status: undefined });

  await selectOption('Tòa nhà', 'Tòa A');
  await waitFor(() => expect(invoicesApi.list).toHaveBeenLastCalledWith({ buildingId: 4, period: undefined, status: undefined }));
  await selectPeriod();
  expect(invoicesApi.list).toHaveBeenLastCalledWith({ buildingId: 4, period: '2026-10', status: undefined });
  await selectOption('Trạng thái', 'Nháp');
  await waitFor(() => expect(invoicesApi.list).toHaveBeenLastCalledWith({ buildingId: 4, period: '2026-10', status: 'DRAFT' }));
});

it('chỉ cho tạo khi đủ tòa nhà và kỳ, rồi hiển thị kết quả và lý do của từng phòng', async () => {
  vi.mocked(invoicesApi.generate).mockResolvedValue({
    created: 1,
    skipped: [{ roomId: 102, roomName: 'P102', contractId: 42, reason: 'ALREADY_EXISTS' }],
    missingReadings: [{ roomId: 103, roomName: 'P103', contractId: 43 }],
  });
  renderPage();
  const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Tạo hóa đơn kỳ này' });
  expect(button.disabled).toBe(true);
  const hint = screen.getByLabelText('Chọn tòa nhà và kỳ hóa đơn để tạo');
  fireEvent.focus(hint);
  expect(await screen.findByRole('tooltip')).toBeDefined();
  fireEvent.blur(hint);

  await selectPeriod();
  expect(button.disabled).toBe(true);
  await selectOption('Tòa nhà', 'Tòa A');
  expect(button.disabled).toBe(false);
  fireEvent.click(button);

  await waitFor(() => expect(vi.mocked(invoicesApi.generate).mock.calls[0]?.[0]).toEqual({ buildingId: 4, period: '2026-10' }));
  const report = within(await screen.findByRole('dialog'));
  expect(report.getByText(/Kết quả tạo hóa đơn/)).toBeDefined();
  expect(report.getByText(/Đã tạo:/).textContent).toBe('Đã tạo: 1 · Bỏ qua: 1 · Thiếu chỉ số: 1');
  expect(report.getByText('P102 (hợp đồng #42): Đã có hóa đơn')).toBeDefined();
  expect(report.getByText('P103 (hợp đồng #43)')).toBeDefined();
});

it('hiển thị thông báo lỗi 400 từ API tạo hóa đơn', async () => {
  const error = 'Tòa A chưa thiết lập biểu giá điện';
  vi.mocked(invoicesApi.generate).mockRejectedValue({
    isAxiosError: true, response: { status: 400, data: { message: error } },
  });
  renderPage();
  await selectOption('Tòa nhà', 'Tòa A');
  await selectPeriod();
  fireEvent.click(screen.getByRole('button', { name: 'Tạo hóa đơn kỳ này' }));

  expect(await screen.findByText(error)).toBeDefined();
  expect(screen.queryByRole('dialog')).toBeNull();
});
