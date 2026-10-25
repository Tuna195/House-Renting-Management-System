# Tuần 3: MVP (1) — Phòng, Khách thuê, Hàm tính tiền, Báo sự cố

**Mục tiêu tuần:** mỗi người hoàn thành **module đầu tiên của mình, đi đủ cả backend lẫn frontend**, theo đúng mẫu `buildings`.
**Trước khi bắt đầu:** `git checkout dev && git pull`, rồi `npm install` và `npm run db:migrate` ở backend.

> 💡 Mẹo cho mọi người: **copy thư mục mẫu rồi đổi tên** trước, sau đó sửa dần. Nhanh và đúng cấu trúc hơn viết từ đầu.
> `backend/src/modules/buildings/` → `modules/rooms/` · `frontend/src/features/buildings/` → `features/rooms/`

---

## 🏠 TV1: Module Phòng (`/rooms`)
**Kết quả cần đạt**
- API `GET /api/rooms?buildingId=&status=`, `GET/POST/PATCH/DELETE /api/rooms/:id` chạy đúng (thêm request mẫu vào `api.http`)
- Trang **Phòng**: chọn tòa nhà để lọc; bảng gồm tên, tầng, diện tích, giá, số người tối đa, **trạng thái (Tag màu)**; thêm, sửa, xóa qua modal
- Chủ nhà B **không** xem hay sửa được phòng của chủ nhà A (thử bằng cách đổi id trong `api.http`)
- Trùng tên phòng trong cùng tòa nhà → báo "Tên phòng đã tồn tại trong tòa nhà này"
- Không xóa được phòng đã từng có hợp đồng

**Cách làm**
1. **Backend** `modules/rooms/`:
   - `rooms.schema.ts`: `buildingId` (số nguyên dương), `name`, `floor?`, `area?`, `baseRent`, `maxOccupants` (1–10); update = `partial()` nhưng **không cho đổi `buildingId`** (`.omit({ buildingId: true })`)
   - `rooms.service.ts`: điểm khác mẫu là phòng **không có `ownerId`**. Kiểm tra quyền **qua tòa nhà**:
     ```ts
     prisma.room.findFirst({ where: { id, building: { ownerId } } })
     ```
     Khi tạo phòng, gọi lại `getBuilding(ownerId, buildingId)` từ `buildings.service.ts` để chắc tòa nhà là của mình
   - Lọc theo query: `req.query.buildingId` là **chuỗi**, phải `Number(...)` (hoặc dùng `z.coerce.number()`). Đừng gán lại `req.query` (Express 5 không cho)
   - Gắn vào `routes.ts`: bỏ comment dòng `rooms`
2. **Frontend**:
   - `types/index.ts`: thêm `RoomStatus`, `Room`, `RoomInput`
   - `api/rooms.ts` (copy `api/buildings.ts`); `list` nhận `params` → `api.get('/rooms', { params })`
   - `features/rooms/RoomsPage.tsx`: `Select` tòa nhà ở `extra` của Card (dữ liệu từ `useQuery(['buildings'])`), `queryKey: ['rooms', buildingId]`
   - `RoomFormModal.tsx`: thêm `Select` tòa nhà (khóa lại khi đang sửa)
   - `router.tsx` thêm route; `navigation.tsx` xóa `owner, week` của mục Phòng
3. Màu trạng thái: Trống `green`, Đang thuê `blue`, Sửa chữa `orange`. Viết thành hằng số trong `src/utils/status.ts` để các trang khác dùng chung

**Gợi ý và bẫy**
- Lỗi trùng tên: kiểm tra trước bằng `findFirst({ where: { buildingId, name } })` để báo câu dễ hiểu (lỗi `P2002` chung chung chỉ ra "Dữ liệu bị trùng")
- Seed có 6 phòng ở "Nhà trọ Bách Khoa" để thử ngay

**Prompt AI:** dùng mẫu số 1 và 2 trong [`07-dung-ai-hieu-qua.md`](../07-dung-ai-hieu-qua.md) (đã viết sẵn cho đúng module Phòng).

**Checklist**
- [ ] 5 API phòng + request mẫu trong `api.http`
- [ ] Trang Phòng có lọc theo tòa nhà
- [ ] Đã thử truy cập phòng của chủ nhà khác → 404
- [ ] `src/utils/status.ts` có màu và nhãn trạng thái phòng
- [ ] PR đã merge

---

