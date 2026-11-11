/** API chỉ số điện nước: xác thực chủ nhà, lọc phòng theo tháng và lưu hàng loạt bằng Prisma. */
import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { currentUser, requireAuth, requireRole } from '../../middlewares/auth';
import { AppError } from '../../utils/app-error';
import { validationError } from '../../utils/api-errors';
import { bulkMeterReadingsSchema, meterReadingsQuerySchema } from './meter-readings.schema';

/**
 * Tạo bộ lọc hợp đồng giao với tháng đã chọn theo giờ Việt Nam.
 * Nhận cả hợp đồng đã kết thúc để tra cứu lịch sử; loại hợp đồng hủy.
 * Khoảng tháng là [đầu tháng, đầu tháng sau); ngày kết thúc hợp đồng được tính bao gồm.
 */
function eligible(value: string) {
  const start = new Date(`${value}-01T00:00:00+07:00`);
  const [year, month] = value.split('-').map(Number);
  const next = new Date(Date.UTC(year, month, 1) - 7 * 60 * 60 * 1000);
  return { status: { in: ['ACTIVE', 'ENDED'] as ('ACTIVE' | 'ENDED')[] }, startDate: { lt: next }, OR: [{ endDate: null }, { endDate: { gte: start } }] };
}
const router = Router();
router.use(requireAuth, requireRole('LANDLORD'));
/** Trả mỗi phòng đủ điều kiện một dòng, kèm bản ghi kỳ này, kỳ trước gần nhất và trạng thái khóa. */
router.get('/', async (req, res) => {
  const parsed = meterReadingsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw validationError(parsed.error.issues, 'Tham số không hợp lệ');
  const { buildingId, period } = parsed.data;
  // Danh tính lấy từ auth, không nhận ownerId do client cung cấp.
  const ownerId = currentUser(req).id;
  if (!await prisma.building.findFirst({ where: { id: buildingId, ownerId } })) throw new AppError(404, 'Không tìm thấy tòa nhà');
  const rooms = await prisma.room.findMany({ where: { buildingId, building: { ownerId }, contracts: { some: eligible(period) } }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
  // Chỉ đọc chỉ số và hóa đơn của các phòng đã được kiểm tra quyền qua tòa nhà.
  res.json(await Promise.all(rooms.map(async (room) => {
    const [current, previous, invoice] = await Promise.all([
      prisma.meterReading.findUnique({ where: { roomId_period: { roomId: room.id, period } } }),
      // YYYY-MM có thứ tự chuỗi trùng thứ tự thời gian, kể cả khi thiếu các kỳ liền kề.
      prisma.meterReading.findFirst({ where: { roomId: room.id, period: { lt: period } }, orderBy: { period: 'desc' } }),
      prisma.invoice.findFirst({ where: { period, contract: { roomId: room.id }, OR: [{ issuedAt: { not: null } }, { status: { in: ['UNPAID', 'PARTIAL', 'PAID'] } }] }, select: { id: true } }),
    ]);
    return { room, current, previous, locked: Boolean(invoice) };
  })));
});
/** Tạo hoặc cập nhật chỉ số theo khóa phòng/kỳ; một dòng lỗi sẽ hủy toàn bộ lô. */
router.put('/bulk', async (req, res) => {
  const parsed = bulkMeterReadingsSchema.safeParse(req.body);
  if (!parsed.success) throw validationError(parsed.error.issues, 'Chỉ số không hợp lệ');
  const { buildingId, period, readings } = parsed.data;
  // Danh tính lấy từ auth, không nhận ownerId do client cung cấp.
  const ownerId = currentUser(req).id;
  // Kiểm tra quyền và hóa đơn trong cùng transaction với các thao tác ghi.
  // Luồng phát hành hóa đơn tương lai cần phối hợp khóa/transaction; hiện chưa retry xung đột.
  await prisma.$transaction(async (tx) => {
    if (!await tx.building.findFirst({ where: { id: buildingId, ownerId } })) throw new AppError(404, 'Không tìm thấy tòa nhà');
    for (const [index, r] of readings.entries()) {
      if (!await tx.room.findFirst({ where: { id: r.roomId, buildingId, building: { ownerId }, contracts: { some: eligible(period) } } })) throw new AppError(400, 'Phòng không hợp lệ', [{ path: ['readings', index, 'roomId'], code: 'INVALID_ROOM', message: 'Phòng không thuộc tòa nhà hoặc không có hợp đồng trong kỳ', roomId: r.roomId }], 'VALIDATION_ERROR');
      // Hóa đơn từng phát hành (issuedAt) hoặc đang thu/đã thu tiền đều khóa chỉnh sửa.
      if (await tx.invoice.findFirst({ where: { period, contract: { roomId: r.roomId }, OR: [{ issuedAt: { not: null } }, { status: { in: ['UNPAID', 'PARTIAL', 'PAID'] } }] } })) throw new AppError(409, 'Kỳ đã phát hành hóa đơn', [{ path: ['readings', index], code: 'PERIOD_LOCKED', message: 'Phòng đã phát hành hóa đơn, không thể sửa chỉ số', roomId: r.roomId }], 'PERIOD_LOCKED');
      // Cập nhật người ghi và thời điểm ghi kể cả khi sửa bản ghi đã có.
      const data = { ...r, period, recordedById: ownerId, recordedAt: new Date() };
      await tx.meterReading.upsert({ where: { roomId_period: { roomId: r.roomId, period } }, create: data, update: data });
    }
  }, { isolationLevel: 'Serializable' });
  res.json({ saved: readings.length });
});
export default router;
