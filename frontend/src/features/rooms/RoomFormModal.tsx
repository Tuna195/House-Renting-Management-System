import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { Building, Room, RoomInput, RoomStatus } from '../../types';
import { moneyFormatter, moneyParser } from '../../utils/format';
import { ROOM_STATUS_OPTIONS } from '../../utils/status';

export type RoomFormValues = RoomInput & { status?: RoomStatus };

interface Props {
  open: boolean;
  initialValues?: Room; // có = đang sửa, không có = thêm mới
  defaultBuildingId?: number; // tòa nhà đang lọc ở trang danh sách → chọn sẵn khi thêm mới
  buildings: Building[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: RoomFormValues) => void;
}

export function RoomFormModal({ open, initialValues, defaultBuildingId, buildings, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<RoomFormValues>();
  const isEditing = !!initialValues;

  // Mỗi lần mở modal: đổ dữ liệu cũ (khi sửa) hoặc giá trị mặc định (khi thêm)
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(initialValues ?? { buildingId: defaultBuildingId, maxOccupants: 2 });
  }, [open, initialValues, defaultBuildingId, form]);

  return (
    <Modal
      open={open}
      title={isEditing ? 'Sửa phòng' : 'Thêm phòng'}
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
          extra={isEditing ? 'Không thể chuyển phòng sang tòa nhà khác' : undefined}
        >
          <Select
            disabled={isEditing}
            placeholder="Chọn tòa nhà"
            options={buildings.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Form.Item>
        <Form.Item name="name" label="Tên phòng" rules={[{ required: true, message: 'Vui lòng nhập tên phòng' }]}>
          <Input placeholder="VD: P101" />
        </Form.Item>
        <Form.Item name="floor" label="Tầng">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="area" label="Diện tích (m²)">
          <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="baseRent" label="Giá thuê (đ/tháng)" rules={[{ required: true, message: 'Nhập giá thuê' }]}>
          <InputNumber min={0} step={100000} style={{ width: '100%' }} formatter={moneyFormatter} parser={moneyParser} />
        </Form.Item>
        <Form.Item
          name="maxOccupants"
          label="Số người ở tối đa"
          rules={[{ required: true, message: 'Nhập số người tối đa' }]}
        >
          <InputNumber min={1} max={10} style={{ width: '100%' }} />
        </Form.Item>
        {isEditing && (
          <Form.Item
            name="status"
            label="Trạng thái"
            extra={initialValues.status === 'OCCUPIED' ? 'Phòng đang có hợp đồng, trạng thái tự cập nhật theo hợp đồng' : undefined}
          >
            <Select
              disabled={initialValues.status === 'OCCUPIED'}
              // "Đang thuê" do hợp đồng quyết định, không chọn tay được
              options={ROOM_STATUS_OPTIONS.map((o) => ({ ...o, disabled: o.value === 'OCCUPIED' }))}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
