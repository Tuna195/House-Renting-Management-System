// @vitest-environment jsdom
/** Hành vi ô nhập thật, nội dung lỗi và bàn phím; không mock component Ant Design. */
import { useState } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { ReadingInputCell } from './MeterReadingCells';
import { isReadingValid, type EditableMeterRow } from './meterReadings.utils';

afterEach(cleanup);
function Grid() {
  const [rows, setRows] = useState<EditableMeterRow[]>([1, 2, 3].map((id) => ({
    room: { id, name: `P${id}` }, current: null, previous: null, locked: id === 2,
    values: { electricStart: 10, electricEnd: 20, waterStart: 1, waterEnd: 2 },
  })));
  return <><table><tbody>{rows.map((row) => <tr key={row.room.id}>
    {(['electricStart', 'electricEnd'] as const).map((field) => <td key={field}>
      <ReadingInputCell row={row} field={field} onChange={(id, key, value) => setRows((previous) =>
        previous.map((item) => item.room.id === id ? { ...item, values: { ...item.values, [key]: value ?? undefined } } : item))} />
    </td>)}
  </tr>)}</tbody></table><button disabled={!rows.filter((row) => !row.locked).every(isReadingValid)}>Lưu</button></>;
}

it('lỗi liên kết input, giữ nguyên số thập phân qua blur và chặn lưu; sửa đúng thì bỏ lỗi', async () => {
  const user = userEvent.setup(); render(<Grid />);
  const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'P1 Điện mới' });
  await user.clear(input); await user.type(input, '1.5'); await user.tab();
  expect(input.value).toBe('1.5');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  const errorId = input.getAttribute('aria-describedby');
  expect(document.getElementById(errorId ?? '')?.textContent).toContain('Chỉ nhập chữ số');
  expect(screen.getByRole('button', { name: 'Lưu' }).hasAttribute('disabled')).toBe(true);
  await user.clear(input); await user.type(input, '25');
  expect(input.getAttribute('aria-invalid')).toBe('false');
  expect(input.hasAttribute('aria-describedby')).toBe(false);
  expect(screen.getByRole('button', { name: 'Lưu' }).hasAttribute('disabled')).toBe(false);
});
it('Tab/Shift+Tab theo thứ tự ô, bỏ qua phòng khóa; Enter/Shift+Enter giữ cùng cột', async () => {
  const user = userEvent.setup(); render(<Grid />);
  const first = screen.getByRole('textbox', { name: 'P1 Điện cũ' });
  const second = screen.getByRole('textbox', { name: 'P1 Điện mới' });
  const third = screen.getByRole('textbox', { name: 'P3 Điện cũ' });
  first.focus(); await user.tab(); expect(document.activeElement).toBe(second);
  await user.tab(); expect(document.activeElement).toBe(third);
  await user.tab({ shift: true }); expect(document.activeElement).toBe(second);
  first.focus(); await user.keyboard('{Enter}'); expect(document.activeElement).toBe(third);
  await user.keyboard('{Enter}'); expect(document.activeElement).toBe(third);
  await user.keyboard('{Shift>}{Enter}{/Shift}'); expect(document.activeElement).toBe(first);
  await user.keyboard('{Shift>}{Enter}{/Shift}'); expect(document.activeElement).toBe(first);
});
it('Enter trong IME không chuyển ô và phòng khóa không cho sửa', () => {
  render(<Grid />);
  const first = screen.getByRole('textbox', { name: 'P1 Điện cũ' });
  first.focus(); fireEvent.keyDown(first, { key: 'Enter', isComposing: true });
  expect(document.activeElement).toBe(first);
  expect(screen.getByRole('textbox', { name: 'P2 Điện mới' }).hasAttribute('disabled')).toBe(true);
});
it('hiển thị lỗi server ngay tại đúng ô khi local validation hợp lệ', () => {
  render(<ReadingInputCell row={{ room: { id: 1, name: 'P1' }, current: null, previous: null,
    locked: false, values: { electricStart: 1, electricEnd: 2 } }} field="electricEnd"
    serverError="Chỉ số không phù hợp" onChange={() => {}} />);
  const input = screen.getByRole('textbox', { name: 'P1 Điện mới' });
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByText('Chỉ số không phù hợp').id).toBe(input.getAttribute('aria-describedby'));
});
