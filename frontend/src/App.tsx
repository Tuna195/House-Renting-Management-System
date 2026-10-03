import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { router } from './router';

dayjs.locale('vi');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// Thứ tự bọc: React Query → giao diện Ant Design (tiếng Việt) → đăng nhập → các trang
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1677ff', borderRadius: 8 } }}>
        <AntApp>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
