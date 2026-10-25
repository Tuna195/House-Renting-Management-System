import { DatePicker, Form, Input, Modal } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import type { Tenant, TenantInput } from '../../types';

type TenantFormValues = Omit<TenantInput, 'dateOfBirth'> & { dateOfBirth?: Dayjs | null };

interface Props {
  open: boolean;
  initialValues?: Tenant; // có = đang sửa, không có = thêm mới
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: TenantInput) => void;
}

export function TenantFormModal({ open, initialValues, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<TenantFormValues>();

  useEffect(() => {
    if (!open) return;
    form.resetFields();

    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        dateOfBirth: initialValues.dateOfBirth ? dayjs(initialValues.dateOfBirth) : undefined,
        email: initialValues.email ?? undefined,
        idNumber: initialValues.idNumber ?? undefined,
        hometown: initialValues.hometown ?? undefined,
        note: initialValues.note ?? undefined,
      });
    }
  }, [open, initialValues, form]);

  const handleFinish = (values: TenantFormValues) => {
    const { dateOfBirth, ...tenantValues } = values;
    onSubmit({
      ...tenantValues,
      dateOfBirth: dateOfBirth?.format('YYYY-MM-DD') ?? null,
    });
  };

  return (
    <Modal
      open={open}
      title={initialValues ? 'Sửa khách thuê' : 'Thêm khách thuê'}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[
            { required: true, message: 'Vui lòng nhập họ tên' },
            { min: 5, message: 'Họ tên cần ít nhất 5 ký tự' },
          ]}
        >
          <Input placeholder="VD: Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: 'Vui lòng nhập SĐT' },
            { pattern: /^[0-9+]{9,11}$/, message: 'SĐT không hợp lệ' },
          ]}
        >
          <Input placeholder="VD: 0987654321" />
        </Form.Item>

        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
          <Input placeholder="VD: email@gmail.com" />
        </Form.Item>

        <Form.Item name="idNumber" label="Số CCCD/CMND">
          <Input placeholder="VD: 001201012345" />
        </Form.Item>

        <Form.Item name="dateOfBirth" label="Ngày sinh">
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày" />
        </Form.Item>

        <Form.Item name="hometown" label="Quê quán">
          <Input placeholder="VD: Hà Nội" />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} placeholder="Thông tin thêm..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