## 👤 TV2: Module Khách thuê (`/tenants`) và cấp tài khoản
**Kết quả cần đạt**
- CRUD khách thuê, lọc theo `ownerId`; tìm theo tên hoặc số điện thoại (`?q=`)
- `POST /api/tenants/:id/account` `{ email, password }` → tạo `User` (role `TENANT`) và gắn `tenant.userId`
- Trang **Khách thuê**: bảng (tên, SĐT, quê quán, *Đã có tài khoản* / *Chưa có*), ô tìm kiếm, modal thêm và sửa, nút **"Cấp tài khoản"**
- Khách vừa được cấp tài khoản đăng nhập được, vào thẳng `/portal`

**Cách làm**
1. Backend `modules/tenants/`:
   - Tìm kiếm:
     ```ts
     where: { ownerId, ...(q && { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] }) }
     ```
   - Cấp tài khoản: kiểm tra khách là của mình và `userId` đang `null`, email chưa ai dùng; rồi **trong một transaction**:
     ```ts
     await prisma.$transaction(async (tx) => {
       const user = await tx.user.create({ data: { email, passwordHash, fullName: tenant.fullName, phone: tenant.phone, role: 'TENANT' } });
       await tx.tenant.update({ where: { id: tenant.id }, data: { userId: user.id } });
     });
     ```
     Băm mật khẩu bằng `bcrypt.hash` như `auth.service.ts`
   - Xóa khách: chặn nếu đã có trong hợp đồng (`contracts: { some: {} }`) → 409
2. Frontend: `features/tenants/TenantsPage.tsx`, `TenantFormModal.tsx`, `CreateAccountModal.tsx`. Ô tìm kiếm dùng `Input.Search`, `queryKey: ['tenants', q]`
3. Đăng nhập thử tài khoản khách vừa tạo bằng **cửa sổ ẩn danh** (để không mất phiên chủ nhà)

**Gợi ý và bẫy**
- **Vì sao phải dùng transaction?** Nếu tạo `User` xong mà cập nhật `Tenant` lỗi, sẽ có tài khoản "mồ côi". Câu này rất hay bị hỏi khi vấn đáp
- Số CCCD là dữ liệu nhạy cảm: trên bảng chỉ hiện 4 số cuối (`********1234`), xem chi tiết mới hiện đủ
- Chỉ trả về những trường cần (dùng `select`), không trả `passwordHash` của user gắn kèm

**Checklist**
- [ ] CRUD và tìm kiếm khách thuê
- [ ] Cấp tài khoản (có transaction), đăng nhập thử thành công
- [ ] Khách đăng nhập không gọi được `/api/tenants` (403)
- [ ] PR đã merge

---

## 🧮 TV3: Hàm tính tiền và unit test ⭐
**Kết quả cần đạt**
- Viết xong các hàm `TODO` trong `backend/src/modules/billing/billing.ts`: `calculateElectricityTiered`, `calculateWater`, `prorateRent`
- Thêm hàm tổng hợp **`buildInvoiceItems(input)`** trả về mảng khoản tiền (loại, mô tả, số lượng, đơn giá, thành tiền) cho một hợp đồng trong một kỳ. Tuần 5 sẽ gọi hàm này khi tạo hóa đơn
- Thêm `daysInMonth(period)`, `previousPeriod(period)`, `dueDateOf(period, dueDay)`
- `npm test`: **≥ 20 test, tất cả qua**, gồm 5 ca kiểm thử đã chốt ở Tuần 2 (ca 3.940.000đ phải đúng từng đồng)

**Cách làm**
1. Định nghĩa đầu vào **không phụ thuộc Prisma** (để test dễ):
   ```ts
   export interface InvoiceInput {
     period: string;                    // "2026-10"
     rentPrice: number;
     contractStart: string;             // "2026-10-16" (chuỗi ngày, tránh lỗi múi giờ)
     contractEnd?: string | null;
     occupants: number;
     electricity: { start: number; end: number; price: number };
     water: { type: 'PER_M3' | 'PER_PERSON'; start: number; end: number; price: number };
     services: { name: string; price: number; unit: 'PER_ROOM' | 'PER_PERSON' | 'PER_QUANTITY'; quantity: number }[];
   }
   export interface InvoiceItemDraft { type: 'RENT' | 'ELECTRICITY' | 'WATER' | 'SERVICE'; description: string; quantity: number; unitPrice: number; amount: number }
   ```
