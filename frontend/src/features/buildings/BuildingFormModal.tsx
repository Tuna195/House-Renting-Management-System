import { Form, Input, InputNumber, Modal, Radio } from 'antd';
import { useEffect } from 'react';
import type { Building, BuildingInput } from '../../types';
import { moneyFormatter, moneyParser } from '../../utils/format';

interface Props {
  open: boolean;
  initialValues?: Building; // có = đang sửa, không có = thêm mới
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: BuildingInput) => void;
}

export function BuildingFormModal({ open, initialValues, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<BuildingInput>();

  // Mỗi lần mở modal: đổ dữ liệu cũ (khi sửa) hoặc giá trị mặc định (khi thêm)
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      initialValues
        ? { ...initialValues, description: initialValues.description ?? undefined }
        : { waterBillingType: 'PER_M3', invoiceDueDay: 5 },
    );
  }, [open, initialValues, form]);

  return (
    <Modal
      open={open}
      title={initialValues ? 'Sửa tòa nhà' : 'Thêm tòa nhà'}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark="optional">
        <Form.Item name="name" label="Tên tòa nhà" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
          <Input placeholder="VD: Nhà trọ Bách Khoa" />
        </Form.Item>
        <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="electricityPrice" label="Giá điện (đ/kWh)" rules={[{ required: true, message: 'Nhập giá điện' }]}>
          <InputNumber min={0} step={100} style={{ width: '100%' }} formatter={moneyFormatter} parser={moneyParser} />
        </Form.Item>
        <Form.Item name="waterBillingType" label="Cách tính tiền nước">
          <Radio.Group
            options={[
              { label: 'Theo số khối (m³)', value: 'PER_M3' },
              { label: 'Theo đầu người', value: 'PER_PERSON' },
            ]}
          />
        </Form.Item>
        <Form.Item name="waterPrice" label="Giá nước (đ)" rules={[{ required: true, message: 'Nhập giá nước' }]}>
          <InputNumber min={0} step={1000} style={{ width: '100%' }} formatter={moneyFormatter} parser={moneyParser} />
        </Form.Item>
        <Form.Item name="invoiceDueDay" label="Hạn đóng tiền (ngày trong tháng)">
          <InputNumber min={1} max={28} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
