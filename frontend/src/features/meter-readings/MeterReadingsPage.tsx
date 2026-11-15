/** Trang nhập nhanh điện nước theo tòa nhà/tháng; điều phối truy vấn, bản nháp và lưu hàng loạt. */
import { useState } from 'react';
import { Alert, App, Button, DatePicker, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { buildingsApi } from '../../api/buildings';
import { getErrorMessage } from '../../api/client';
import { meterApi } from '../../api/meter-readings';
import { ConsumptionCell, ReadingInputCell } from './MeterReadingCells';
import { useScopedMeterReadings } from './useScopedMeterReadings';
import {
  isReadingValid,
  prepareRows,
  READING_FIELDS,
  toReading,
  type EditableMeterRow,
} from './meterReadings.utils';

/** Kết nối dữ liệu API với bảng nhập, bộ lọc và phản hồi lưu cho chủ nhà. */
export default function MeterReadingsPage() {
  const { message } = App.useApp();
  const [buildingId, setBuildingId] = useState<number>();
  const [period, setPeriod] = useState(dayjs().format('YYYY-MM'));
  const { drafts, fieldErrors, error: saveError, isSaving, updateReading, saveReadings } = useScopedMeterReadings(buildingId, period, {
    onSaved: (saved) => message.success(`Đã lưu chỉ số tòa nhà #${saved.buildingId}, tháng ${saved.period}`),
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const buildingsQuery = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });
  // Cache tách theo tòa nhà và tháng; chỉ tự tải khi đã chọn tòa nhà.
  const readingsQuery = useQuery({
    queryKey: ['meter-readings', buildingId, period],
    queryFn: () => {
      if (buildingId === undefined) throw new Error('Vui lòng chọn tòa nhà');
      return meterApi.list(buildingId, period);
    },
    enabled: Boolean(buildingId),
  });

  const rows = prepareRows(readingsQuery.data ?? [], drafts);
  // Bỏ qua dòng khóa khi kiểm tra khả năng lưu và tạo payload.
  const editableRows = rows.filter((row) => !row.locked);
  const canSave =
    Boolean(buildingId) &&
    editableRows.length > 0 &&
    editableRows.every(isReadingValid) &&
    !readingsQuery.isFetching &&
    !readingsQuery.isError &&
    !isSaving;

  /** Tải lại cả danh sách tòa nhà và bảng chỉ số khi truy vấn thất bại. */
  function retryLoading() {
    void readingsQuery.refetch();
    void buildingsQuery.refetch();
  }

  // Dùng chung cấu hình trường cho bốn cột nhập; hai cột tiêu thụ chỉ hiển thị kết quả.
  const columns: TableColumnsType<EditableMeterRow> = [
    { title: 'Phòng', render: (_, row) => `${row.room.name}${row.locked ? ' — Đã khóa' : ''}` },
    ...READING_FIELDS.map(({ field, label }) => ({
      title: label,
      render: (_: unknown, row: EditableMeterRow) => (
        <ReadingInputCell
          row={row}
          field={field}
          serverError={fieldErrors[row.room.id]?.[field]}
          onChange={updateReading}
        />
      ),
    })),
    {
      title: 'Tiêu thụ điện',
      render: (_, row) => <ConsumptionCell row={row} kind="electric" />,
    },
    {
      title: 'Tiêu thụ nước',
      render: (_, row) => <ConsumptionCell row={row} kind="water" />,
    },
  ];

  return (
    <section>
      <h1>Chỉ số điện nước</h1>
      <Select
        aria-label="Tòa nhà"
        placeholder="Chọn tòa nhà"
        value={buildingId}
        loading={buildingsQuery.isLoading}
        options={buildingsQuery.data?.map((building) => ({ value: building.id, label: building.name }))}
        onChange={setBuildingId}
      />
      <DatePicker
        aria-label="Tháng ghi chỉ số"
        picker="month"
        allowClear={false}
        value={dayjs(`${period}-01`)}
        onChange={(date) => {
          if (date) setPeriod(date.format('YYYY-MM'));
        }}
      />
      {(readingsQuery.isError || buildingsQuery.isError) && (
        <Alert
          type="error"
          title="Không tải được dữ liệu"
          action={<Button onClick={retryLoading}>Thử lại</Button>}
        />
      )}
      <Alert type="info" title="Bản nháp được giữ riêng theo tòa nhà và tháng khi đổi bộ lọc trong trang này." />
      {saveError && <Alert type="error" title={saveError} />}
      <Table
        rowKey={(row) => row.room.id}
        dataSource={rows}
        columns={columns}
        loading={readingsQuery.isFetching}
        pagination={false}
        scroll={{ x: 1000 }}
      />
      <Button
        type="primary"
        loading={isSaving}
        disabled={!canSave}
        onClick={() => saveReadings(editableRows.map(toReading))}
      >
        Lưu tất cả
      </Button>
    </section>
  );
}
