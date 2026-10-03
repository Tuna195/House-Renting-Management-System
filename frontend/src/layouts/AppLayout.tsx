import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Grid, Layout, Menu, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import type { NavItem } from '../navigation';

// Khung giao diện dùng chung cho chủ nhà và khách thuê: menu trái + header + nội dung
export function AppLayout({ nav, title }: { nav: NavItem[]; title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screens = Grid.useBreakpoint();

  // Mục menu đang chọn = mục có path dài nhất khớp với URL hiện tại
  const selected = [...nav].sort((a, b) => b.path.length - a.path.length).find((i) => pathname.startsWith(i.path));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider breakpoint="lg" collapsedWidth={0} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <Typography.Title level={5} style={{ padding: '20px 24px 8px', margin: 0 }}>
          {title}
        </Typography.Title>
        <Menu
          mode="inline"
          selectedKeys={selected ? [selected.path] : []}
          items={nav.map((item) => ({ key: item.path, icon: item.icon, label: item.label }))}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
        >
          <Dropdown
            menu={{
              items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: logout }],
            }}
          >
            <Button type="text">
              <Avatar size="small" icon={<UserOutlined />} /> {screens.sm && user?.fullName}
            </Button>
          </Dropdown>
        </Layout.Header>
        <Layout.Content style={{ padding: screens.md ? 24 : 12 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
