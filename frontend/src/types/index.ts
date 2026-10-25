// Kiểu dữ liệu trả về từ API. Giữ KHỚP với backend/prisma/schema.prisma.
// Backend thêm/đổi trường nào thì cập nhật ở đây, TypeScript sẽ chỉ ra mọi chỗ cần sửa.

export type Role = 'LANDLORD' | 'TENANT';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type WaterBillingType = 'PER_M3' | 'PER_PERSON';

export interface Building {
  id: number;
  name: string;
  address: string;
  description: string | null;
  electricityPrice: number;
  waterPrice: number;
  waterBillingType: WaterBillingType;
  invoiceDueDay: number;
  createdAt: string;
  _count?: { rooms: number };
}

// Dữ liệu gửi lên khi tạo/sửa (không có id, createdAt...)
export type BuildingInput = Pick<
  Building,
  'name' | 'address' | 'electricityPrice' | 'waterPrice' | 'waterBillingType' | 'invoiceDueDay'
> & { description?: string };

// -----------------------------------------------------------------------------
// TV4 — SỰ CỐ & CỔNG KHÁCH THUÊ
// -----------------------------------------------------------------------------

export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';

export interface MaintenanceRequest {
  id: number;
  roomId: number;
  createdById: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: MaintenanceStatus;
  createdAt: string;
  resolvedAt: string | null;
  room?: {
    id: number;
    name: string;
    building?: { id: number; name: string; address?: string };
  };
}

export interface CreateMaintenanceInput {
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface ActiveContract {
  id: number;
  roomId: number;
  startDate: string;
  endDate: string | null;
  rentPrice: number;
  status: 'ACTIVE' | 'ENDED' | 'CANCELLED';
  room: {
    id: number;
    name: string;
    floor?: number | null;
    area?: number | null;
    building: {
      id: number;
      name: string;
      address: string;
    };
  };
}


