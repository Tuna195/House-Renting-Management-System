# Tuần 4: MVP (2) — Dịch vụ, Hợp đồng, Chỉ số điện nước, Xử lý sự cố, Thông báo

**Mục tiêu tuần:** đủ dữ liệu đầu vào để Tuần 5 tạo được hóa đơn: hợp đồng (ai ở, dùng dịch vụ gì) và chỉ số điện nước.

---

## 🏠 TV1: Module Dịch vụ và trang Chi tiết phòng
**Kết quả cần đạt**
- CRUD `/api/services?buildingId=`: tên, giá, đơn vị tính (`PER_ROOM` / `PER_PERSON` / `PER_QUANTITY`), bật hoặc tắt (`isActive`)
- Trang **Dịch vụ**: chọn tòa nhà, bảng dịch vụ, modal thêm và sửa; đơn vị hiển thị tiếng Việt: "/phòng", "/người", "/xe (số lượng)"
- Trang **Chi tiết phòng** `/rooms/:id` (bấm tên phòng ở bảng Phòng để mở): thông tin phòng (`Descriptions`), **hợp đồng hiện tại** (người ở, giá, ngày bắt đầu), **6 kỳ chỉ số gần nhất**

**Cách làm**
1. Services làm y hệt Rooms (kiểm tra quyền qua `building: { ownerId }`). Xóa dịch vụ đã dùng trong hợp đồng → **không xóa, chuyển `isActive = false`** (giải thích vì sao khi vấn đáp: giữ đúng hóa đơn cũ)
2. `GET /api/rooms/:id` mở rộng `include`:
   ```ts
   include: {
     building: true,
     contracts: { where: { status: 'ACTIVE' }, include: { tenants: { include: { tenant: true } } } },
     meterReadings: { orderBy: { period: 'desc' }, take: 6 },
   }
   ```
3. Frontend: route `rooms/:id` → `RoomDetailPage.tsx`, đọc id bằng `useParams()`; dùng `Descriptions`, `Table` nhỏ cho chỉ số, `Empty` khi chưa có hợp đồng

**Checklist**
- [ ] CRUD dịch vụ, ẩn thay vì xóa khi đã dùng
- [ ] Trang chi tiết phòng có hợp đồng hiện tại và lịch sử chỉ số
- [ ] PR đã merge

---

## 📄 TV2: Module Hợp đồng ⭐ (`/contracts`)
**Kết quả cần đạt**
- `POST /api/contracts`: tạo hợp đồng với phòng, ngày bắt đầu, ngày kết thúc (tùy chọn), giá thuê, tiền cọc, **danh sách người ở (chọn 1 người đại diện)**, **dịch vụ kèm số lượng**
- Quy tắc (sai thì 400 hoặc 409 kèm câu dễ hiểu):
  - Phòng phải của mình và **không có hợp đồng ACTIVE khác**
  - Số người ≤ `room.maxOccupants`; mọi khách phải là khách của mình; dịch vụ phải thuộc tòa nhà của phòng
- Tạo xong thì phòng chuyển `OCCUPIED`; `POST /api/contracts/:id/end` `{ endDate }` → hợp đồng `ENDED`, phòng về `VACANT`
- Trang **Hợp đồng**: bảng (phòng, người đại diện, giá, ngày bắt đầu, trạng thái), lọc theo trạng thái; modal tạo hợp đồng; nút "Kết thúc" có xác nhận
- Mặc định `rentPrice` điền sẵn bằng `room.baseRent`; dịch vụ của tòa nhà được tick sẵn

**Cách làm**
1. Schema zod:
   ```ts
   z.object({
     roomId: z.number().int().positive(),
     startDate: z.coerce.date(),
     endDate: z.coerce.date().optional(),
     rentPrice: z.number().int().nonnegative(),
     deposit: z.number().int().nonnegative().default(0),
     tenantIds: z.array(z.number().int().positive()).min(1, 'Cần ít nhất 1 người ở'),
     primaryTenantId: z.number().int().positive(),
     services: z.array(z.object({ serviceId: z.number().int(), quantity: z.number().int().min(1) })).default([]),
   }).refine((d) => d.tenantIds.includes(d.primaryTenantId), { message: 'Người đại diện phải nằm trong danh sách người ở', path: ['primaryTenantId'] })
   ```
2. Tạo hợp đồng **trong transaction**: kiểm tra lại "phòng chưa có hợp đồng ACTIVE" **bên trong** transaction → `tx.contract.create({ data: { ..., tenants: { create: [...] }, services: { create: [...] } } })` → `tx.room.update({ status: 'OCCUPIED' })`
3. Frontend `ContractFormModal`: `Select` phòng (chỉ phòng `VACANT`), `Select mode="multiple" showSearch` khách thuê, `Radio` chọn người đại diện, `DatePicker`, danh sách dịch vụ có `Checkbox` và `InputNumber` số lượng (chỉ hiện ô số lượng với `PER_QUANTITY`)
4. Ngày từ `DatePicker` là `dayjs` → gửi lên bằng `value.format('YYYY-MM-DD')`

**Gợi ý và bẫy**
- **Câu vấn đáp chắc chắn có:** "Hai người cùng bấm tạo hợp đồng cho một phòng cùng lúc thì sao?" Transaction và kiểm tra lại bên trong giúp giảm rủi ro. Điểm cộng nếu biết thêm **partial unique index** trong PostgreSQL (`CREATE UNIQUE INDEX ... ON "Contract"("roomId") WHERE status = 'ACTIVE'`, thêm bằng migration SQL tay)
- Seed đã có hợp đồng ACTIVE ở P101, thử tạo thêm cho P101 phải bị chặn

