// Trang Phòng — làm theo mẫu BuildingsPage, thêm phần lọc theo tòa nhà và trạng thái.
// queryKey có kèm bộ lọc (['rooms', buildingId, status]) → đổi bộ lọc là tự gọi lại API,
// còn invalidateQueries(['rooms']) làm mới MỌI danh sách phòng đã cache.
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { buildingsApi } from '../../api/buildings';
import { getErrorMessage } from '../../api/client';
import { roomsApi } from '../../api/rooms';
import type { Room, RoomStatus } from '../../types';
import { formatVND } from '../../utils/format';
import { ROOM_STATUS, ROOM_STATUS_OPTIONS } from '../../utils/status';
import { RoomFormModal, type RoomFormValues } from './RoomFormModal';

export default function RoomsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  // Bộ lọc: undefined = tất cả
  const [buildingId, setBuildingId] = useState<number>();
  const [status, setStatus] = useState<RoomStatus>();

  // null = modal đóng; 'new' = đang thêm mới; Room = đang sửa phòng đó
  const [editing, setEditing] = useState<Room | 'new' | null>(null);

  // Dùng lại cache ['buildings'] của trang Tòa nhà cho ô chọn tòa nhà
  const { data: buildings = [] } = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });
  const { data = [], isLoading } = useQuery({
    queryKey: ['rooms', buildingId, status],
    queryFn: () => roomsApi.list({ buildingId, status }),
  });

  // Phòng thay đổi thì số phòng ở trang Tòa nhà cũng đổi → làm mới cả hai
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['buildings'] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: RoomFormValues) => {
      if (editing && editing !== 'new') {
        // Không gửi buildingId (không đổi được tòa nhà); chỉ gửi trạng thái khi người dùng đổi nó
        const { buildingId: _, status: newStatus, ...changes } = values;
        const statusChanged = newStatus && newStatus !== editing.status && newStatus !== 'OCCUPIED';
        return roomsApi.update(editing.id, { ...changes, ...(statusChanged && { status: newStatus }) });
      }
      return roomsApi.create(values);
    },
    onSuccess: () => {
      message.success('Đã lưu phòng');
      setEditing(null);
      refresh();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: roomsApi.remove,
    onSuccess: () => {
      message.success('Đã xóa phòng');
      refresh();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const columns: ColumnsType<Room> = [
    {
      title: 'Phòng',
      dataIndex: 'name',
      // Đang xem tất cả tòa nhà thì hiện thêm tên tòa nhà cho dễ phân biệt
      render: (name: string, r) => (
        <>
          <b>{name}</b>
          {!buildingId && r.building && (
            <>
              <br />
              <small>{r.building.name}</small>
            </>
          )}
        </>
      ),
    },
    { title: 'Tầng', dataIndex: 'floor', align: 'center', render: (v: number | null) => v ?? '—' },
    { title: 'Diện tích', dataIndex: 'area', align: 'center', render: (v: number | null) => (v ? `${v} m²` : '—') },
    { title: 'Giá thuê', dataIndex: 'baseRent', render: (v: number) => formatVND(v) },
    { title: 'Tối đa', dataIndex: 'maxOccupants', align: 'center', render: (v: number) => `${v} người` },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: RoomStatus) => <Tag color={ROOM_STATUS[s].color}>{ROOM_STATUS[s].label}</Tag>,
    },
    {
      title: '',
      align: 'right',
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setEditing(r)} />
          <Popconfirm
            title={`Xóa phòng "${r.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(r.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Phòng"
      extra={
        <Space wrap>
          <Select
            allowClear
            placeholder="Tất cả tòa nhà"
            style={{ minWidth: 180 }}
            value={buildingId}
            onChange={setBuildingId}
            options={buildings.map((b) => ({ value: b.id, label: b.name }))}
          />
          <Select
            allowClear
            placeholder="Mọi trạng thái"
            style={{ minWidth: 140 }}
            value={status}
            onChange={setStatus}
            options={ROOM_STATUS_OPTIONS}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditing('new')}
            disabled={buildings.length === 0}
            title={buildings.length === 0 ? 'Hãy tạo tòa nhà trước' : undefined}
          >
            Thêm phòng
          </Button>
        </Space>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={data} loading={isLoading} scroll={{ x: 700 }} />

      <RoomFormModal
        open={editing !== null}
        initialValues={editing && editing !== 'new' ? editing : undefined}
        defaultBuildingId={buildingId}
        buildings={buildings}
        submitting={saveMutation.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={(values) => saveMutation.mutate(values)}
      />
    </Card>
  );
}
