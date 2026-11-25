import { Grid, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { InvoiceItemRow } from '../types';
import { formatVND } from '../utils/format';

const ITEM_LABELS: Record<InvoiceItemRow['type'], string> = {
  RENT: 'Tiền phòng',
  ELECTRICITY: 'Tiền điện',
  WATER: 'Tiền nước',
  SERVICE: 'Dịch vụ',
  OTHER: 'Khoản khác',
  DISCOUNT: 'Giảm trừ',
};

const quantityFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 });
const quantityColumns: ColumnsType<InvoiceItemRow> = [
  { title: 'Số lượng', dataIndex: 'quantity', align: 'right', render: (value: number) => quantityFormat.format(value) },
  { title: 'Đơn giá', dataIndex: 'unitPrice', align: 'right', render: formatVND },
];

export interface InvoiceItemsTableProps {
  items: readonly InvoiceItemRow[];
  totalAmount: number;
  compact?: boolean;
}

export function InvoiceItemsTable({ items, totalAmount, compact = false }: InvoiceItemsTableProps) {
  const screens = Grid.useBreakpoint();
  const showCompact = compact || !screens.md;
  const columns: ColumnsType<InvoiceItemRow> = [
    {
      title: 'Khoản',
      render: (_, item) => (
        <div style={{ overflowWrap: 'anywhere' }}>
          <Typography.Text strong>{ITEM_LABELS[item.type]}</Typography.Text>
          <div>{item.description}</div>
          {showCompact && (item.type === 'WATER' || (item.type !== 'RENT' && item.quantity !== 1)) && (
            <Typography.Text type="secondary">
              {quantityFormat.format(item.quantity)} × {formatVND(item.unitPrice)}
            </Typography.Text>
          )}
        </div>
      ),
    },
    ...(showCompact ? [] : quantityColumns),
    { title: 'Thành tiền', dataIndex: 'amount', align: 'right', width: 130, render: formatVND },
  ];

  return (
    <Table
      rowKey="id"
      dataSource={items}
      columns={columns}
      pagination={false}
      size="small"
      tableLayout="fixed"
      locale={{ emptyText: 'Chưa có khoản nào' }}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={columns.length - 1}>
            <Typography.Text strong>Tổng tiền</Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={columns.length - 1} align="right">
            <Typography.Text strong>{formatVND(totalAmount)}</Typography.Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
  );
}
