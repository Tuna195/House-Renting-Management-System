import { Alert, Checkbox, DatePicker, Form, InputNumber, Radio, Select, Space, Typography, Modal } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import { roomsApi } from '../../api/rooms';
import { servicesApi } from '../../api/services';
import { tenantsApi } from '../../api/tenants';
import type { ContractInput, Room, Service, Tenant } from '../../types';
import { getErrorMessage } from '../../api/client';
import { formatVND } from '../../utils/format';

interface ContractFormValues {
  roomId: number;
  startDate: Dayjs;
  endDate?: Dayjs | null;
  rentPrice: number;
  deposit: number;
  tenantIds: number[];
  primaryTenantId: number;
  selectedServiceIds?: number[];
  serviceQuantities?: Record<number, number | null>;
}

interface Props {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ContractInput) => void;
}

const EMPTY_TENANT_IDS: number[] = [];
const MAX_DB_INT = 2_147_483_647;

const SERVICE_UNIT_LABEL: Record<Service['unit'], string> = {
  PER_ROOM: 'Phòng',
  PER_PERSON: 'Người',
  PER_QUANTITY: 'Số lượng',
};

export function ContractFormModal({ open, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<ContractFormValues>();
  const roomId = Form.useWatch('roomId', form);
  const tenantIds = Form.useWatch('tenantIds', form) ?? EMPTY_TENANT_IDS;
  const selectedServiceIds = Form.useWatch('selectedServiceIds', form) ?? [];

  const roomsQuery = useQuery({
    queryKey: ['rooms', 'VACANT'],
    queryFn: () => roomsApi.list({ status: 'VACANT' }),
    enabled: open,
  });
  const tenantsQuery = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.list(),
    enabled: open,
  });

  const rooms = roomsQuery.data ?? [];
  const tenants = tenantsQuery.data ?? [];
  const selectedRoom = rooms.find((room) => room.id === roomId);
  const servicesQuery = useQuery({
    queryKey: ['services', selectedRoom?.buildingId],
    queryFn: () => servicesApi.list(selectedRoom!.buildingId),
    enabled: open && selectedRoom !== undefined,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ deposit: 0 });
  }, [open, form]);

  useEffect(() => {
    if (!selectedRoom || !servicesQuery.isSuccess) return;
    const activeServices = (servicesQuery.data ?? []).filter((service) => service.isActive);
    form.setFieldsValue({
      selectedServiceIds: activeServices.map((service) => service.id),
      serviceQuantities: Object.fromEntries(
        activeServices.filter((service) => service.unit === 'PER_QUANTITY').map((service) => [service.id, 1]),
      ),
    });
  }, [roomId, selectedRoom?.buildingId, servicesQuery.data, servicesQuery.isSuccess, form]);

  useEffect(() => {
    const primaryTenantId = form.getFieldValue('primaryTenantId');
    if (tenantIds.length === 0) {
      form.setFieldValue('primaryTenantId', undefined);
    } else if (!tenantIds.includes(primaryTenantId)) {
      form.setFieldValue('primaryTenantId', tenantIds[0]);
    }
  }, [tenantIds, form]);

  const handleFinish = (values: ContractFormValues) => {
    const { startDate, endDate, selectedServiceIds: serviceIds = [], serviceQuantities = {}, ...contractValues } = values;
    const services = (servicesQuery.data ?? [])
      .filter((service) => serviceIds.includes(service.id))
      .map((service) => ({
        serviceId: service.id,
        quantity: service.unit === 'PER_QUANTITY' ? (serviceQuantities[service.id] ?? 1) : 1,
      }));

    onSubmit({
      ...contractValues,
      startDate: startDate.format('YYYY-MM-DD'),
      ...(endDate && { endDate: endDate.format('YYYY-MM-DD') }),
      services,
    });
  };

  const selectedTenants = tenants.filter((tenant) => tenantIds.includes(tenant.id));
  const services = (servicesQuery.data ?? []).filter((service) => service.isActive);
  const hasOptionLoadError = roomsQuery.isError || tenantsQuery.isError || servicesQuery.isError;

  return (
    <Modal
      open={open}
      title="Thêm hợp đồng"
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      forceRender
      destroyOnHidden
    >
      {hasOptionLoadError && (
        <Alert
          type="error"
          showIcon
          message={getErrorMessage(roomsQuery.error ?? tenantsQuery.error ?? servicesQuery.error)}
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark="optional"
        initialValues={{ deposit: 0 }}
      >
        <Form.Item name="roomId" label="Phòng trống" rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}>
          <Select
            showSearch
            loading={roomsQuery.isLoading}
            placeholder="Chọn phòng đang trống"
            optionFilterProp="label"
            options={rooms.map((room: Room) => ({
              value: room.id,
              label: `${room.building?.name ?? 'Tòa nhà'} - ${room.name}`,
            }))}
            onChange={(value: number) => {
              const room = rooms.find((item) => item.id === value);
              form.setFieldsValue({
                rentPrice: room?.baseRent,
                selectedServiceIds: [],
                serviceQuantities: {},
              });
            }}
          />
        </Form.Item>

        <Form.Item
          name="tenantIds"
          label="Khách thuê"
          rules={[
            { required: true, type: 'array', min: 1, message: 'Chọn ít nhất một khách thuê' },
            {
              validator: (_, value: number[] | undefined) =>
                value && selectedRoom && value.length > selectedRoom.maxOccupants
                  ? Promise.reject(new Error(`Phòng này chỉ cho phép tối đa ${selectedRoom.maxOccupants} người`))
                  : Promise.resolve(),
            },
          ]}
        >
          <Select
            mode="multiple"
            showSearch
            loading={tenantsQuery.isLoading}
            placeholder="Tìm và chọn khách thuê"
            optionFilterProp="label"
            options={tenants.map((tenant: Tenant) => ({
              value: tenant.id,
              label: `${tenant.fullName} (${tenant.phone})`,
            }))}
          />
        </Form.Item>

        {selectedTenants.length > 0 && (
          <Form.Item
            name="primaryTenantId"
            label="Người đại diện"
            rules={[{ required: true, message: 'Vui lòng chọn người đại diện' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                {selectedTenants.map((tenant) => (
                  <Radio key={tenant.id} value={tenant.id}>
                    {tenant.fullName} ({tenant.phone})
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        )}

        <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}>
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày bắt đầu" />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="Ngày kết thúc"
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value: Dayjs | null | undefined) {
                const startDate = getFieldValue('startDate') as Dayjs | undefined;
                if (!value || !startDate || !value.isBefore(startDate, 'day')) return Promise.resolve();
                return Promise.reject(new Error('Ngày kết thúc phải từ ngày bắt đầu trở đi'));
              },
            }),
          ]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            placeholder="Không bắt buộc"
            disabledDate={(date) => {
              const startDate = form.getFieldValue('startDate');
              return startDate ? date.isBefore(startDate, 'day') : false;
            }}
          />
        </Form.Item>

        <Form.Item
          name="rentPrice"
          label="Giá thuê (đ/tháng)"
          rules={[
            { required: true, message: 'Vui lòng nhập giá thuê' },
            { type: 'number', max: MAX_DB_INT, message: `Giá thuê không được vượt ${formatVND(MAX_DB_INT)}` },
          ]}
        >
          <InputNumber min={0} max={MAX_DB_INT} step={100000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="deposit"
          label="Tiền cọc (đ)"
          rules={[
            { required: true, message: 'Vui lòng nhập tiền cọc' },
            { type: 'number', max: MAX_DB_INT, message: `Tiền cọc không được vượt ${formatVND(MAX_DB_INT)}` },
          ]}
        >
          <InputNumber min={0} max={MAX_DB_INT} step={100000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Dịch vụ">
          {!selectedRoom && <Typography.Text type="secondary">Chọn phòng để xem dịch vụ của tòa nhà.</Typography.Text>}
          {selectedRoom && servicesQuery.isLoading && <Typography.Text type="secondary">Đang tải dịch vụ...</Typography.Text>}
          {selectedRoom && !servicesQuery.isLoading && services.length === 0 && (
            <Typography.Text type="secondary">Tòa nhà chưa có dịch vụ đang hoạt động.</Typography.Text>
          )}
          {services.length > 0 && (
            <Form.Item name="selectedServiceIds" noStyle>
              <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {services.map((service) => (
                  <Checkbox key={service.id} value={service.id}>
                    {service.name} — {formatVND(service.price)}/{SERVICE_UNIT_LABEL[service.unit]}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Form.Item>
          )}
        </Form.Item>

        {services
          .filter((service) => service.unit === 'PER_QUANTITY' && selectedServiceIds.includes(service.id))
          .map((service) => (
            <Form.Item
              key={service.id}
              name={['serviceQuantities', service.id]}
              label={`Số lượng — ${service.name}`}
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
              initialValue={1}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          ))}
      </Form>
    </Modal>
  );
}
