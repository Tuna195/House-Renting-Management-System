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

export type ServiceUnit = 'PER_ROOM' | 'PER_PERSON' | 'PER_QUANTITY';

export interface Service {
  id: number;
  buildingId: number;
  name: string;
  price: number;
  unit: ServiceUnit;
  isActive: boolean;
  createdAt: string;
  _count?: { contractServices: number }; // số hợp đồng đang dùng dịch vụ này
}

export type ServiceInput = Pick<Service, 'buildingId' | 'name' | 'price' | 'unit'> & { isActive?: boolean };

// Khi sửa: không đổi được tòa nhà
export type ServiceUpdateInput = Partial<Omit<ServiceInput, 'buildingId'>>;

/** Kết quả DELETE /services/:id khi dịch vụ đã dùng → chỉ ẩn, không xóa */
export interface ServiceArchivedResult {
  archived: true;
  service: Service;
}

export type ContractStatus = 'ACTIVE' | 'ENDED' | 'CANCELLED';

export interface ContractTenant {
  tenantId: number;
  isPrimary: boolean;
  tenant?: Pick<Tenant, 'id' | 'fullName' | 'phone'>;
}

export interface ContractService {
  serviceId: number;
  quantity: number;
  service?: Service;
}

export interface Contract {
  id: number;
  roomId: number;
  startDate: string;
  endDate: string | null;
  rentPrice: number;
  deposit: number;
  status: ContractStatus;
  room?: Pick<Room, 'id' | 'name'> & { building?: Pick<Building, 'id' | 'name'> };
  tenants?: ContractTenant[];
  services?: ContractService[];
}

export interface MeterReading {
  id: number;
  roomId: number;
  period: string; // "YYYY-MM"
  electricStart: number;
  electricEnd: number;
  waterStart: number;
  waterEnd: number;
  recordedAt: string;
  note: string | null;
}

/** GET /rooms/:id — phòng kèm hợp đồng đang hiệu lực và 6 kỳ chỉ số gần nhất */
export interface RoomDetail extends Omit<Room, 'building'> {
  building: Pick<Building, 'id' | 'name' | 'address'>;
  currentContract: Contract | null;
  meterReadings: MeterReading[];
  _count: { contracts: number };
}

// -----------------------------------------------------------------------------
// TV4 — SỰ CỐ & CỔNG KHÁCH THUÊ
// -----------------------------------------------------------------------------

export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';

export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export interface InvoiceItemRow {
  id: number;
  type: 'RENT' | 'ELECTRICITY' | 'WATER' | 'SERVICE' | 'OTHER' | 'DISCOUNT';
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceSummary {
  id: number;
  contractId: number;
  period: string;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  building: { id: number; name: string };
  room: { id: number; name: string };
  primaryTenant: { id: number; fullName: string } | null;
}

export interface InvoiceDetail extends InvoiceSummary {
  issuedAt: string | null;
  paymentCode: string;
  note: string | null;
  items: InvoiceItemRow[];
  payments: {
    id: number;
    amount: number;
    method: 'CASH' | 'BANK_TRANSFER' | 'VIETQR';
    paidAt: string;
    note: string | null;
  }[];
}

interface InvoiceContractReference {
  roomId: number;
  roomName: string;
  contractId: number;
}

export type InvoiceSkipReason = 'ALREADY_EXISTS' | 'MULTIPLE_CONTRACTS' | 'PARTIAL_PERIOD';

export interface InvoiceGenerationResult {
  created: number;
  skipped: (InvoiceContractReference & { reason: InvoiceSkipReason })[];
  missingReadings: InvoiceContractReference[];
}

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
  createdBy?: {
    id: number;
    fullName: string;
    phone?: string;
    email?: string;
  };
}

export interface CreateMaintenanceInput {
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
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
