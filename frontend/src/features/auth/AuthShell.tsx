import { HomeFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import type { ReactNode } from 'react';

// Khung chung cho trang đăng nhập / đăng ký
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: '#f0f5ff' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          <HomeFilled style={{ color: '#1677ff' }} /> Quản lý nhà trọ
        </Typography.Title>
        {children}
      </div>
    </div>
  );
}
