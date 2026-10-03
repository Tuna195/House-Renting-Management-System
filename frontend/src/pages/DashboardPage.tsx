import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { buildingsApi } from '../api/buildings';
import { useAuth } from '../features/auth/AuthContext';

// TODO(TV1 — Tuần 6): thay các số "—" bằng API thống kê thật (GET /api/dashboard/summary)
// và thêm biểu đồ doanh thu 6 tháng (Tuần 10). Xem docs/ke-hoach/tuan-06.md
export default function DashboardPage() {
  const { user } = useAuth();
  const { data: buildings = [] } = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });
  const totalRooms = buildings.reduce((sum, b) => sum + (b._count?.rooms ?? 0), 0);

  return (
    <>
      <Typography.Title level={4}>Xin chào, {user?.fullName}</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Tòa nhà" value={buildings.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Tổng số phòng" value={totalRooms} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Phòng trống" value="—" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Chưa thu tháng này" value="—" />
          </Card>
        </Col>
      </Row>
    </>
  );
}
