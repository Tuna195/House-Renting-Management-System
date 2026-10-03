import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { homePathOf, useAuth } from './AuthContext';
import { AuthShell } from './AuthShell';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homePathOf(user)} replace />;

  const onFinish = async (values: { email: string; password: string }) => {
    setSubmitting(true);
    try {
      const loggedIn = await login(values.email, values.password);
      message.success(`Xin chào ${loggedIn.fullName}`);
      navigate(homePathOf(loggedIn), { replace: true });
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <Card title="Đăng nhập">
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input prefix={<MailOutlined />} placeholder="email@vidu.com" autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Đăng nhập
          </Button>
        </Form>
        <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Chủ nhà chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          <br />
          Khách thuê: dùng tài khoản do chủ nhà cấp.
        </Typography.Paragraph>
      </Card>
    </AuthShell>
  );
}
