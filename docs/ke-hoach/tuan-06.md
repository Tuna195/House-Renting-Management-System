# Tuần 6: MVP (4) — Phát hành và thu tiền, Dashboard, Deploy lần 1, In hóa đơn

**Mục tiêu tuần:** khép kín vòng **tạo → phát hành → thu tiền**; ứng dụng **chạy online lần đầu**.

---

## 💰 TV3: Phát hành hóa đơn và ghi nhận thanh toán ⭐
**Kết quả cần đạt**
- `PATCH /api/invoices/:id` (**chỉ khi `DRAFT`**): thêm, sửa, xóa khoản; thêm khoản "Khác" (`OTHER`) hoặc "Giảm trừ" (`DISCOUNT`, số âm). **Tổng tiền luôn do server tính lại**
- `POST /api/invoices/:id/issue` và `POST /api/invoices/issue-all` `{ buildingId, period }`: `DRAFT → UNPAID`, ghi `issuedAt`, gọi `notify()` cho **mọi khách có tài khoản** trong hợp đồng
- `POST /api/invoices/:id/payments` `{ amount, method: 'CASH' | 'BANK_TRANSFER', paidAt?, note? }`: tạo `Payment`, cập nhật `paidAmount` và trạng thái (`PARTIAL` / `PAID`) **trong transaction**
- Hủy hóa đơn (`CANCELLED`) khi chưa có thanh toán
- Trạng thái **"Quá hạn"** hiển thị khi `UNPAID`/`PARTIAL` và `dueDate` < hôm nay (tính khi hiển thị)
- Trang chi tiết hóa đơn: nút Sửa khoản (khi nháp), Phát hành, **Ghi nhận thanh toán** (modal), lịch sử thanh toán

**Cách làm**
1. ⭐ **Hàm dùng chung cho TV2 (webhook Tuần 9)**, đặt ở `invoices.service.ts`:
   ```ts
   export async function applyPayment(
     tx: Prisma.TransactionClient,
     invoiceId: number,
     payment: { amount: number; method: PaymentMethod; transactionRef?: string; rawPayload?: Prisma.InputJsonValue; note?: string },
   ) {
     // 1. tạo Payment   2. tính lại tổng đã trả bằng aggregate   3. cập nhật paidAmount + status   4. trả invoice mới
   }
   ```
   Gọi: `prisma.$transaction((tx) => applyPayment(tx, id, {...}))`
2. Đã trả = `aggregate({ _sum: { amount: true }, where: { invoiceId } })`, **tính lại từ đầu**, không cộng dồn vào số cũ (tránh sai khi chạy song song)
3. Không cho ghi nhận thanh toán khi hóa đơn `DRAFT` hoặc `CANCELLED` → 409

**Gợi ý vấn đáp:** "Vì sao tổng tiền tính ở server mà không nhận từ client?" (client có thể bị sửa bằng DevTools). "Vì sao cần transaction khi ghi nhận thanh toán?"

**Checklist**
- [ ] Sửa khoản khi nháp, tổng tính lại ở server
- [ ] Phát hành (lẻ và hàng loạt), khách nhận thông báo
- [ ] Ghi nhận thanh toán, `PARTIAL`/`PAID` đúng
- [ ] `applyPayment()` đã báo TV2
- [ ] Unit test cho hàm xác định trạng thái theo số tiền đã trả
- [ ] PR đã merge

---

## 📊 TV1: Dashboard
**Kết quả cần đạt**
- `GET /api/dashboard/summary` trả về:
  - Số phòng theo trạng thái, **tỷ lệ lấp đầy**
  - **Đã thu tháng này** (tổng `Payment.amount` có `paidAt` trong tháng)
  - **Còn phải thu** (tổng `totalAmount − paidAmount` của hóa đơn `UNPAID`/`PARTIAL`), số hóa đơn quá hạn
  - Số sự cố đang mở, số hợp đồng sắp hết hạn
- Trang Tổng quan: thay các ô "—" bằng số thật; danh sách **5 hóa đơn quá hạn** (bấm vào sang chi tiết); danh sách sự cố mới

**Cách làm**
1. Đếm phòng: `prisma.room.groupBy({ by: ['status'], where: { building: { ownerId } }, _count: true })`
2. Prisma không cộng được biểu thức `totalAmount − paidAmount`: dùng 2 `aggregate` (`_sum.totalAmount`, `_sum.paidAmount`) rồi trừ
3. Chạy các truy vấn song song bằng `Promise.all([...])` cho nhanh
4. Mọi truy vấn **lọc theo `ownerId`** (qua `building` hoặc `contract.room.building`)

