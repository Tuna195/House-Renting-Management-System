import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { getErrorMessage } from '../../api/client';
import { tenantsApi } from '../../api/tenants';
import type { Tenant, TenantInput } from '../../types';
import { CreateAccountModal } from './CreateAccountModal';
import { TenantFormModal } from './TenantFormModal';

const QUERY_KEY = ['tenants'];

export default function TenantsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Tenant | 'new' | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [accountTenant, setAccountTenant] = useState<Tenant | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEY, searchQuery],
    queryFn: () => tenantsApi.list(searchQuery ? { q: searchQuery } : undefined),
  });

  const saveMutation = useMutation({
    mutationFn: (values: TenantInput) =>
      editing && editing !== 'new' ? tenantsApi.update(editing.id, values) : tenantsApi.create(values),
    onSuccess: () => {
      message.success('Đã lưu khách thuê');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (mutationError) => message.error(getErrorMessage(mutationError)),
  });

  const deleteMutation = useMutation({
    mutationFn: tenantsApi.remove,
    onSuccess: () => {
      message.success('Đã xóa khách thuê');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (mutationError) => message.error(getErrorMessage(mutationError)),
  });

  const accountMutation = useMutation({
    mutationFn: ({ tenant, credentials }: { tenant: Tenant; credentials: { email: string; password: string } }) =>
      tenantsApi.createAccount(tenant.id, {
        ...credentials,
        fullName: tenant.fullName,
        phone: tenant.phone,
      }),
    onSuccess: () => {
      message.success('Đã cấp tài khoản cho khách thuê');
      setAccountTenant(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (mutationError) => message.error(getErrorMessage(mutationError)),
  });

  const columns: ColumnsType<Tenant> = [
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      render: (name: string, tenant) => (
        <>
          <b>{name}</b>
          <br />
          <small>{tenant.phone}</small>
        </>
      ),
    },
    {
      title: 'CCCD',
      dataIndex: 'idNumber',
      render: (idNumber: string | null) =>
        idNumber ? `${'*'.repeat(Math.max(4, idNumber.length - 4))}${idNumber.slice(-4)}` : '—',
    },
    {
      title: 'Quê quán',
      dataIndex: 'hometown',
      render: (hometown: string | null) => hometown || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      render: (email: string | null) => email || '—',
    },
    {
      title: 'Tài khoản',
      align: 'center',
      render: (_, tenant) => (tenant.userId ? <Tag color="green">Đã cấp</Tag> : <Tag color="default">Chưa cấp</Tag>),
    },
    {
      title: '',
      align: 'right',
      render: (_, tenant) => (
        <Space>
          {!tenant.userId && <Button onClick={() => setAccountTenant(tenant)}>Cấp tài khoản</Button>}
          <Button aria-label={`Sửa ${tenant.fullName}`} icon={<EditOutlined />} onClick={() => setEditing(tenant)} />
          <Popconfirm
            title={`Xóa khách thuê "${tenant.fullName}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            onConfirm={() => deleteMutation.mutate(tenant.id)}
          >
            <Button danger aria-label={`Xóa ${tenant.fullName}`} icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Khách thuê"
      extra={
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tìm tên hoặc số điện thoại"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              if (!event.target.value) setSearchQuery('');
            }}
            onSearch={(value) => setSearchQuery(value.trim())}
            style={{ width: 260 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing('new')}>
            Thêm khách thuê
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
      <Table rowKey="id" columns={columns} dataSource={data} loading={isLoading} scroll={{ x: 900 }} />

      <TenantFormModal
        open={editing !== null}
        initialValues={editing && editing !== 'new' ? editing : undefined}
        submitting={saveMutation.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <CreateAccountModal
        open={accountTenant !== null}
        tenant={accountTenant}
        submitting={accountMutation.isPending}
        onCancel={() => setAccountTenant(null)}
        onSubmit={(credentials) => {
          if (accountTenant) accountMutation.mutate({ tenant: accountTenant, credentials });
        }}
      />
    </Card>
  );
}
