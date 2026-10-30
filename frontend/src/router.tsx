import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import { RequireAuth } from './features/auth/RequireAuth';
import BuildingsPage from './features/buildings/BuildingsPage';
import TenantsPage from './features/tenants/TenantsPage';
import RoomsPage from './features/rooms/RoomsPage';
import ContractsPage from './features/contracts/ContractsPage';
import { AppLayout } from './layouts/AppLayout';
import { landlordNav, tenantNav, type NavItem } from './navigation';
import ComingSoonPage from './pages/ComingSoonPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import TenantHomePage from './pages/TenantHomePage';

import MaintenancePage from './features/portal/MaintenancePage';

// Tự tạo route "Đang phát triển" cho các mục menu chưa làm (có owner trong navigation.tsx)
const comingSoonRoutes = (nav: NavItem[]): RouteObject[] =>
  nav.filter((item) => item.owner).map((item) => ({ path: item.path, element: <ComingSoonPage item={item} /> }));

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Khu vực CHỦ NHÀ
  {
    path: '/',
    element: (
      <RequireAuth role="LANDLORD">
        <AppLayout nav={landlordNav} title="Quản lý nhà trọ" />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'buildings', element: <BuildingsPage /> },
      { path: 'tenants', element: <TenantsPage /> },
      // Thêm trang thật ở đây, VD: { path: 'rooms', element: <RoomsPage /> },
      { path: 'rooms', element: <RoomsPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      // Thêm trang thật ở đây
      ...comingSoonRoutes(landlordNav),
    ],
  },

  // Khu vực KHÁCH THUÊ
  {
    path: '/portal',
    element: (
      <RequireAuth role="TENANT">
        <AppLayout nav={tenantNav} title="Cổng khách thuê" />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <TenantHomePage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      ...comingSoonRoutes(tenantNav),
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
