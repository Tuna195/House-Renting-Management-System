// @vitest-environment jsdom
/** Regression cho request bất đồng bộ: không mất bản nháp khi đổi scope hoặc sửa trong lúc lưu. */
import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosHeaders, type AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { meterApi, type Reading } from '../../api/meter-readings';
import { useScopedMeterReadings } from './useScopedMeterReadings';

vi.mock('../../api/meter-readings', () => ({ meterApi: { save: vi.fn() } }));

const mockSave = vi.mocked(meterApi.save);
const reading: Reading = { roomId: 1, electricStart: 10, electricEnd: 20, waterStart: 2, waterEnd: 4 };
const response: AxiosResponse = {
  data: { saved: 1 }, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() },
};

/** Cho test tự quyết định thời điểm và thứ tự hoàn thành request, không phụ thuộc timer/mạng. */
function queueRequest() {
  let resolve!: (response: AxiosResponse) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<AxiosResponse>((accept, fail) => { resolve = accept; reject = fail; });
  mockSave.mockImplementationOnce(() => promise);
  return { resolve: () => resolve(response), reject };
}

function setup(buildingId = 1, period = '2026-10') {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const feedback = { onSaved: vi.fn(), onError: vi.fn() };
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const hook = renderHook(
    (props: { buildingId: number | undefined; period: string }) =>
      useScopedMeterReadings(props.buildingId, props.period, feedback),
    { initialProps: { buildingId, period } as { buildingId: number | undefined; period: string }, wrapper: Wrapper },
  );
  return { ...hook, feedback, invalidate };
}

beforeEach(() => mockSave.mockReset());
afterEach(cleanup);

