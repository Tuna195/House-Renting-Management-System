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

<<<<<<< HEAD
// TODO: thêm Room, Tenant, Contract, MeterReading, Invoice... khi làm các module tương ứng

export type Tenant = {
  id: number;
  ownerId: number;
  userId: number | null;
  fullName: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  dateOfBirth: string | null; // Trả về từ API thường là string ISO
  hometown: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

// Dữ liệu gửi lên khi tạo/sửa (không có id, ownerId, userId, createdAt...)
export type TenantInput = Pick<Tenant, 'fullName' | 'phone'> & {
  email?: string | null;
  idNumber?: string | null;
  dateOfBirth?: string | null;
  hometown?: string | null;
  note?: string | null;
};
export type RoomStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';

export interface Room {
  id: number;
  buildingId: number;
  name: string;
  floor: number | null;
  area: number | null;
  baseRent: number;
  maxOccupants: number;
  status: RoomStatus;
  createdAt: string;
  building?: Pick<Building, 'id' | 'name'>;
}

export type RoomInput = Pick<Room, 'buildingId' | 'name' | 'baseRent' | 'maxOccupants'> & {
  floor?: number | null;
  area?: number | null;
};

// Khi sửa: không đổi được tòa nhà; trạng thái chỉ đổi tay giữa Trống ↔ Sửa chữa
export type RoomUpdateInput = Partial<Omit<RoomInput, 'buildingId'>> & { status?: Exclude<RoomStatus, 'OCCUPIED'> };

// TODO: thêm Tenant, Contract, MeterReading, Invoice... khi làm các module tương ứng
=======
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


>>>>>>> feature/portal-maintenance
