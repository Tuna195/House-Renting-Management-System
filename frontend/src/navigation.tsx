// Danh sách menu của từng vai trò + ai phụ trách trang đó.
// Trang nào chưa làm (`owner` có giá trị) sẽ hiện màn hình "Đang phát triển" chỉ rõ người phụ trách và tuần làm.
// Làm xong trang nào: thêm route thật trong router.tsx rồi XÓA owner/week ở đây.
import {
  AlertOutlined,
  AppstoreOutlined,
  BankOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  HomeOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  owner?: string;
  week?: number;
}

export const landlordNav: NavItem[] = [
  { path: '/', label: 'Tổng quan', icon: <DashboardOutlined /> },
  { path: '/buildings', label: 'Tòa nhà', icon: <BankOutlined /> },
  { path: '/rooms', label: 'Phòng', icon: <HomeOutlined /> },
  { path: '/services', label: 'Dịch vụ', icon: <AppstoreOutlined />, owner: 'TV1', week: 4 },
  { path: '/tenants', label: 'Khách thuê', icon: <TeamOutlined /> },
  { path: '/contracts', label: 'Hợp đồng', icon: <FileDoneOutlined /> },
  { path: '/meter-readings', label: 'Chỉ số điện nước', icon: <ThunderboltOutlined />, owner: 'TV3', week: 4 },
  { path: '/invoices', label: 'Hóa đơn', icon: <FileTextOutlined />, owner: 'TV3', week: 5 },
  { path: '/maintenance', label: 'Sự cố', icon: <ToolOutlined />, owner: 'TV4', week: 4 },
];

export const tenantNav: NavItem[] = [
  { path: '/portal', label: 'Trang chủ', icon: <HomeOutlined /> },
  { path: '/portal/invoices', label: 'Hóa đơn', icon: <FileTextOutlined />, owner: 'TV4', week: 5 },
  { path: '/portal/contract', label: 'Hợp đồng', icon: <FileDoneOutlined />, owner: 'TV4', week: 5 },
  { path: '/portal/maintenance', label: 'Báo sự cố', icon: <AlertOutlined /> },
];
