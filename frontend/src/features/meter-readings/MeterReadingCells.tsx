/** Ô nhập giữ nguyên dữ liệu sai, liên kết lỗi với input và hỗ trợ điều hướng cùng cột. */
import { Alert, Input } from 'antd';
import { getConsumption, getFieldError, READING_FIELDS, type EditableMeterRow, type MeterKind,
  type ReadingField, type ReadingValue } from './meterReadings.utils';

interface ReadingInputCellProps {
  row: EditableMeterRow;
  field: ReadingField;
  serverError?: string;
  onChange: (roomId: number, field: ReadingField, value: ReadingValue | null) => void;
}

/** Tìm dòng khả dụng tiếp theo/trước đó trong chính bảng hiện tại, không vượt sang bảng khác. */
function focusAdjacentInput(input: HTMLInputElement, field: ReadingField, backwards: boolean) {
  const table = input.closest('table');
  if (!table) return;
  const inputs = Array.from(table.querySelectorAll<HTMLInputElement>(`input[data-meter-field="${field}"]`));
  const index = inputs.indexOf(input);
  for (let next = index + (backwards ? -1 : 1); next >= 0 && next < inputs.length; next += backwards ? -1 : 1) {
    if (!inputs[next].disabled) {
      inputs[next].focus();
      return;
    }
  }
}

/** Hiển thị lỗi cụ thể; Tab dùng thứ tự DOM, Enter/Shift+Enter bỏ qua dòng đã khóa. */
export function ReadingInputCell({ row, field, serverError, onChange }: ReadingInputCellProps) {
  const error = row.locked ? undefined : (getFieldError(row.values, field) ?? serverError);
  const inputId = `meter-${row.room.id}-${field}`;
  const errorId = `${inputId}-error`;
  const label = READING_FIELDS.find((item) => item.field === field)?.label;
  return (
    <div>
      <Input
        aria-label={`${row.room.name} ${label}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        id={inputId}
        data-meter-field={field}
        inputMode="numeric"
        autoComplete="off"
        disabled={row.locked}
        value={row.values[field] ?? ''}
        status={error ? 'error' : undefined}
        onChange={(event) => onChange(row.room.id, field, event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            focusAdjacentInput(event.currentTarget, field, event.shiftKey);
          }
        }}
      />
      {error && <small id={errorId}>{error}</small>}
    </div>
  );
}

/** Hiển thị tiêu thụ và cảnh báo bằng chữ; dữ liệu chưa hợp lệ không tạo tiêu thụ giả. */
export function ConsumptionCell({ row, kind }: { row: EditableMeterRow; kind: MeterKind }) {
  const consumption = getConsumption(row, kind);
  if (!consumption) return '—';
  return (
    <div>
      {consumption.usage}
      {consumption.warning && <Alert type="warning" title={consumption.warning} />}
    </div>
  );
}