**Checklist**
- [ ] Tạo hợp đồng đủ quy tắc, có transaction
- [ ] Kết thúc hợp đồng, trạng thái phòng cập nhật
- [ ] Trang Hợp đồng và modal tạo
- [ ] PR đã merge

---

## ⚡ TV3: Chỉ số điện nước (`/meter-readings`)
**Kết quả cần đạt**
- `GET /api/meter-readings?buildingId=&period=` → mỗi **phòng đang có hợp đồng** một dòng: thông tin phòng, chỉ số kỳ này (nếu đã nhập), **chỉ số cũ gợi ý** (= chỉ số mới của kỳ gần nhất trước đó)
- `PUT /api/meter-readings/bulk` `{ buildingId, period, readings: [{ roomId, electricStart, electricEnd, waterStart, waterEnd }] }` → lưu tất cả (tạo mới hoặc cập nhật)
- Trang **Chỉ số điện nước**: chọn tòa nhà và tháng; bảng nhập nhanh (cột: phòng, điện cũ, **điện mới**, tiêu thụ, nước cũ, **nước mới**, tiêu thụ); nút "Lưu tất cả"
- Chỉ số mới < cũ → ô đỏ, không cho lưu; tiêu thụ bất thường (0, hoặc gấp đôi kỳ trước) → cảnh báo vàng

**Cách làm**
1. Chỉ số cũ gợi ý:
   ```ts
   prisma.meterReading.findFirst({ where: { roomId, period: { lt: period } }, orderBy: { period: 'desc' } })
   ```
   (so sánh chuỗi `"2026-09" < "2026-10"` đúng vì cùng định dạng)
2. Lưu hàng loạt: `prisma.$transaction(readings.map((r) => prisma.meterReading.upsert({ where: { roomId_period: { roomId: r.roomId, period } }, create: {...}, update: {...} })))`. Kiểm tra quyền: mọi `roomId` phải thuộc `buildingId` của mình
3. **Không cho sửa** chỉ số của kỳ đã có hóa đơn phát hành (Tuần 6 mới có, nhưng viết sẵn điều kiện) → 409
4. Dùng lại `calculateUsage` trong `billing.ts` để kiểm tra
5. Frontend: `DatePicker picker="month"` → `format('YYYY-MM')`; bảng giữ dữ liệu sửa trong `useState`, tiêu thụ tính ngay khi gõ

**Gợi ý:** phím **Tab** nhảy ô, **Enter** sang dòng dưới giúp nhập 20 phòng rất nhanh. Chủ nhà sẽ thích điều này.

**Checklist**
- [ ] 2 API, có kiểm tra quyền và chỉ số hợp lệ
- [ ] Trang nhập nhanh, chỉ số cũ tự điền, tiêu thụ tính ngay
- [ ] Cảnh báo chỉ số bất thường
- [ ] PR đã merge

---

## 🔔 TV4: Xử lý sự cố phía chủ nhà và Thông báo ⭐ (dùng chung cho cả nhóm)
**Kết quả cần đạt**
- `GET /api/maintenance?status=` (mọi yêu cầu ở tòa nhà của mình) và `PATCH /api/maintenance/:id` `{ status }`
- Chuyển trạng thái hợp lệ: `OPEN → IN_PROGRESS → DONE`, `OPEN/IN_PROGRESS → REJECTED`. Chuyển sang `DONE` thì ghi `resolvedAt`
- **Module Thông báo** với hàm dùng chung:
  ```ts
  // modules/notifications/notifications.service.ts
  export async function notify(userId: number, data: { title: string; body: string; link?: string }) { ... }
  ```
  Tuần 9 hàm này sẽ gửi thêm Web Push và Socket.IO, **mọi người chỉ cần gọi `notify()`**
- `GET /api/notifications` (20 cái mới nhất và `unreadCount`), `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`
- **Chuông thông báo** ở header (cả chủ nhà và khách): `Badge` số chưa đọc, bấm mở danh sách, bấm một thông báo → đánh dấu đã đọc và đi tới `link`
- Đổi trạng thái sự cố → khách nhận thông báo "Yêu cầu *Hỏng vòi nước* đang được xử lý"

**Cách làm**
1. Trạng thái hợp lệ viết thành bảng:
   ```ts
   const NEXT: Record<MaintenanceStatus, MaintenanceStatus[]> = { OPEN: ['IN_PROGRESS', 'REJECTED'], IN_PROGRESS: ['DONE', 'REJECTED'], DONE: [], REJECTED: [] };
   ```
2. Chuông: component `src/components/NotificationBell.tsx` đặt trong `AppLayout.tsx`; `useQuery({ queryKey: ['notifications'], refetchInterval: 30_000 })`, tự hỏi lại mỗi 30 giây (Tuần 10 thay bằng realtime)
3. Trang **Sự cố** chủ nhà: `Tabs` theo trạng thái, mỗi dòng có nút chuyển trạng thái phù hợp

**Checklist**
- [ ] API sự cố phía chủ nhà, kiểm tra chuyển trạng thái
- [ ] `notify()` và API thông báo
- [ ] Chuông thông báo ở cả 2 giao diện
- [ ] Đã báo cả nhóm cách dùng `notify()`
- [ ] PR đã merge

---

## ✅ Cuối tuần: kiểm tra chung
- [ ] Tạo được hợp đồng mới cho một phòng trống, ghi chỉ số cho phòng đó
- [ ] Khách gửi sự cố → chủ nhà xử lý → khách thấy thông báo ở chuông
- [ ] Ghép thử: TV1 hiển thị hợp đồng (của TV2) trên trang chi tiết phòng
