# Tuần 5: MVP (3) — Tạo hóa đơn, Cổng khách thuê, Sơ đồ phòng

**Mục tiêu tuần:** từ hợp đồng và chỉ số → **hóa đơn**, khách thuê nhìn thấy được trên điện thoại.

> 🤝 **Phối hợp TV3 và TV4:** TV3 tạo `frontend/src/components/InvoiceStatusTag.tsx` và `InvoiceItemsTable.tsx` (bảng các khoản), TV4 **dùng lại** ở cổng khách thuê. Thống nhất props trong ngày đầu tuần.

---

## 🧾 TV3: Tạo hóa đơn hàng loạt ⭐ (`/invoices`)
**Kết quả cần đạt**
- `POST /api/invoices/generate` `{ buildingId, period }`: với mỗi hợp đồng ACTIVE trong tòa nhà (hoặc kết thúc trong kỳ) → tạo **hóa đơn nháp** (`DRAFT`) gồm các khoản từ `buildInvoiceItems()`
- Trả về `{ created: số_hóa_đơn, skipped: [phòng đã có hóa đơn kỳ này], missingReadings: [phòng chưa nhập chỉ số] }`
- **Chạy 2 lần không tạo trùng** (đã có `@@unique([contractId, period])`)
- `GET /api/invoices?buildingId=&period=&status=` và `GET /api/invoices/:id` (kèm khoản, thanh toán, phòng, người đại diện)
- Trang **Hóa đơn**: lọc theo tòa nhà, kỳ, trạng thái; nút **"Tạo hóa đơn kỳ này"** → hiện kết quả (đã tạo, bỏ qua, thiếu chỉ số); trang **chi tiết hóa đơn** `/invoices/:id`
- Tổng tiền trên hóa đơn **khớp đúng** ca kiểm thử 3.940.000đ khi dùng dữ liệu tương ứng

**Cách làm**
1. Service `generateInvoices(ownerId, buildingId, period)`:
   ```
   kiểm tra tòa nhà là của mình
   lấy hợp đồng ACTIVE (include: tenants, services.service, room)
   lấy chỉ số kỳ này của các phòng đó
   với mỗi hợp đồng:
     đã có hóa đơn kỳ này → skipped
     chưa có chỉ số → missingReadings
     còn lại: items = buildInvoiceItems({...})   ← chuyển dữ liệu Prisma sang InvoiceInput
              tạo invoice + items (nested create), totalAmount = sumItems(items)
   ```
2. `paymentCode`: **chỉ chữ in hoa và số, không dấu cách hay gạch** (ngân hàng hay tự bỏ ký tự đặc biệt). Ví dụ `HD` + id hợp đồng + kỳ: `HD12202610`. Đảm bảo duy nhất vì (hợp đồng, kỳ) là duy nhất
3. `dueDate` = `dueDateOf(period, building.invoiceDueDay)` (hàm đã viết ở Tuần 3)
4. Frontend: chi tiết hóa đơn dùng `Descriptions` (phòng, kỳ, hạn, trạng thái) và `InvoiceItemsTable` (cột: khoản, chi tiết, số lượng, đơn giá, thành tiền; dòng tổng in đậm)

**Gợi ý và bẫy**
- Viết 1 hàm chuyển dữ liệu Prisma sang `InvoiceInput` riêng (`toInvoiceInput(contract, reading, building)`). Hàm tính tiền giữ **thuần**, không đụng DB
- `occupants` = số dòng `ContractTenant` của hợp đồng
- **Không lấy giá từ client.** Giá luôn đọc từ DB tại thời điểm tạo

**Checklist**
- [ ] Tạo hàng loạt, chạy lại không trùng, báo rõ phòng thiếu chỉ số
- [ ] Danh sách và chi tiết hóa đơn
- [ ] `InvoiceStatusTag`, `InvoiceItemsTable` dùng chung
- [ ] Ca 3.940.000đ đúng trên giao diện
- [ ] PR đã merge

---

## 📱 TV4: Cổng khách thuê ⭐ (`/portal/...`)
**Kết quả cần đạt**
- `GET /api/portal/me`: phòng, tòa nhà (tên, địa chỉ), hợp đồng hiệu lực (giá, cọc, ngày bắt đầu, người ở cùng, dịch vụ)
- `GET /api/portal/invoices` và `/api/portal/invoices/:id`: **chỉ hóa đơn của hợp đồng mình tham gia và không phải nháp** (`status not in [DRAFT]`)
- Trang khách thuê (khổ điện thoại):
  - **Trang chủ:** thẻ phòng đang thuê; thẻ **hóa đơn gần nhất** (số tiền to, hạn đóng, trạng thái, nút "Xem chi tiết"); lối tắt Báo sự cố
  - **Hóa đơn:** danh sách thẻ theo kỳ, mới nhất trên cùng; chưa thanh toán hoặc quá hạn thì nổi bật
  - **Chi tiết hóa đơn:** dùng `InvoiceItemsTable` của TV3; chừa chỗ cho **mã QR thanh toán** (Tuần 8)
  - **Hợp đồng:** thông tin hợp đồng, người ở cùng, dịch vụ
