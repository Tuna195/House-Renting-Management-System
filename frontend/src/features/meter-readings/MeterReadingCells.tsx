/** Các ô hiển thị của bảng điện nước: ô nhập chỉ số và ô tiêu thụ kèm cảnh báo. */
import { Alert, InputNumber } from 'antd';
import {
  getConsumption,
  isFieldInvalid,
  MAX_METER_INDEX,
  type EditableMeterRow,
  type MeterKind,
  type ReadingField,
} from './meterReadings.utils';

interface ReadingInputCellProps {
  row: EditableMeterRow;
  rowIndex: number;
  columnIndex: number;
  field: ReadingField;
  onChange: (roomId: number, field: ReadingField, value: number | null) => void;
}

/** Hiển thị một chỉ số, chuyển thay đổi lên trang cha và khóa nhập theo trạng thái của dòng. */
export function ReadingInputCell({ row, rowIndex, columnIndex, field, onChange }: ReadingInputCellProps) {
  const invalid = isFieldInvalid(row.values, field) && !row.locked;

  return (
    <div>
      <InputNumber
        aria-label={`${row.room.name} ${field}`}
        id={`meter-${rowIndex}-${columnIndex}`}
        min={0}
        max={MAX_METER_INDEX}
        precision={0}
        disabled={row.locked}
        value={row.values[field]}
        status={invalid ? 'error' : undefined}
        onChange={(value) => onChange(row.room.id, field, value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            // Chuyển tới cùng cột ở dòng kế tiếp; hiện chưa bỏ qua dòng bị khóa.
            document.getElementById(`meter-${rowIndex + 1}-${columnIndex}`)?.focus();
          }
        }}
      />
      {invalid && <small>Nhập số nguyên; chỉ số mới ≥ cũ</small>}
    </div>
  );
}

/** Hiển thị tiêu thụ và cảnh báo; dùng dấu gạch khi chưa tính được kết quả hợp lệ. */
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
