// @vitest-environment jsdom
/** Kiểm tra luồng nhập thực tế trên trang khi request của bộ lọc cũ hoàn thành muộn. */
import { App } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosHeaders, type AxiosResponse } from 'axios';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { buildingsApi } from '../../api/buildings';
import { meterApi } from '../../api/meter-readings';
import MeterReadingsPage from './MeterReadingsPage';

vi.mock('../../api/buildings', () => ({ buildingsApi: { list: vi.fn() } }));
vi.mock('../../api/meter-readings', () => ({ meterApi: { list: vi.fn(), save: vi.fn() } }));

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  // jsdom chưa hỗ trợ pseudo-element; bảng chỉ cần computed style của phần tử.
  const getStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => getStyle(element));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

async function selectBuilding(name: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tòa nhà' }));
  fireEvent.click(await screen.findByText(name, { selector: '.ant-select-item-option-content' }));
}

it('giữ bản nháp ở B và chỉnh sửa mới ở A khi request lưu A hoàn thành', async () => {
  vi.mocked(buildingsApi.list).mockResolvedValue([
    { id: 1, name: 'Tòa A', address: '', electricityPrice: 1, waterPrice: 1, waterBillingType: 'PER_M3', invoiceDueDay: 5, description: null, createdAt: '2026-10-01T00:00:00Z', _count: { rooms: 1 } },
    { id: 2, name: 'Tòa B', address: '', electricityPrice: 1, waterPrice: 1, waterBillingType: 'PER_M3', invoiceDueDay: 5, description: null, createdAt: '2026-10-01T00:00:00Z', _count: { rooms: 1 } },
  ]);
  vi.mocked(meterApi.list).mockImplementation(async (buildingId) => [{
    room: { id: buildingId, name: `P${buildingId}` }, locked: false, previous: null,
    current: { roomId: buildingId, electricStart: 10, electricEnd: 20, waterStart: 2, waterEnd: 4 },
  }]);
  let resolveSave!: (value: AxiosResponse) => void;
  vi.mocked(meterApi.save).mockImplementation(() => new Promise((resolve) => { resolveSave = resolve; }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><App><MeterReadingsPage /></App></QueryClientProvider>);

  await selectBuilding('Tòa A');
  const inputA = await screen.findByRole('spinbutton', { name: 'P1 electricEnd' });
  fireEvent.change(inputA, { target: { value: '21' } });
  const saveButton = screen.getByRole('button', { name: 'Lưu tất cả' });
  await waitFor(() => expect(saveButton.hasAttribute('disabled')).toBe(false));
  fireEvent.click(saveButton);
  await waitFor(() => expect(meterApi.save).toHaveBeenCalledTimes(1));
  expect(saveButton.hasAttribute('disabled')).toBe(true);
  // Vẫn được sửa tiếp, nhưng không được gửi thêm request cùng scope khi đang lưu.
  fireEvent.change(inputA, { target: { value: '22' } });

  await selectBuilding('Tòa B');
  const inputB = await screen.findByRole('spinbutton', { name: 'P2 electricEnd' });
  fireEvent.change(inputB, { target: { value: '99' } });
  await waitFor(() => expect(saveButton.hasAttribute('disabled')).toBe(false));
  await act(async () => resolveSave({
    data: { saved: 1 }, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() },
  }));
  await screen.findByText(/Đã lưu chỉ số tòa nhà #1/);
  expect(inputB.getAttribute('value')).toBe('99');

  await selectBuilding('Tòa A');
  await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'P1 electricEnd' }).getAttribute('value')).toBe('22'));
  expect(meterApi.save).toHaveBeenCalledTimes(1);
  client.clear();
});
