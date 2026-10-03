import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../../api/auth';
import { TOKEN_KEY } from '../../api/client';
import type { User } from '../../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean; // đang kiểm tra token lúc mở trang
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Bọc toàn bộ app để mọi component đều biết "ai đang đăng nhập"
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Mở trang mà đã có token → hỏi backend xem token còn hợp lệ không
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    return result.user;
  };

  const register: AuthContextValue['register'] = async (data) => {
    const result = await authApi.register(data);
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    queryClient.clear(); // xóa dữ liệu đã cache của người dùng cũ
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}

/** Trang chủ tương ứng với từng vai trò */
export const homePathOf = (user: User) => (user.role === 'LANDLORD' ? '/' : '/portal');
