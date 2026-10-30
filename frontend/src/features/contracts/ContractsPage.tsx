import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import dayjs from 'dayjs';
import { contractsApi } from '../../api/contracts';
import { getErrorMessage } from '../../api/client';
import type { Contract, ContractInput, ContractStatus } from '../../types';
import { formatDate, formatVND } from '../../utils/format';
import { ContractFormModal } from './ContractFormModal';

const QUERY_KEY = ['contracts'];

const CONTRACT_STATUS: Record<Contract['status'], { label: string; color: string }> = {
  ACTIVE: { label: 'Đang hiệu lực', color: 'green' },
  ENDED: { label: 'Đã kết thúc', color: 'default' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
};

const normalizeSearchText = (value: string) =>
  value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export default function ContractsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [status, setStatus] = useState<ContractStatus>();
  const [searchText, setSearchText] = useState('');

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: [...QUERY_KEY, status],
    queryFn: () => contractsApi.list({ status }),
  });

  const createMutation = useMutation({
    mutationFn: (values: ContractInput) => contractsApi.create(values),
    onSuccess: () => {
      message.success('Đã tạo hợp đồng');
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (mutationError) => message.error(getErrorMessage(mutationError)),
  });

  const deleteMutation = useMutation({
    mutationFn: contractsApi.remove,
    onSuccess: () => {
      message.success('Đã xóa hợp đồng');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (mutationError) => message.error(getErrorMessage(mutationError)),
  });

  const endMutation = useMutation({
    mutationFn: (id: number) => contractsApi.end(id, dayjs().format('YYYY-MM-DD')),
    onSuccess: () => {
      message.success('Đã kết thúc hợp đồng');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (mutationError) => message.error(getErrorMessage(mutationError)),
  });

  const normalizedSearch = normalizeSearchText(searchText.trim());
  const filteredContracts = data.filter((contract) => {
    if (!normalizedSearch) return true;
    const primaryTenant = contract.tenants?.find((tenant) => tenant.isPrimary)?.tenant;
    const searchableText = [
      contract.room?.name,
      contract.room?.building?.name,
      primaryTenant?.fullName,
      primaryTenant?.phone,
    ]
      .filter(Boolean)
      .join(' ');
    const normalizedContractText = normalizeSearchText(searchableText);
    return normalizedContractText.includes(normalizedSearch);
  });

  const columns: ColumnsType<Contract> = [
    {
      title: 'Phòng',
      dataIndex: 'room',
      render: (room: Contract['room'], contract) => room?.name ?? `Phòng #${contract.roomId}`,
    },
    { title: 'Bắt đầu', dataIndex: 'startDate', render: (date: string) => formatDate(date) },
    { title: 'Kết thúc', dataIndex: 'endDate', render: (date: string | null) => (date ? formatDate(date) : 'Không thời hạn') },
    { title: 'Giá thuê', dataIndex: 'rentPrice', render: (price: number) => formatVND(price) },
    {
      title: 'Người đại diện',
      dataIndex: 'tenants',
      render: (tenants: Contract['tenants']) =>
        tenants?.find((tenant) => tenant.isPrimary)?.tenant?.fullName ?? '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: Contract['status']) => <Tag color={CONTRACT_STATUS[status].color}>{CONTRACT_STATUS[status].label}</Tag>,
    },
    {
      title: '',
      align: 'right',
      render: (_, contract) => (
        <Space>
          {contract.status === 'ACTIVE' && (
            <Popconfirm
              title="Kết thúc hợp đồng này?"
              description={`Ngày kết thúc sẽ là ${dayjs().format('DD/MM/YYYY')}.`}
              okText="Kết thúc"
              cancelText="Hủy"
              okButtonProps={{ loading: endMutation.isPending }}
              onConfirm={() => endMutation.mutate(contract.id)}
            >
              <Button> Kết thúc </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Xóa hợp đồng này?"
            description="Hành động này không thể hoàn tác."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            onConfirm={() => deleteMutation.mutate(contract.id)}
          >
            <Button danger aria-label={`Xóa hợp đồng ${contract.id}`} icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Hợp đồng"
      extra={
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tìm phòng hoặc người đại diện"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder="Mọi trạng thái"
            style={{ minWidth: 150 }}
            value={status}
            onChange={(value: ContractStatus | undefined) => setStatus(value)}
            options={Object.entries(CONTRACT_STATUS).map(([value, option]) => ({ value, label: option.label }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
            Thêm hợp đồng
          </Button>
        </Space>
      }
    >
      {isError && (
        <Alert
          type="error"
          showIcon
          message={getErrorMessage(error)}
          action={
            <Button size="small" onClick={() => void refetch()}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      <Table rowKey="id" columns={columns} dataSource={filteredContracts} loading={isLoading} scroll={{ x: 900 }} />
      <ContractFormModal
        open={formOpen}
        submitting={createMutation.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </Card>
  );
}
