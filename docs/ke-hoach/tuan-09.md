# Tuần 9: Nâng cao (2) — Webhook thanh toán, Web Push, Realtime

**Mục tiêu tuần:** làm cho "khoảnh khắc ấn tượng" khi demo hoạt động: **khách chuyển khoản → hóa đơn tự chuyển "Đã thanh toán" → điện thoại nhận thông báo**.

> 🤝 **Điểm nối quan trọng:** hàm `notify()` của TV4 sẽ **vừa lưu DB, vừa gửi Web Push, vừa phát Socket.IO**. TV4 sửa phần push, TV1 sửa phần socket, **cùng một file**: thống nhất ai sửa trước (đề xuất: TV4 trước, TV1 sau).

---

## 🔗 TV2: Webhook tự gạch nợ ⭐
**Kết quả cần đạt**
- `POST /api/payments/webhook` (**không** dùng `requireAuth`) nhận thông báo giao dịch từ SePay, PayOS hoặc trình giả lập
- **Xác thực:** sai hoặc thiếu khóa bí mật / chữ ký → 401, không xử lý
- Tìm `paymentCode` trong nội dung chuyển khoản → gọi `applyPayment()` (của TV3) với `method: 'VIETQR'`, `transactionRef` = mã giao dịch, `rawPayload` = toàn bộ body
- **Idempotency:** cùng một giao dịch gửi 2 lần → lần 2 không ghi nhận thêm, vẫn trả 200
- Không tìm thấy hóa đơn → lưu lại để chủ nhà xử lý tay, vẫn trả 200
- Thành công → `notify()` cho khách ("Đã nhận 3.940.000đ cho hóa đơn tháng 10") và chủ nhà
- Unit test cho hàm tách mã: `extractPaymentCode('CT DEN:123 HD12202610 chuyen tien phong')` → `'HD12202610'`

**Cách làm**
1. Bảng ghi log (migration):
   ```prisma
   model WebhookEvent {
     id         Int      @id @default(autoincrement())
     provider   String
     externalId String   @unique   // mã giao dịch của nhà cung cấp
     status     String             // MATCHED | UNMATCHED | DUPLICATE | INVALID
     payload    Json
     createdAt  DateTime @default(now())
   }
   ```
2. Luồng xử lý:
   ```
   xác thực → ghi WebhookEvent (trùng externalId → DUPLICATE, trả 200 luôn)
   → chỉ xử lý giao dịch TIỀN VÀO → extractPaymentCode (regex /HD\d+/, viết hoa, bỏ khoảng trắng)
   → tìm Invoice theo paymentCode, trạng thái UNPAID hoặc PARTIAL
   → prisma.$transaction(tx => applyPayment(tx, invoice.id, {...}))
   → notify(...)
   ```
3. **Thử ở máy mình:** nhà cung cấp cần URL công khai → dùng **ngrok** (`ngrok http 4000`), hoặc Cloudflare Tunnel, rồi khai báo URL `https://xxxx.ngrok-free.app/api/payments/webhook` ở trang quản trị nhà cung cấp. Có thể gửi thử request mẫu từ `api.http`
4. **Phương án B, trình giả lập:** trang `/dev/bank` (chỉ bật khi `ENABLE_BANK_SIMULATOR=true`): nhập số tiền và nội dung → backend gửi request đúng định dạng webhook tới chính nó, kèm khóa bí mật

**Câu vấn đáp chắc chắn có**
- Webhook khác API thường thế nào? (bên kia **chủ động gọi** mình khi có sự kiện, mình không phải hỏi liên tục)
- Vì sao phải xác thực? (ai biết URL cũng gửi được request giả "đã trả tiền")
- Vì sao nhà cung cấp gửi trùng? (mạng lỗi, mình phản hồi chậm thì họ gửi lại) → **idempotency** nhờ `@unique`
- Vì sao vẫn trả 200 khi không tìm thấy hóa đơn? (trả lỗi thì họ gửi lại mãi)

**Checklist**
- [ ] Webhook có xác thực, idempotency, ghi log
- [ ] Chuyển khoản (thật số nhỏ, sandbox hoặc giả lập) → hóa đơn tự `PAID`
- [ ] Gửi trùng 2 lần không ghi nhận đôi
- [ ] Unit test `extractPaymentCode`
- [ ] Tài liệu lý thuyết webhook và sơ đồ tuần tự (sequence diagram) luồng thanh toán
- [ ] PR đã merge

---

## 🔔 TV4: Web Push ⭐
**Kết quả cần đạt**
- Nút **"Bật thông báo"** (cổng khách thuê và trang chủ nhà) → xin quyền → đăng ký nhận push
- **Mọi lần `notify()`** → người nhận được push trên thiết bị đã đăng ký, **kể cả khi đã đóng tab** (Android và máy tính; iPhone: đã cài PWA, iOS 16.4 trở lên)
- Bấm vào thông báo → mở app đúng trang (`link`)
- Thiết bị hủy đăng ký hoặc hết hạn (lỗi 404/410 khi gửi) → tự xóa khỏi DB
- Tài liệu lý thuyết: Push API, Notification API, VAPID, luồng *server → push service (của Google/Apple/Mozilla) → trình duyệt → Service Worker*