describe('Bản nháp theo scope và version', () => {
  it('giữ dữ liệu riêng cho hai tòa và hai tháng, kể cả cùng roomId', () => {
    const { result, rerender } = setup();
    act(() => result.current.updateReading(1, 'electricEnd', 20));
    rerender({ buildingId: 2, period: '2026-10' });
    expect(result.current.drafts).toEqual({});
    act(() => result.current.updateReading(1, 'electricEnd', 30));
    rerender({ buildingId: 1, period: '2026-11' });
    act(() => result.current.updateReading(1, 'electricEnd', 40));
    rerender({ buildingId: 1, period: '2026-10' });
    expect(result.current.drafts[1].electricEnd).toBe(20);
    rerender({ buildingId: 2, period: '2026-10' });
    expect(result.current.drafts[1].electricEnd).toBe(30);
    rerender({ buildingId: 1, period: '2026-11' });
    expect(result.current.drafts[1].electricEnd).toBe(40);
  });

  it('phản hồi của A không xóa bản nháp B đang hiển thị', async () => {
    const request = queueRequest();
    const { result, rerender, feedback, invalidate } = setup();
    act(() => result.current.updateReading(1, 'electricEnd', 20));
    act(() => result.current.saveReadings([reading]));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    rerender({ buildingId: 2, period: '2026-10' });
    expect(result.current.isSaving).toBe(false);
    act(() => result.current.updateReading(2, 'waterEnd', 99));
    await act(async () => request.resolve());
    await waitFor(() => expect(feedback.onSaved).toHaveBeenCalledTimes(1));
    expect(result.current.drafts[2].waterEnd).toBe(99);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['meter-readings', 1, '2026-10'], exact: true });
    rerender({ buildingId: 1, period: '2026-10' });
    expect(result.current.drafts).toEqual({});
    expect(result.current.isSaving).toBe(false);
  });

  it('phản hồi tháng cũ không xóa bản nháp tháng mới trong cùng tòa', async () => {
    const request = queueRequest();
    const { result, rerender, feedback } = setup();
    act(() => result.current.saveReadings([reading]));
    rerender({ buildingId: 1, period: '2026-11' });
    act(() => result.current.updateReading(1, 'electricEnd', 50));
    await act(async () => request.resolve());
    await waitFor(() => expect(feedback.onSaved).toHaveBeenCalledTimes(1));
    expect(result.current.drafts[1].electricEnd).toBe(50);
  });

  it('giữ chỉnh sửa mới khi quay lại scope đang lưu và tăng version', async () => {
    const request = queueRequest();
    const { result, rerender } = setup();
    act(() => result.current.updateReading(1, 'electricEnd', 20));
    act(() => result.current.saveReadings([reading]));
    rerender({ buildingId: 2, period: '2026-10' });
    rerender({ buildingId: 1, period: '2026-10' });
    expect(result.current.isSaving).toBe(true);
    act(() => result.current.updateReading(1, 'electricEnd', 25));
    await act(async () => request.resolve());
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.drafts[1].electricEnd).toBe(25);
  });

  it('không dùng lại version sau khi lưu; request tiếp theo không xóa chỉnh sửa mới', async () => {
    const first = queueRequest();
    const second = queueRequest();
    const { result, feedback } = setup();
    act(() => result.current.updateReading(1, 'electricEnd', 20));
    act(() => result.current.saveReadings([reading]));
    await act(async () => first.resolve());
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.drafts).toEqual({});
    act(() => result.current.updateReading(1, 'electricEnd', 25));
    act(() => result.current.saveReadings([{ ...reading, electricEnd: 25 }]));
    act(() => result.current.updateReading(1, 'electricEnd', 30));
    await act(async () => second.resolve());
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.drafts[1].electricEnd).toBe(30);
    expect(feedback.onSaved.mock.calls[1][0].version).toBeGreaterThan(feedback.onSaved.mock.calls[0][0].version);
  });

  it('chặn hai lần lưu cùng tick trong cùng scope, cho phép lưu lại sau khi hoàn thành', async () => {
    const first = queueRequest();
    const second = queueRequest();
    const { result } = setup();
    act(() => { result.current.saveReadings([reading]); result.current.saveReadings([reading]); });
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    await act(async () => first.resolve());
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    act(() => result.current.saveReadings([reading]));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
    await act(async () => second.resolve());
  });

  it('hai scope lưu đồng thời và hoàn thành ngược thứ tự vẫn dọn đúng bản nháp', async () => {
    const first = queueRequest();
    const second = queueRequest();
    const { result, rerender, feedback } = setup();
    act(() => result.current.updateReading(1, 'electricEnd', 20));
    act(() => result.current.saveReadings([reading]));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    rerender({ buildingId: 2, period: '2026-10' });
    act(() => result.current.updateReading(2, 'electricEnd', 30));
    act(() => result.current.saveReadings([{ ...reading, roomId: 2 }]));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
    await act(async () => second.resolve());
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.drafts).toEqual({});
    rerender({ buildingId: 1, period: '2026-10' });
    expect(result.current.isSaving).toBe(true);
    expect(result.current.drafts[1].electricEnd).toBe(20);
    await act(async () => first.resolve());
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.drafts).toEqual({});
    expect(feedback.onSaved).toHaveBeenCalledTimes(2);
  });

  it('lỗi request giữ bản nháp cả hai scope và giải phóng khóa để thử lại', async () => {
    const first = queueRequest();
    const retry = queueRequest();
    const { result, rerender, feedback } = setup();
    act(() => result.current.updateReading(1, 'electricEnd', 20));
    act(() => result.current.saveReadings([reading]));
    rerender({ buildingId: 2, period: '2026-10' });
    act(() => result.current.updateReading(2, 'waterEnd', 9));
    await act(async () => first.reject(new Error('Mất kết nối')));
    await waitFor(() => expect(feedback.onError).toHaveBeenCalledTimes(1));
    expect(result.current.drafts[2].waterEnd).toBe(9);
    rerender({ buildingId: 1, period: '2026-10' });
    expect(result.current.drafts[1].electricEnd).toBe(20);
    expect(result.current.isSaving).toBe(false);
    act(() => result.current.saveReadings([reading]));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
    await act(async () => retry.resolve());
  });

  it('snapshot payload không bị thay đổi khi dữ liệu nguồn bị sửa sau khi gửi', async () => {
    const request = queueRequest();
    const { result } = setup();
    const payload = [{ ...reading }];
    act(() => result.current.saveReadings(payload));
    payload[0].electricEnd = 999;
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(1, '2026-10', [reading]));
    await act(async () => request.resolve());
  });


  it('giữ khóa và kiểm tra version cả trong lúc refetch sau khi lưu thành công', async () => {
    const request = queueRequest();
    const { result, invalidate } = setup();
    let finishRefetch!: () => void;
    invalidate.mockReturnValueOnce(new Promise<void>((resolve) => { finishRefetch = resolve; }));
    act(() => result.current.updateReading(1, 'electricEnd', 20));
    act(() => result.current.saveReadings([reading]));
    await act(async () => request.resolve());
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
    expect(result.current.isSaving).toBe(true);
    act(() => {
      result.current.updateReading(1, 'electricEnd', 25);
      result.current.saveReadings([reading]);
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    await act(async () => finishRefetch());
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.drafts[1].electricEnd).toBe(25);
  });

  it('không lưu hoặc ghi bản nháp khi chưa chọn tòa nhà', () => {
    const { result, rerender } = setup();
    rerender({ buildingId: undefined, period: '2026-10' });
    act(() => { result.current.updateReading(1, 'electricEnd', 20); result.current.saveReadings([reading]); });
    expect(result.current.drafts).toEqual({});
    expect(mockSave).not.toHaveBeenCalled();
  });
});
