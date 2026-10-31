import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import buildingRoutes from './modules/buildings/buildings.routes';
import tenantRoutes from './modules/tenants/tenants.routes';
import roomRoutes from './modules/rooms/rooms.routes';
import contractRoutes from './modules/contracts/contracts.routes';
import serviceRoutes from './modules/services/services.routes';

import portalRoutes from './modules/portal/portal.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';

// Nơi gắn tất cả các module vào /api. Thêm module mới thì thêm 1 dòng ở đây.
const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

api.use('/auth', authRoutes);
api.use('/buildings', buildingRoutes);
api.use('/tenants', tenantRoutes);
api.use('/rooms', roomRoutes);
api.use('/portal', portalRoutes); // TV4 — Tuần 3 (Cổng khách thuê: Báo sự cố, Tuần 5 thêm HĐ, hóa đơn)
api.use('/notifications', notificationRoutes); // TV4 — Tuần 4 (Hệ thống thông báo dùng chung)
api.use('/maintenance', maintenanceRoutes); // TV4 — Tuần 4 (Quản lý sự cố phía chủ nhà)

// TODO — các module sẽ thêm (xem docs/05-api.md để biết ai phụ trách):
api.use('/services', serviceRoutes);              // TV1 — danh sách dịch vụ cho form hợp đồng
api.use('/contracts', contractRoutes);          // TV2 — Tuần 4
// api.use('/meter-readings', meterReadingRoutes); // TV3 — Tuần 4
// api.use('/invoices', invoiceRoutes);            // TV3 — Tuần 5
// api.use('/payments', paymentRoutes);            // TV2 — Tuần 8 (VietQR + webhook)
// api.use('/push', pushRoutes);                   // TV4 — Tuần 9

export default api;
