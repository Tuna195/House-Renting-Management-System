import { Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { useEffect } from 'react';
import type { Building, Service, ServiceInput } from '../../types';
import { moneyFormatter, moneyParser } from '../../utils/format';
import { SERVICE_UNIT_OPTIONS } from '../../utils/status';

interface Props {
  open: boolean;
  initialValues?: Service; // có = đang sửa, không có = thêm mới
  defaultBuildingId?: number; // tòa nhà đang chọn ở trang danh sách → chọn sẵn khi thêm mới
  buildings: Building[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ServiceInput) => void;
}

export function ServiceFormModal({
  open,
  initialValues,
  defaultBuildingId,
  buildings,
  submitting,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<ServiceInput>();
  const isEditing = !!initialValues;
  const inUse = (initialValues?._count?.contractServices ?? 0) > 0;

  // Mỗi lần mở modal: đổ dữ liệu cũ (khi sửa) hoặc giá trị mặc định (khi thêm)
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(initialValues ?? { buildingId: defaultBuildingId, unit: 'PER_ROOM', isActive: true });
  }, [open, initialValues, defaultBuildingId, form]);

  return (
    <Modal
      open={open}
      title={isEditing ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark="optional">
        <Form.Item
          name="buildingId"
          label="Tòa nhà"
          rules={[{ required: true, message: 'Vui lòng chọn tòa nhà' }]}
          extra={isEditing ? 'Không thể chuyển dịch vụ sang tòa nhà khác' : undefined}
        >
          <Select
            disabled={isEditing}
            placeholder="Chọn tòa nhà"
            options={buildings.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên dịch vụ"
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên dịch vụ' }]}
        >
          <Input placeholder="VD: Wifi, Rác, Gửi xe máy" maxLength={100} />
        </Form.Item>
        <Form.Item name="price" label="Đơn giá (đ)" rules={[{ required: true, message: 'Nhập đơn giá' }]}>
          <InputNumber min={0} step={10000} style={{ width: '100%' }} formatter={moneyFormatter} parser={moneyParser} />
        </Form.Item>
        <Form.Item
          name="unit"
          label="Cách tính"
          rules={[{ required: true }]}
          extra={inUse ? 'Đổi cách tính sẽ áp dụng cho các hóa đơn tạo sau này' : undefined}
        >
          <Select options={SERVICE_UNIT_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="isActive"
          label="Đang áp dụng"
          valuePropName="checked"
          extra="Tắt để ẩn dịch vụ: không chọn được khi tạo hợp đồng mới, hợp đồng cũ không bị ảnh hưởng"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
