import { Form, Input, Modal, Alert } from 'antd';
import { useEffect } from 'react';
import type { Tenant } from '../../types';

interface Props {
  open: boolean;
  tenant: Tenant | null; // Khách thuê đang được cấp tài khoản
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: { email: string; password: string }) => void;
}

export function CreateAccountModal({ open, tenant, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ email: string; password: string }>();

  // Mỗi lần mở modal: reset form và tự động điền email nếu khách thuê đã có sẵn
  useEffect(() => {
    if (!open) return;
    form.resetFields();

    if (tenant?.email) {
      form.setFieldsValue({ email: tenant.email });
    }
  }, [open, tenant, form]);

  return (
    <Modal
      open={open}
      title={`Cấp tài khoản cho: ${tenant?.fullName ?? ''}`}
      okText="Cấp tài khoản"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      forceRender
    >
      <Alert
        message="Tài khoản này dùng để khách thuê đăng nhập vào cổng thông tin (xem hóa đơn, gửi yêu cầu sửa chữa...)."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark="optional">
        <Form.Item
          name="email"
          label="Email đăng nhập"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input placeholder="VD: khachthue@gmail.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu khởi tạo"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu (ít nhất 6 ký tự)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