2. **TDD (viết test trước):** bỏ `.todo` → viết `expect` với số đã tính tay → chạy `npm run test:watch` (đỏ) → viết hàm đến khi xanh
3. Số ngày ở trong kỳ: lấy giao của `[contractStart, contractEnd]` với `[ngày 1, ngày cuối tháng]`, đếm cả ngày đầu và ngày cuối (theo quyết định Tuần 2)
4. Mô tả khoản phải dễ đọc cho khách: `"Điện: 1250 → 1380 (130 kWh × 3.500đ)"`

**Gợi ý và bẫy**
- ⚠️ **Múi giờ:** `new Date('2026-10-16')` là giờ UTC, ở Việt Nam có thể thành ngày 15 lúc 7h. Làm việc với chuỗi `YYYY-MM-DD` hoặc dùng `Date.UTC(...)`, `getUTCDate()`
- `daysInMonth`: `new Date(Date.UTC(year, month, 0)).getUTCDate()` (tháng tính từ 1)
- Test các biên: 0 kWh; đúng 50 kWh (mốc bậc); tháng 2 năm nhuận; vào ngày 1; ra ngày cuối tháng; vào và ra trong cùng tháng

**Prompt AI:** mẫu số 5 trong [`07-dung-ai-hieu-qua.md`](../07-dung-ai-hieu-qua.md). **Tự tính tay lại kết quả AI đưa ra.**

**Checklist**
- [ ] 3 hàm TODO đã xong
- [ ] `buildInvoiceItems` và các hàm ngày tháng
- [ ] ≥ 20 test qua, có ca 3.940.000đ
- [ ] Giải thích được từng hàm cho nhóm (demo trong buổi họp)
- [ ] PR đã merge

---

## 🔧 TV4: Báo sự cố phía khách thuê (`/portal/maintenance`)
**Kết quả cần đạt**
- `POST /api/portal/maintenance` `{ title, description? }`: phòng **tự lấy từ hợp đồng hiệu lực** của khách đang đăng nhập (không nhận `roomId` từ client)
- `GET /api/portal/maintenance`: danh sách yêu cầu của tôi, mới nhất trước
- Trang **Báo sự cố** trong cổng khách thuê, **thiết kế cho điện thoại**: danh sách dạng thẻ (tiêu đề, ngày gửi, Tag trạng thái); nút "Báo sự cố mới" mở form
- Khách chưa có hợp đồng → báo "Bạn chưa có hợp đồng thuê đang hiệu lực"

**Cách làm**
1. Backend: tạo `modules/portal/` với `portal.routes.ts` dùng `router.use(requireAuth, requireRole('TENANT'))`. Đây là nơi chứa **mọi API của khách thuê** (Tuần 5 thêm hóa đơn, hợp đồng)
2. Hàm dùng chung, quan trọng nhất của module (Tuần 5 dùng lại):
   ```ts
   export async function getActiveContractOfUser(userId: number) {
     const contract = await prisma.contract.findFirst({
       where: { status: 'ACTIVE', tenants: { some: { tenant: { userId } } } },
       include: { room: { include: { building: true } } },
     });
     if (!contract) throw new AppError(400, 'Bạn chưa có hợp đồng thuê đang hiệu lực');
     return contract;
   }
   ```
3. Frontend: `api/portal.ts`, `features/portal/MaintenancePage.tsx`, dùng `List` hoặc `Card` (không dùng `Table`); form trong `Drawer placement="bottom"` hoặc `Modal`
4. Thử bằng tài khoản khách demo (seed đã có hợp đồng phòng P101). Mở DevTools → **Toggle device toolbar** → iPhone 12

**Gợi ý và bẫy**
- **Không bao giờ tin `roomId` hay `userId` gửi từ client** ở API khách thuê, luôn lấy từ `req.user`
- Màu trạng thái sự cố thêm vào `src/utils/status.ts` (TV1 tạo file này; nếu chưa có thì bạn tạo trước, báo TV1)
- Ảnh đính kèm (chụp chỗ hỏng) là 🟢, để sau

**Checklist**
- [x] 2 API portal, khách không có hợp đồng thì báo lỗi rõ ràng
- [x] Trang Báo sự cố dùng tốt trên khổ điện thoại
- [x] `getActiveContractOfUser` để dùng chung
- [ ] PR đã merge (sẵn sàng tạo PR)

---

## ✅ Cuối tuần: kiểm tra chung
- [ ] 4 PR đã merge vào `dev`, kéo về chạy chung không lỗi
- [ ] Menu không còn "Đang phát triển" ở: Phòng, Khách thuê, Báo sự cố
- [ ] Buổi họp: mỗi người **demo 3 phút và giải thích luồng code** của mình
- [ ] Đã cập nhật trạng thái trong [`05-api.md`](../05-api.md)
