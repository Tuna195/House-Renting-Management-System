// Trang Chi tiết phòng /rooms/:id — thông tin phòng, hợp đồng đang hiệu lực, 6 kỳ chỉ số gần nhất.
// Dữ liệu lấy từ một API GET /rooms/:id (backend đã include sẵn hợp đồng và chỉ số).
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Descriptions, Empty, Result, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { roomsApi } from '../../api/rooms';
import type { Contract, MeterReading } from '../../types';
import { formatDate, formatPeriod, formatVND } from '../../utils/format';
import { ROOM_STATUS, SERVICE_UNIT } from '../../utils/status';

const readingColumns: ColumnsType<MeterReading> = [
  { title: 'Kỳ', dataIndex: 'period', render: (p: string) => formatPeriod(p) },
  {
    title: 'Điện (kWh)',
    render: (_, r) => `${r.electricStart} → ${r.electricEnd}`,
  },
  { title: 'Dùng', align: 'right', render: (_, r) => <b>{r.electricEnd - r.electricStart}</b> },
  {
    title: 'Nước (m³)',
    render: (_, r) => `${r.waterStart} → ${r.waterEnd}`,
  },
  { title: 'Dùng', align: 'right', render: (_, r) => <b>{r.waterEnd - r.waterStart}</b> },
];

function ContractSection({ contract }: { contract: Contract | null }) {
  if (!contract) return <Empty description="Phòng chưa có hợp đồng đang hiệu lực" />;

  const tenants = contract.tenants ?? [];
  const services = contract.services ?? [];
  return (
    <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
      <Descriptions.Item label="Người ở" span={2}>
        <Space direction="vertical" size={2}>
          {tenants.map((t) => (
            <span key={t.tenantId}>
              {t.tenant?.fullName} {t.tenant?.phone && <small>· {t.tenant.phone}</small>}{' '}
              {t.isPrimary && <Tag color="blue">Đại diện</Tag>}
            </span>
          ))}
        </Space>
      </Descriptions.Item>
      <Descriptions.Item label="Giá thuê">{formatVND(contract.rentPrice)}</Descriptions.Item>
      <Descriptions.Item label="Tiền cọc">{formatVND(contract.deposit)}</Descriptions.Item>
      <Descriptions.Item label="Ngày bắt đầu">{formatDate(contract.startDate)}</Descriptions.Item>
      <Descriptions.Item label="Ngày kết thúc">
        {contract.endDate ? formatDate(contract.endDate) : 'Không thời hạn'}
      </Descriptions.Item>
      <Descriptions.Item label="Dịch vụ" span={2}>
        {services.length === 0
          ? '—'
          : services.map((cs) =>
              cs.service ? (
                <Tag key={cs.serviceId}>
                  {cs.service.name}: {formatVND(cs.service.price)}
                  {SERVICE_UNIT[cs.service.unit].suffix}
                  {cs.service.unit === 'PER_QUANTITY' && ` × ${cs.quantity}`}
                </Tag>
              ) : null,
            )}
      </Descriptions.Item>
    </Descriptions>
  );
}

export default function RoomDetailPage() {
  const navigate = useNavigate();
  const id = Number(useParams().id);
  const validId = Number.isInteger(id) && id > 0;

  const {
    data: room,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['rooms', 'detail', id],
    queryFn: () => roomsApi.get(id),
    enabled: validId,
    retry: false,
  });

  if (!validId || error) {
    return (
      <Result
        status="404"
        title="Không tìm thấy phòng"
        subTitle={error ? getErrorMessage(error) : 'Đường dẫn không hợp lệ'}
        extra={<Link to="/rooms">Về danh sách phòng</Link>}
      />
    );
  }
  if (isLoading || !room) return <Spin style={{ display: 'block', margin: '48px auto' }} />;

  const status = ROOM_STATUS[room.status];
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            Phòng {room.name}
            <Tag color={status.color}>{status.label}</Tag>
          </Space>
        }
      >
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
          <Descriptions.Item label="Tòa nhà">{room.building.name}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">{room.building.address}</Descriptions.Item>
          <Descriptions.Item label="Tầng">{room.floor ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Diện tích">{room.area ? `${room.area} m²` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Giá niêm yết">{formatVND(room.baseRent)}/tháng</Descriptions.Item>
          <Descriptions.Item label="Tối đa">{room.maxOccupants} người</Descriptions.Item>
          <Descriptions.Item label="Số hợp đồng đã có">{room._count.contracts}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Hợp đồng hiện tại">
        <ContractSection contract={room.currentContract} />
      </Card>

      <Card title="Chỉ số điện nước 6 kỳ gần nhất">
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          columns={readingColumns}
          dataSource={room.meterReadings}
          scroll={{ x: 480 }}
          locale={{ emptyText: <Empty description="Chưa ghi chỉ số kỳ nào" /> }}
        />
      </Card>
    </Space>
  );
}
