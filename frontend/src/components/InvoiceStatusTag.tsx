import { Space, Tag } from 'antd';
import type { InvoiceStatus } from '../types';
import { INVOICE_STATUS } from '../utils/status';

export interface InvoiceStatusTagProps {
  status: InvoiceStatus;
  overdue?: boolean;
}

export function InvoiceStatusTag({ status, overdue = false }: InvoiceStatusTagProps) {
  const display = INVOICE_STATUS[status];
  return (
    <Space size={4} wrap>
      <Tag color={display.color}>{display.label}</Tag>
      {overdue && (status === 'UNPAID' || status === 'PARTIAL') && <Tag color="red">Quá hạn</Tag>}
    </Space>
  );
}
