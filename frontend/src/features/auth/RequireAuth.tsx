import { Spin } from 'antd';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../../types';
import { homePathOf, useAuth } from './AuthContext';

// Bảo vệ route: chưa đăng nhập → về /login; sai vai trò → về trang chủ của vai trò đó
export function RequireAuth({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spin size="large" fullscreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user.role !== role) {
    return <Navigate to={homePathOf(user)} replace />;
  }
  return children;
}
