import { App, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { homePathOf, useAuth } from './AuthContext';
import { AuthShell } from './AuthShell';

interface RegisterValues {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirm: string;
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homePathOf(user)} replace />;

  const onFinish = async ({ confirm: _confirm, ...values }: RegisterValues) => {
    setSubmitting(true);
    try {
      await register(values);
      message.success('Đăng ký thành công');
      navigate('/', { replace: true });
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <Card title="Đăng ký tài khoản chủ nhà">
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Nhập lại mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu' },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue('password') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Mật khẩu nhập lại không khớp')),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Đăng ký
          </Button>
        </Form>
        <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </Typography.Paragraph>
      </Card>
    </AuthShell>
  );
}
