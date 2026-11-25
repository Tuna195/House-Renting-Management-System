import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, DatePicker, Grid, Modal, Select, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buildingsApi } from '../../api/buildings';
import { getErrorMessage } from '../../api/client';
import { invoicesApi } from '../../api/invoices';
import { InvoiceStatusTag } from '../../components/InvoiceStatusTag';
import type { InvoiceGenerationResult, InvoiceSkipReason, InvoiceStatus, InvoiceSummary } from '../../types';
import { formatPeriod, formatVND } from '../../utils/format';
import { INVOICE_STATUS } from '../../utils/status';
import { formatInvoiceDueDate, isInvoiceOverdue } from './invoiceDates';

const statusOptions = (Object.keys(INVOICE_STATUS) as InvoiceStatus[]).map((value) => ({
  value, label: INVOICE_STATUS[value].label,
}));

const skipLabels: Record<InvoiceSkipReason, string> = {
  ALREADY_EXISTS: 'Đã có hóa đơn',
  MULTIPLE_CONTRACTS: 'Có nhiều hợp đồng trong kỳ, cần đối chiếu chỉ số',
  PARTIAL_PERIOD: 'Hợp đồng chưa đủ tháng, cần xác nhận số ngày thuê',
};

function GenerationSummary({ result }: { result: InvoiceGenerationResult }) {
  return (
    <>
      <p>Đã tạo: <strong>{result.created}</strong> · Bỏ qua: <strong>{result.skipped.length}</strong> · Thiếu chỉ số: <strong>{result.missingReadings.length}</strong></p>
      {result.skipped.length > 0 && (
        <>
          <Typography.Text strong>Hợp đồng bỏ qua</Typography.Text>
          <ul>
            {result.skipped.map(({ contractId, roomName, reason }) => (
              <li key={contractId}>{roomName} (hợp đồng #{contractId}): {skipLabels[reason]}</li>
            ))}
          </ul>
        </>
      )}
      {result.missingReadings.length > 0 && (
        <>
          <Typography.Text strong>Phòng thiếu chỉ số</Typography.Text>
          <ul>
            {result.missingReadings.map(({ contractId, roomName }) => (
              <li key={contractId}>{roomName} (hợp đồng #{contractId})</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function InvoicesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const screens = Grid.useBreakpoint();
  const [buildingId, setBuildingId] = useState<number>();
  const [month, setMonth] = useState<Dayjs | null>(null);
  const [status, setStatus] = useState<InvoiceStatus>();
  const [report, setReport] = useState<{ period: string; building: string; result: InvoiceGenerationResult } | null>(null);
  const period = month?.format('YYYY-MM');
  const canGenerate = buildingId !== undefined && Boolean(period);
  const generateHint = 'Chọn tòa nhà và kỳ hóa đơn để tạo';
  const filters = { buildingId, period, status };

  const buildings = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });
  const invoices = useQuery({ queryKey: ['invoices', 'list', filters], queryFn: () => invoicesApi.list(filters) });
  const generate = useMutation({
    mutationFn: invoicesApi.generate,
    onSuccess: (result, input) => {
      const building = buildings.data?.find(({ id }) => id === input.buildingId)?.name ?? `Tòa nhà #${input.buildingId}`;
      setReport({ period: input.period, building, result });
      return queryClient.invalidateQueries({ queryKey: ['invoices', 'list'] });
    },
    onError: (error) => {
      message.error(getErrorMessage(error));
      void queryClient.invalidateQueries({ queryKey: ['invoices', 'list'] });
    },
  });

  const columns: ColumnsType<InvoiceSummary> = [
    {
      title: 'Hóa đơn',
      render: (_, invoice) => (
        <div style={{ overflowWrap: 'anywhere' }}>
          <Link to={`/invoices/${invoice.id}`} aria-label={`Hóa đơn phòng ${invoice.room.name}, ${formatPeriod(invoice.period)}`}>
            {invoice.room.name} · {formatPeriod(invoice.period)}
          </Link>
          <div>{invoice.building.name}</div>
          {!screens.md && <small>{invoice.primaryTenant?.fullName ?? 'Chưa có người đại diện'}</small>}
        </div>
      ),
    },
    { title: 'Người đại diện', responsive: ['md'], render: (_, invoice) => invoice.primaryTenant?.fullName ?? '—' },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      align: 'right',
      width: screens.md ? 150 : '52%',
      render: (amount: number, invoice) => (
        <>
          <Typography.Text strong>{formatVND(amount)}</Typography.Text>
          {!screens.md && <div><small>Hạn {formatInvoiceDueDate(invoice.dueDate)}</small></div>}
          {!screens.md && <InvoiceStatusTag status={invoice.status} overdue={isInvoiceOverdue(invoice.dueDate)} />}
        </>
      ),
    },
    { title: 'Hạn đóng', dataIndex: 'dueDate', responsive: ['md'], render: formatInvoiceDueDate },
    {
      title: 'Trạng thái',
      responsive: ['md'],
      render: (_, invoice) => <InvoiceStatusTag status={invoice.status} overdue={isInvoiceOverdue(invoice.dueDate)} />,
    },
  ];

  return (
    <Card title="Hóa đơn">
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          aria-label="Tòa nhà"
          placeholder="Tất cả tòa nhà"
          allowClear
          style={{ width: 180 }}
          value={buildingId}
          onChange={setBuildingId}
          loading={buildings.isLoading}
          options={buildings.data?.map(({ id, name }) => ({ value: id, label: name }))}
        />
        <DatePicker aria-label="Kỳ hóa đơn" placeholder="Chọn kỳ hóa đơn" picker="month" format="MM/YYYY" value={month} onChange={setMonth} />
        <Select
          aria-label="Trạng thái"
          placeholder="Mọi trạng thái"
          allowClear
          style={{ width: 175 }}
          value={status}
          onChange={setStatus}
          options={statusOptions}
        />
        <Tooltip title={canGenerate ? undefined : generateHint} trigger={['hover', 'focus']}>
          <span tabIndex={canGenerate ? undefined : 0} aria-label={canGenerate ? undefined : generateHint} style={{ display: 'inline-block' }}>
            <Button
              type="primary"
              disabled={!canGenerate}
              loading={generate.isPending}
              style={canGenerate ? undefined : { pointerEvents: 'none' }}
              onClick={() => {
                if (buildingId !== undefined && period) generate.mutate({ buildingId, period });
              }}
            >
              Tạo hóa đơn kỳ này
            </Button>
          </span>
        </Tooltip>
      </Space>
      {buildings.isError && <Alert type="error" message={getErrorMessage(buildings.error)} style={{ marginBottom: 16 }} />}
      {invoices.isError ? (
        <Alert type="error" message={getErrorMessage(invoices.error)} />
      ) : (
        <Table rowKey="id" size="small" tableLayout="fixed" loading={invoices.isLoading} columns={columns} dataSource={invoices.data} locale={{ emptyText: 'Chưa có hóa đơn' }} />
      )}
      <Modal
        title={report ? `Kết quả tạo hóa đơn · ${report.building} · ${formatPeriod(report.period)}` : 'Kết quả tạo hóa đơn'}
        open={report !== null}
        onCancel={() => setReport(null)}
        footer={<Button onClick={() => setReport(null)}>Đóng</Button>}
      >
        {report && <GenerationSummary result={report.result} />}
      </Modal>
    </Card>
  );
}
