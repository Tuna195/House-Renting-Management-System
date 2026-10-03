import { Alert, Card, Typography } from 'antd';
import { useAuth } from '../features/auth/AuthContext';

// TODO(TV4 — Tuần 5): hiện phòng đang thuê, hóa đơn mới nhất và nút "Thanh toán". Xem docs/ke-hoach/tuan-05.md
export default function TenantHomePage() {
  const { user } = useAuth();
  return (
    <Card>
      <Typography.Title level={4}>Xin chào, {user?.fullName}</Typography.Title>
      <Alert type="info" showIcon message="Cổng khách thuê đang được phát triển (TV4)." />
    </Card>
  );
}
