# Tuần 8: Nâng cao (1) — PWA, VietQR, Job tự động, Biểu đồ

**Mục tiêu tuần:** bắt đầu các **công nghệ Web trọng tâm** của đề tài. Mỗi công nghệ cần có **phần lý thuyết ngắn** (1–2 trang, đưa vào báo cáo chương 3) do chính người làm viết.

---

## 📲 TV4: Progressive Web App ⭐
**Kết quả cần đạt**
- App **cài được** lên điện thoại và máy tính: Chrome hiện nút cài đặt, cài xong có icon riêng, mở ra toàn màn hình
- **Service Worker** cache giao diện: tắt mạng vẫn mở được app (thấy khung giao diện và thông báo "Bạn đang offline")
- Trong cổng khách thuê có nút **"Cài ứng dụng"** (Android, máy tính); iPhone hiện hướng dẫn "Chia sẻ → Thêm vào MH chính"
- Có phiên bản mới thì hiện thông báo **"Có bản cập nhật, tải lại"**
- Lighthouse (DevTools → Lighthouse) mục PWA đạt yêu cầu cài đặt
- Tài liệu lý thuyết: PWA, manifest, Service Worker (vòng đời: register → install → activate → fetch), chiến lược cache

**Cách làm**
1. Cài: `npm i -D vite-plugin-pwa` (trong `frontend/`)
2. Tạo icon từ 1 ảnh vuông ≥ 512px: `npx @vite-pwa/assets-generator --preset minimal-2023 public/logo.svg`, hoặc dùng https://realfavicongenerator.net. Cần 192×192, 512×512 và 1 icon *maskable*
3. `vite.config.ts`:
   ```ts
   import { VitePWA } from 'vite-plugin-pwa';
   VitePWA({
     registerType: 'prompt',
     manifest: {
       name: 'Quản lý nhà trọ', short_name: 'Nhà trọ', lang: 'vi',
       start_url: '/', display: 'standalone', theme_color: '#1677ff', background_color: '#ffffff',
       icons: [ /* 192, 512, maskable */ ],
     },
     workbox: {
       navigateFallback: '/index.html',
       navigateFallbackDenylist: [/^\/api\//],
       importScripts: ['push-sw.js'],   // Tuần 9: code nhận push đặt ở public/push-sw.js
     },
   })
   ```
4. Thông báo bản cập nhật: `useRegisterSW` từ `virtual:pwa-register/react` (xem tài liệu vite-plugin-pwa, mục *React*). Thêm `"vite-plugin-pwa/react"` vào `types` trong `tsconfig.json`
5. Nút cài: lắng nghe sự kiện `beforeinstallprompt`, lưu lại, bấm nút thì gọi `event.prompt()`. iPhone không có sự kiện này → nhận diện iOS và hiện hướng dẫn
6. **Thử:** Service Worker chỉ chạy ở bản build → `npm run build && npm run preview`. DevTools → **Application** → Manifest / Service Workers; tab Network → **Offline**
7. Tạm tạo `public/push-sw.js` rỗng (Tuần 9 viết nội dung)

**Bẫy thường gặp**
- PWA **bắt buộc HTTPS** (localhost được miễn). Thử trên điện thoại phải dùng **bản online**
- Cache cũ làm "sửa code mà không thấy thay đổi" → DevTools → Application → *Unregister* và *Clear storage*
- **Không cache API có dữ liệu cá nhân** ở tuần này (Tuần 10 mới làm, có xử lý khi đăng xuất)

**Tài liệu:** https://vite-pwa-org.netlify.app/guide/ · https://web.dev/learn/pwa

**Checklist**
- [ ] Cài được trên Android hoặc máy tính, có icon
- [ ] Offline vẫn mở được khung app
- [ ] Nút cài và hướng dẫn cho iPhone
- [ ] Thông báo cập nhật
- [ ] Ảnh chụp Lighthouse, tài liệu lý thuyết
- [ ] PR đã merge

---

## 🏦 TV2: VietQR trên hóa đơn ⭐
**Kết quả cần đạt**
- Chủ nhà khai báo **tài khoản nhận tiền** (ngân hàng, số tài khoản, tên chủ tài khoản) ở trang **Cài đặt**
- `GET /api/invoices/:id/vietqr` (chủ nhà) và `GET /api/portal/invoices/:id/vietqr` (khách) trả về: URL ảnh QR, ngân hàng, số tài khoản, tên, **số tiền còn phải trả**, **nội dung chuyển khoản = `paymentCode`**
- Chi tiết hóa đơn phía khách (trang của TV4) hiện **mã QR**, nút sao chép số tài khoản và nội dung, ghi chú *"Giữ nguyên nội dung chuyển khoản để hệ thống tự xác nhận"*. Hóa đơn đã thanh toán thì không hiện QR
- Quét QR bằng app ngân hàng thật → **tự điền đúng** người nhận, số tiền, nội dung (chỉ cần kiểm tra, **không cần chuyển tiền thật**)
- **Chốt nhà cung cấp webhook** cho Tuần 9 (xem bước 4)

