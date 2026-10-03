// ⭐ TRANG MẪU — Danh sách + thêm/sửa/xóa. Các trang Phòng, Khách thuê, Dịch vụ... làm theo mẫu này.
//
// Luồng dữ liệu:
//   useQuery     → gọi API lấy danh sách, tự lo trạng thái loading/lỗi và cache
//   useMutation  → gọi API thêm/sửa/xóa; xong thì invalidateQueries để danh sách tự tải lại
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { buildingsApi } from '../../api/buildings';
import { getErrorMessage } from '../../api/client';
import type { Building, BuildingInput } from '../../types';
import { formatVND } from '../../utils/format';
import { BuildingFormModal } from './BuildingFormModal';

const QUERY_KEY = ['buildings'];

export default function BuildingsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  // null = modal đóng; 'new' = đang thêm mới; Building = đang sửa tòa nhà đó
  const [editing, setEditing] = useState<Building | 'new' | null>(null);

  const { data = [], isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: buildingsApi.list });

  const saveMutation = useMutation({
    mutationFn: (values: BuildingInput) =>
      editing && editing !== 'new' ? buildingsApi.update(editing.id, values) : buildingsApi.create(values),
    onSuccess: () => {
      message.success('Đã lưu tòa nhà');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: buildingsApi.remove,
    onSuccess: () => {
      message.success('Đã xóa tòa nhà');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const columns: ColumnsType<Building> = [
    { title: 'Tên tòa nhà', dataIndex: 'name', render: (name: string, b) => <><b>{name}</b><br /><small>{b.address}</small></> },
    { title: 'Số phòng', align: 'center', render: (_, b) => b._count?.rooms ?? 0 },
    { title: 'Giá điện', dataIndex: 'electricityPrice', render: (v: number) => `${formatVND(v)}/kWh` },
    {
      title: 'Giá nước',
      render: (_, b) => (
        <>
          {formatVND(b.waterPrice)}
          <Tag style={{ marginLeft: 8 }}>{b.waterBillingType === 'PER_M3' ? '/m³' : '/người'}</Tag>
        </>
      ),
    },
    { title: 'Hạn đóng', dataIndex: 'invoiceDueDay', align: 'center', render: (d: number) => `Ngày ${d}` },
    {
      title: '',
      align: 'right',
      render: (_, b) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setEditing(b)} />
          <Popconfirm
            title={`Xóa tòa nhà "${b.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(b.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Tòa nhà"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing('new')}>
          Thêm tòa nhà
        </Button>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={data} loading={isLoading} scroll={{ x: 700 }} />

      <BuildingFormModal
        open={editing !== null}
        initialValues={editing && editing !== 'new' ? editing : undefined}
        submitting={saveMutation.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={(values) => saveMutation.mutate(values)}
      />
    </Card>
  );
}