**Cách làm**
1. Backend: `npm i web-push` (thêm `@types/web-push` nếu cần). Tạo khóa: `npx web-push generate-vapid-keys` → `.env`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:email-nhom@...` (thêm vào `config/env.ts` và `.env.example`)
2. `modules/push/`: `GET /push/public-key`, `POST /push/subscribe` (upsert theo `endpoint`), `DELETE /push/subscribe`; hàm `sendPushToUser(userId, { title, body, url })`
3. Sửa `notify()`: sau khi lưu DB thì gọi `sendPushToUser(...)`. **Không `await` chặn**, và lỗi push không được làm hỏng nghiệp vụ chính (`.catch(console.error)`)
4. Frontend `public/push-sw.js` (đã khai báo `importScripts` ở Tuần 8):
   ```js
   self.addEventListener('push', (event) => {
     const data = event.data?.json() ?? {};
     event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/pwa-192x192.png', data: { url: data.url } }));
   });
   self.addEventListener('notificationclick', (event) => {
     event.notification.close();
     event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'));
   });
   ```
5. Đăng ký: `Notification.requestPermission()` → `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` (khóa public phải đổi từ base64url sang `Uint8Array`, hỏi AI hàm `urlBase64ToUint8Array`) → gửi `subscription.toJSON()` lên server
6. Thử: DevTools → Application → Service Workers → ô **Push** để gửi thử

**Bẫy:** xin quyền **phải xuất phát từ cú bấm** của người dùng (không xin ngay khi mở trang, iPhone sẽ chặn). Người dùng đã bấm "Chặn" thì phải tự mở lại trong cài đặt trình duyệt; hiện hướng dẫn.

**Checklist**
- [ ] Đăng ký và hủy đăng ký push
- [ ] `notify()` gửi push, lỗi push không ảnh hưởng nghiệp vụ
- [ ] Nhận push khi đã đóng tab, bấm vào mở đúng trang
- [ ] Tự dọn đăng ký hết hạn
- [ ] Tài liệu lý thuyết, ảnh chụp thông báo trên điện thoại
- [ ] PR đã merge

---

## ⚡ TV1: Realtime với Socket.IO 🟢
**Kết quả cần đạt**
- Server Socket.IO chạy cùng cổng với API; kết nối **phải có JWT hợp lệ**
- Mỗi user tự vào phòng `user:<id>`; hàm `emitToUser(userId, event, data)`
- `notify()` phát thêm sự kiện `notification:new` → chuông cập nhật **ngay**, kèm popup nhỏ, **không cần đợi 30 giây**
- Tài liệu lý thuyết: HTTP và WebSocket, so sánh polling, long polling, WebSocket, SSE

**Cách làm**
1. Backend `npm i socket.io`. `src/index.ts`: đổi `app.listen` thành
   ```ts
   const server = http.createServer(app);
   initSocket(server);   // src/lib/socket.ts
   server.listen(env.PORT, ...);
   ```
   `io.use((socket, next) => { verify JWT từ socket.handshake.auth.token ... })`, rồi `socket.join(\`user:${id}\`)`
2. Frontend `npm i socket.io-client`; hook `useRealtime()` gọi trong `AppLayout`: kết nối khi đã đăng nhập, ngắt khi đăng xuất; nhận `notification:new` thì `queryClient.invalidateQueries({ queryKey: ['notifications'] })` và hiện `notification.info(...)`
3. `vite.config.ts` proxy thêm: `'/socket.io': { target: 'http://localhost:4000', ws: true }`. Bản online kết nối tới địa chỉ backend (`VITE_API_URL` bỏ phần `/api`)
4. Thử: mở 2 trình duyệt (chủ nhà và khách) cạnh nhau, khách gửi sự cố → chuông chủ nhà nhảy ngay

**Checklist**
- [ ] Socket xác thực bằng JWT
- [ ] Thông báo hiện ngay lập tức ở 2 cửa sổ
- [ ] Chạy được trên bản online
- [ ] Tài liệu lý thuyết
- [ ] PR đã merge

---

## 🧮 TV3: Gắn thông báo vào hóa đơn, ghi chỉ số trên điện thoại
**Kết quả cần đạt**
- Kiểm tra lại mọi chỗ gửi thông báo (phát hành, nhắc nợ, thanh toán thành công) có `link` đúng trang chi tiết hóa đơn **của khách** (`/portal/invoices/:id`)
- **Chế độ "đi ghi số" cho điện thoại** ở trang Chỉ số: mỗi lần hiện 1 phòng (thẻ to: tên phòng, chỉ số cũ, ô nhập chỉ số mới cỡ lớn, nút *Trước / Tiếp*), cuối cùng bấm "Lưu tất cả". Đây là bước chuẩn bị cho chế độ offline ở Tuần 10
- Hỗ trợ TV2 kiểm thử `applyPayment()` với webhook (trả thiếu, trả thừa, trả 2 lần)

**Checklist**
- [ ] Link thông báo đúng
- [ ] Chế độ đi ghi số dùng tốt trên điện thoại
- [ ] Đã cùng TV2 thử các trường hợp thanh toán
- [ ] PR đã merge

---

## ✅ Cuối tuần: kiểm tra chung
- [ ] **Bản online:** khách mở hóa đơn → quét QR → chuyển khoản (hoặc giả lập) → vài giây sau hóa đơn "Đã thanh toán", điện thoại khách nhận push, chuông chủ nhà nhảy