**Cách làm**
1. Migration: thêm vào `User` các trường `bankCode` (VD `MB`, `VCB`, `TCB`), `bankAccountNo`, `bankAccountName` (trả lời câu hỏi review ở `04`: lưu ở User hay Building?)
2. Ảnh QR dùng dịch vụ Quick Link của VietQR (không cần thư viện):
   ```ts
   const url = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png`
     + `?amount=${remaining}&addInfo=${encodeURIComponent(paymentCode)}&accountName=${encodeURIComponent(accountName)}`;
   ```
   Danh sách mã ngân hàng: https://api.vietqr.io/v2/banks (dùng làm dữ liệu cho `Select` ngân hàng)
3. Ghép với TV4: đặt component `VietQRCard` vào trang chi tiết hóa đơn khách thuê
4. **Tìm hiểu và chọn nhà cung cấp webhook** (đọc tài liệu chính thức, kiểm tra điều kiện đăng ký hiện tại):
   - **SePay** (sepay.vn): theo dõi giao dịch của tài khoản ngân hàng, gọi webhook khi có tiền vào
   - **PayOS** (payos.vn): tạo link hoặc QR thanh toán, webhook có chữ ký
   - **Phương án B (luôn làm được):** tự viết **"trình giả lập ngân hàng"**, một trang chỉ bật khi dev, gửi request webhook đúng định dạng kèm khóa bí mật. Vẫn thể hiện đủ các khái niệm webhook, xác thực, idempotency
   - Ghi kết quả so sánh vào `docs/thanh-toan.md` (dùng cho báo cáo)

**Checklist**
- [ ] Cài đặt tài khoản nhận tiền
- [ ] API VietQR (2 phía), QR hiển thị trên hóa đơn khách
- [ ] Đã quét thử bằng app ngân hàng thật
- [ ] Đã chọn nhà cung cấp webhook (hoặc phương án B), có tài khoản sandbox nếu dùng
- [ ] PR đã merge

---

## ⏰ TV3: Job tự động (cron)
**Kết quả cần đạt**
- **07:00 ngày 1 hằng tháng:** với mỗi tòa nhà, nếu đã đủ chỉ số kỳ trước → tạo hóa đơn nháp và báo chủ nhà *"Đã tạo 8 hóa đơn nháp tháng 10, vui lòng kiểm tra và phát hành"*; nếu thiếu → báo *"Còn 3 phòng chưa nhập chỉ số tháng 10"*
- **08:00 hằng ngày:** hóa đơn quá hạn chưa trả đủ → nhắc khách (**tối đa 1 lần / 3 ngày** mỗi hóa đơn)
- `POST /api/jobs/:name/run` (chủ nhà, chỉ chạy trên dữ liệu của chính mình) và các nút **"Chạy ngay"** trên Dashboard (khu vực "Công cụ demo")
- Chạy job 2 lần **không** tạo trùng, **không** nhắc trùng

**Cách làm**
1. `npm i node-cron` (backend), kiểm tra thư viện đã kèm kiểu TypeScript chưa; chưa thì cài thêm `@types/node-cron`
2. `src/jobs/index.ts`:
   ```ts
   cron.schedule('0 7 1 * *', generateMonthlyInvoices, { timezone: 'Asia/Ho_Chi_Minh' });
   cron.schedule('0 8 * * *', remindOverdue, { timezone: 'Asia/Ho_Chi_Minh' });
   ```
   Gọi `startJobs()` trong `src/index.ts`
3. Tách logic job thành hàm nhận `ownerId?` (có thì chỉ chạy cho chủ nhà đó) để dùng chung cho cron và nút "Chạy ngay"
4. Chống nhắc trùng: thêm trường `Invoice.lastRemindedAt` (migration)
5. Dùng lại `generateInvoices()` (Tuần 5) và `notify()` (TV4)

**Bẫy và câu vấn đáp**
- Render miễn phí **ngủ khi không có truy cập** → cron không chạy. Vì vậy cần nút "Chạy ngay" để demo. Giải pháp thật: dịch vụ cron bên ngoài (cron-job.org) gọi endpoint có khóa bí mật, hoặc dùng server không ngủ
- Giải thích được cú pháp cron 5 trường: *phút giờ ngày tháng thứ*

**Checklist**
- [ ] 2 job, đúng múi giờ Việt Nam
- [ ] API và nút "Chạy ngay"
- [ ] Không tạo trùng, không nhắc trùng
- [ ] Tài liệu lý thuyết ngắn về cron, job định kỳ
- [ ] PR đã merge

---

## 📈 TV1: Biểu đồ doanh thu và xuất Excel 🟢
**Kết quả cần đạt**
- `GET /api/dashboard/revenue?months=6` → `[{ period, invoiced, collected }]` (tổng phát hành và tổng đã thu từng tháng)
- Biểu đồ cột trên Dashboard: 2 cột mỗi tháng (*Phát hành* và *Đã thu*)
- Nút **"Xuất Excel"** ở trang Hóa đơn: xuất danh sách đang lọc

**Cách làm**
1. Biểu đồ: `npm i recharts` (frontend), dùng `BarChart`, `ResponsiveContainer`
2. Xuất Excel đơn giản nhất: tạo **CSV** có ký tự BOM để Excel đọc đúng tiếng Việt:
   ```ts
   const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
   const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
   // tạo thẻ <a download="hoa-don-2026-10.csv"> rồi click
   ```
3. Tìm hiểu trước **Socket.IO** cho Tuần 9: https://socket.io/docs/v4/tutorial/introduction

**Checklist**
- [ ] API và biểu đồ doanh thu
- [ ] Xuất CSV mở bằng Excel không lỗi font
- [ ] Đã đọc tài liệu Socket.IO
- [ ] PR đã merge

---

## ✅ Cuối tuần: kiểm tra chung
- [ ] Cài được app lên điện thoại từ bản online
- [ ] Khách thấy mã QR trên hóa đơn, quét ra đúng thông tin
- [ ] Bấm "Chạy ngay" job tạo hóa đơn → chủ nhà nhận thông báo
