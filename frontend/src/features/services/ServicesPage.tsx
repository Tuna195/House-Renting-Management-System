// Trang Dịch vụ — làm theo mẫu RoomsPage. Dịch vụ luôn thuộc một tòa nhà nên bắt buộc chọn tòa nhà trước.
// Xóa dịch vụ đã dùng trong hợp đồng → backend chỉ ẩn (isActive = false) để giữ đúng hợp đồng và hóa đơn cũ.
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Empty, Popconfirm, Select, Space, Switch, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { buildingsApi } from '../../api/buildings';
import { getErrorMessage } from '../../api/client';
import { servicesApi } from '../../api/services';
import type { Service, ServiceInput } from '../../types';
import { formatVND } from '../../utils/format';
import { SERVICE_UNIT } from '../../utils/status';
import { ServiceFormModal } from './ServiceFormModal';

export default function ServicesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [buildingId, setBuildingId] = useState<number>();
  // null = modal đóng; 'new' = đang thêm mới; Service = đang sửa dịch vụ đó
  const [editing, setEditing] = useState<Service | 'new' | null>(null);

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: buildingsApi.list,
  });

  // Chưa chọn thì tự chọn tòa nhà đầu tiên cho đỡ một bước bấm
  useEffect(() => {
    if (buildingId === undefined && buildings.length > 0) setBuildingId(buildings[0].id);
  }, [buildings, buildingId]);

  const { data = [], isLoading } = useQuery({
    queryKey: ['services', buildingId],
    queryFn: () => servicesApi.list(buildingId),
    enabled: buildingId !== undefined,
  });

  // Dùng chung key ['services', buildingId] với form tạo hợp đồng → làm mới cả hai
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['services'] });

  const saveMutation = useMutation({
    mutationFn: (values: ServiceInput) => {
      if (editing && editing !== 'new') {
        const { buildingId: _, ...changes } = values; // không đổi được tòa nhà
        return servicesApi.update(editing.id, changes);
      }
      return servicesApi.create(values);
    },
    onSuccess: () => {
      message.success('Đã lưu dịch vụ');
      setEditing(null);
      refresh();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: (s: Service) => servicesApi.update(s.id, { isActive: !s.isActive }),
    onSuccess: (s) => {
      message.success(s.isActive ? `Đã bật lại "${s.name}"` : `Đã ẩn "${s.name}"`);
      refresh();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: servicesApi.remove,
    onSuccess: (result) => {
      if (result?.archived) message.info(`"${result.service.name}" đang dùng trong hợp đồng nên chỉ được ẩn`);
      else message.success('Đã xóa dịch vụ');
      refresh();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const columns: ColumnsType<Service> = [
    {
      title: 'Dịch vụ',
      dataIndex: 'name',
      render: (name: string, s) => (
        <Space>
          <b style={{ opacity: s.isActive ? 1 : 0.5 }}>{name}</b>
          {!s.isActive && <Tag>Đã ẩn</Tag>}
        </Space>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      render: (price: number, s) => `${formatVND(price)}${SERVICE_UNIT[s.unit].suffix}`,
    },
    { title: 'Cách tính', dataIndex: 'unit', render: (unit: Service['unit']) => SERVICE_UNIT[unit].label },
    {
      title: 'Hợp đồng dùng',
      align: 'center',
      render: (_, s) => s._count?.contractServices ?? 0,
    },
    {
      title: 'Áp dụng',
      align: 'center',
      render: (_, s) => (
        <Switch
          size="small"
          checked={s.isActive}
          loading={toggleMutation.isPending && toggleMutation.variables?.id === s.id}
          onChange={() => toggleMutation.mutate(s)}
        />
      ),
    },
    {
      title: '',
      align: 'right',
      render: (_, s) => {
        const inUse = (s._count?.contractServices ?? 0) > 0;
        return (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setEditing(s)} />
            <Popconfirm
              title={inUse ? `Ẩn dịch vụ "${s.name}"?` : `Xóa dịch vụ "${s.name}"?`}
              description={inUse ? 'Dịch vụ đang có trong hợp đồng nên sẽ được ẩn thay vì xóa' : undefined}
              okText={inUse ? 'Ẩn' : 'Xóa'}
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteMutation.mutate(s.id)}
              disabled={inUse && !s.isActive} // đã ẩn rồi thì không còn gì để xóa
            >
              <Tooltip title={inUse && !s.isActive ? 'Đã ẩn, không thể xóa vì có hợp đồng dùng' : undefined}>
                <Button danger icon={<DeleteOutlined />} disabled={inUse && !s.isActive} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title="Dịch vụ"
      extra={
        <Space wrap>
          <Select
            placeholder="Chọn tòa nhà"
            style={{ minWidth: 180 }}
            loading={loadingBuildings}
            value={buildingId}
            onChange={setBuildingId}
            options={buildings.map((b) => ({ value: b.id, label: b.name }))}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditing('new')}
            disabled={buildings.length === 0}
            title={buildings.length === 0 ? 'Hãy tạo tòa nhà trước' : undefined}
          >
            Thêm dịch vụ
          </Button>
        </Space>
      }
    >
      {!loadingBuildings && buildings.length === 0 ? (
        <Empty description="Chưa có tòa nhà nào. Hãy tạo tòa nhà trước khi thêm dịch vụ." />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={isLoading}
          scroll={{ x: 640 }}
          locale={{ emptyText: <Empty description="Tòa nhà này chưa có dịch vụ" /> }}
        />
      )}

      <ServiceFormModal
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