- Khách A **không** xem được hóa đơn của khách B dù đổi id trên URL (phải 404)

**Cách làm**
1. Lọc hóa đơn của khách:
   ```ts
   where: { status: { not: 'DRAFT' }, contract: { tenants: { some: { tenant: { userId } } } } }
   ```
   Chi tiết thì thêm `id` vào `where` (dùng `findFirst`, không dùng `findUnique` theo id)
2. Hiện chưa có hóa đơn phát hành (Tuần 6 mới có nút phát hành)? Tạm sửa trạng thái một hóa đơn thành `UNPAID` bằng `npm run db:studio` để thử
3. `InvoiceItemsTable` trên điện thoại hơi chật: thêm prop `compact` (ẩn cột số lượng và đơn giá, chỉ hiện mô tả và thành tiền)

**Checklist**
- [ ] 3 API portal, đã thử truy cập hóa đơn người khác → 404
- [ ] 4 trang khách thuê dùng tốt trên khổ 375px
- [ ] Xóa `owner/week` trong `navigation.tsx` các mục đã xong
- [ ] PR đã merge

---

## 🔐 TV2: Hoàn thiện hợp đồng và kiểm tra bảo mật lần 1
**Kết quả cần đạt**
- Trang **chi tiết hợp đồng** `/contracts/:id`: sửa dịch vụ và số lượng, thêm hoặc bớt người ở (≤ `maxOccupants`), đổi người đại diện
- Trên trang Hợp đồng: khối **"Sắp hết hạn trong 30 ngày"**
- **Báo cáo kiểm tra bảo mật** `docs/kiem-tra-bao-mat.md`, bảng: API, thử gì, kết quả, đã sửa chưa
  - Đăng ký **chủ nhà thứ 2**, dùng token của người này gọi **mọi API** với id dữ liệu của chủ nhà demo → phải 404
  - Token khách thuê gọi API chủ nhà → phải 403; không token → 401
  - Gửi dữ liệu sai kiểu, số âm, chuỗi rỗng → phải 400
- Lỗ hổng tìm thấy: tạo issue, gắn nhãn `bug`, giao cho người phụ trách module

**Gợi ý:** viết sẵn file `backend/security.http` với 2 token (chủ nhà A, chủ nhà B) để chạy lại nhanh mỗi khi có module mới. Tuần 10 sẽ chạy lại lần 2.

**Checklist**
- [ ] Chi tiết hợp đồng sửa được người ở và dịch vụ
- [ ] Danh sách sắp hết hạn
- [ ] Báo cáo bảo mật lần 1, đã tạo issue các lỗi
- [ ] PR đã merge

---

## 🗺️ TV1: Sơ đồ phòng và tìm kiếm
**Kết quả cần đạt**
- Trang **Sơ đồ phòng** `/room-map` (thêm vào menu): chọn tòa nhà → các phòng **xếp theo tầng** (mỗi tầng một hàng), mỗi phòng một ô màu theo trạng thái, ghi tên phòng và người đại diện; bấm vào → trang chi tiết phòng
- Bảng Phòng và Khách thuê: sắp xếp theo cột, tìm theo tên phòng
- Phòng đang có hóa đơn quá hạn: ô trên sơ đồ có **viền đỏ** (khi TV3 có dữ liệu hóa đơn)

**Cách làm**
1. Tận dụng `GET /api/rooms?buildingId=` và thêm `include` hợp đồng ACTIVE kèm người đại diện (`where: { isPrimary: true }`)
2. Gom nhóm theo tầng bằng `reduce` thành object `{ [tầng]: Room[] }`, rồi sắp xếp tầng giảm dần (tầng cao ở trên, giống tòa nhà thật)
3. Giao diện: `Row`/`Col` hoặc CSS grid; dùng màu từ `src/utils/status.ts`; `Tooltip` hiện giá phòng

**Checklist**
- [ ] Sơ đồ phòng theo tầng, màu theo trạng thái, bấm sang chi tiết
- [ ] Sắp xếp và tìm kiếm ở bảng
- [ ] PR đã merge

---

## ✅ Cuối tuần: kiểm tra chung
- [ ] Luồng: ghi chỉ số → tạo hóa đơn → (sửa tay thành UNPAID) → khách thấy hóa đơn trên điện thoại
- [ ] Báo cáo bảo mật lần 1 không còn lỗi nghiêm trọng chưa xử lý
