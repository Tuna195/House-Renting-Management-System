import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import buildingRoutes from './modules/buildings/buildings.routes';
import tenantRoutes from './modules/tenants/tenants.routes';
import roomRoutes from './modules/rooms/rooms.routes';

// Nơi gắn tất cả các module vào /api. Thêm module mới thì thêm 1 dòng ở đây.
const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

api.use('/auth', authRoutes);
api.use('/buildings', buildingRoutes);
api.use('/tenants', tenantRoutes);
api.use('/rooms', roomRoutes);

// TODO — các module sẽ thêm (xem docs/05-api.md để biết ai phụ trách):
// api.use('/services', serviceRoutes);            // TV1 — Tuần 4
// api.use('/contracts', contractRoutes);          // TV2 — Tuần 4
// api.use('/meter-readings', meterReadingRoutes); // TV3 — Tuần 4
// api.use('/invoices', invoiceRoutes);            // TV3 — Tuần 5
// api.use('/maintenance', maintenanceRoutes);     // TV4 — Tuần 3
// api.use('/portal', portalRoutes);               // TV4 — Tuần 5 (API cho khách thuê)
// api.use('/payments', paymentRoutes);            // TV2 — Tuần 8 (VietQR + webhook)
// api.use('/push', pushRoutes);                   // TV4 — Tuần 9

export default api;
