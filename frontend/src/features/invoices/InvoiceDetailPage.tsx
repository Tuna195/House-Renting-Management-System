import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Descriptions, Flex, Skeleton, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { invoicesApi } from '../../api/invoices';
import { InvoiceItemsTable } from '../../components/InvoiceItemsTable';
import { InvoiceStatusTag } from '../../components/InvoiceStatusTag';
import { formatPeriod } from '../../utils/format';
import { formatInvoiceDueDate, isInvoiceOverdue } from './invoiceDates';

export default function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const invoiceId = Number(id);
  const validId = /^[1-9]\d{0,9}$/.test(id) && invoiceId <= 2_147_483_647;
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['invoices', 'detail', invoiceId],
    queryFn: () => invoicesApi.get(invoiceId),
    enabled: validId,
  });

  return (
    <Flex vertical gap="middle" style={{ minWidth: 0 }}>
      <Link to="/invoices">Quay về danh sách hóa đơn</Link>
      <Card title={data ? `Hóa đơn phòng ${data.room.name}` : 'Chi tiết hóa đơn'}>
        {!validId && <Alert type="error" message="Mã hóa đơn không hợp lệ" />}
        {validId && isPending && <Skeleton active />}
        {isError && <Alert type="error" message={getErrorMessage(error)} />}
        {data && (
          <>
            <Descriptions size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Tòa nhà">{data.building.name}</Descriptions.Item>
              <Descriptions.Item label="Phòng">{data.room.name}</Descriptions.Item>
              <Descriptions.Item label="Người đại diện">{data.primaryTenant?.fullName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Kỳ">{formatPeriod(data.period)}</Descriptions.Item>
              <Descriptions.Item label="Hạn đóng">{formatInvoiceDueDate(data.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Mã thanh toán">{data.paymentCode}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <InvoiceStatusTag status={data.status} overdue={isInvoiceOverdue(data.dueDate)} />
              </Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5}>Các khoản tính tiền</Typography.Title>
            <InvoiceItemsTable items={data.items} totalAmount={data.totalAmount} />
          </>
        )}
      </Card>
    </Flex>
  );
}