**Checklist**
- [ ] API summary, số liệu khớp khi đếm tay trên `db:studio`
- [ ] Dashboard hiện số thật, danh sách quá hạn và sự cố
- [ ] PR đã merge

---

## 🚀 TV2: Deploy lần 1 ⭐
**Kết quả cần đạt**
- Frontend chạy ở `https://<ten>.vercel.app` (hoặc Netlify), backend ở `https://<ten>.onrender.com`, database Neon riêng cho production
- Đăng nhập được bằng tài khoản demo trên bản online; mở đường dẫn sâu (ví dụ `/buildings`) rồi bấm F5 không bị 404
- `docs/deploy.md` ghi lại từng bước, các biến môi trường (**không ghi giá trị bí mật**)

**Cách làm** *(giao diện các dịch vụ có thể thay đổi, đọc tài liệu chính thức nếu khác)*
1. **Neon:** tạo database `production` riêng → lấy connection string
2. **Render** → New → Web Service → chọn repo:
   - Root Directory: `backend`
   - Build Command: `npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start Command: `npm start`
   - Environment: `DATABASE_URL`, `JWT_SECRET` (chuỗi mới, dài), `CORS_ORIGIN` = URL frontend, `NODE_ENV=production`
   - Sau khi deploy: chạy seed một lần (Render Shell: `npm run db:seed`, hoặc chạy seed từ máy mình với `DATABASE_URL` production)
3. **Vercel** → New Project → chọn repo:
   - Root Directory: `frontend`, Framework: Vite
   - Environment: `VITE_API_URL` = `https://<backend>.onrender.com/api`
   - Thêm `frontend/vercel.json` để React Router chạy được khi F5:
     ```json
     { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
     ```
4. Kiểm tra: `https://<backend>/api/health`, rồi đăng nhập trên frontend

**Bẫy thường gặp**
- Lỗi CORS trên bản online → `CORS_ORIGIN` sai (thừa dấu `/` cuối, sai `https`)
- Render bản miễn phí **"ngủ" sau ~15 phút** không dùng, lần đầu gọi mất 30–60 giây. **Trước khi demo nhớ mở trước 5 phút**
- Quên `prisma migrate deploy` → lỗi thiếu bảng

**Checklist**
- [ ] Frontend, backend, DB production chạy online
- [ ] F5 ở trang con không lỗi
- [ ] `docs/deploy.md`
- [ ] Cả nhóm mở được bản online trên điện thoại

---

## 🖨️ TV4: In hóa đơn và tối ưu giao diện điện thoại
**Kết quả cần đạt**
- Nút **"In / Lưu PDF"** ở chi tiết hóa đơn (cả chủ nhà và khách) → bản in dạng **phiếu báo tiền**: tên và địa chỉ tòa nhà, phòng, kỳ, người đại diện, bảng khoản, tổng tiền (to, đậm), hạn đóng, thông tin chuyển khoản (Tuần 8 thêm QR)
- Khi in **ẩn** menu, header, nút bấm; vừa khổ A5 hoặc A4
- Rà soát **mọi trang đã có** ở khổ 375px: ghi danh sách vấn đề vào issue và giao người phụ trách (bảng tràn, nút quá nhỏ, chữ bị cắt...)

**Cách làm**
1. Component `src/components/InvoicePrintView.tsx`, nút in gọi `window.print()`
2. CSS:
   ```css
   @media print {
     .ant-layout-sider, .ant-layout-header, .no-print { display: none !important; }
     body { background: #fff; }
     @page { size: A5; margin: 10mm; }
   }
   ```
3. Bảng trên điện thoại: `Table` thêm `scroll={{ x: 600 }}`, hoặc đổi sang `List` khi `Grid.useBreakpoint().md === false`

**Checklist**
- [ ] In và lưu PDF đẹp ở cả 2 phía
- [ ] Danh sách vấn đề giao diện điện thoại đã giao người sửa
- [ ] PR đã merge

---

## ✅ Cuối tuần: kiểm tra chung
- [ ] **Trên bản online:** tạo hợp đồng → ghi chỉ số → tạo hóa đơn → phát hành → khách nhận thông báo và xem hóa đơn trên điện thoại → chủ nhà ghi nhận thanh toán → Dashboard cập nhật
