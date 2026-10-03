import axios from 'axios';

export const TOKEN_KEY = 'token';

// Mọi lời gọi API đều đi qua `api` này.
// Khi dev: dùng '/api' (Vite proxy sang backend). Khi deploy: đặt VITE_API_URL = địa chỉ backend thật + '/api'
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

// Tự gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token hết hạn → xóa và quay về trang đăng nhập
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Lấy câu thông báo lỗi tiếng Việt từ backend để hiển thị
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Không kết nối được máy chủ';
  }
  return 'Đã có lỗi xảy ra';
}
