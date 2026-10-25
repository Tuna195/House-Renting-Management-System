# 📬 Danh Sách & Thiết Kế Hệ Thống Thông Báo (Notification System)

> **Tài liệu phục vụ Tuần 2: Phân tích & Thiết kế**  
> **Người phụ trách:** **TV4** (Phụ trách Trải nghiệm Khách thuê, In-App Notification & PWA Web Push)  
> **Phối hợp kỹ thuật:** **TV1** (Socket.IO Realtime), **TV2** (Webhook VietQR), **TV3** (Cron job nhắc nợ)

---

## 🏗️ 1. Kiến Trúc Thông Báo Đa Kênh (Omnichannel Notifications)

Hệ thống quản lý nhà trọ sử dụng **3 kênh truyền tải thông báo đồng bộ**:

```
[ Sự kiện hệ thống ] 
        │
        ├──> 1. Lưu vào Database (Bảng Notification) ──> Hiện ở Icon Chuông (In-app)
        │
        ├──> 2. Gửi Web Push qua Service Worker ───────> Hiện Pop-up trên điện thoại (kể cả tắt tab)
        │
        └──> 3. Bắn sự kiện qua Socket.IO ─────────────> Cập nhật tức thời không cần F5 (Realtime)
```

1. **Kênh 1: In-App Notification (Lưu vĩnh viễn trong CSDL):**
   - Lưu vào bảng `Notification` trong PostgreSQL.
   - Hiển thị số lượng chưa đọc (`unreadCount`) màu đỏ trên biểu tượng quả chuông 🔔 ở Header.
   - Xem toàn bộ tại trang `/portal/notifications` (Khách) hoặc `/notifications` (Chủ).
2. **Kênh 2: Web Push Notification (PWA - Công nghệ nâng cao của TV4):**
   - Sử dụng chuẩn W3C Push API + VAPID keys.
   - Khách chỉ cần cấp quyền 1 lần trên điện thoại, hệ thống lưu endpoint vào bảng `PushSubscription`.
   - **Nhận được thông báo ngay cả khi trình duyệt đã đóng hoặc khóa màn hình**.
3. **Kênh 3: Realtime Socket.IO (Công nghệ nâng cao của TV1):**
   - Khi người dùng đang mở tab web, thông báo sẽ hiện ngay lập tức (Toast / Banner) và cập nhật badge chuông mà không cần tải lại trang.

---

## 📋 2. Bảng Danh Mục Toàn Bộ Thông Báo Hệ Thống

### 🏷️ Nhóm 1: Hóa đơn & Thanh toán (Billing & Payment)

| Mã TB | Tên sự kiện kích hoạt | Kênh gửi | Người nhận | Tiêu đề thông báo mẫu | Nội dung chi tiết mẫu | Link điều hướng |
|:---:|---|:---:|:---:|---|---|:---:|
| **TB-HD-01** | Chủ nhà phát hành hóa đơn mới | In-app, Push, Socket | Khách thuê | 📄 Hóa đơn kỳ {period} đã phát hành | Hóa đơn phòng {room} là **{amount} đ**. Hạn nộp: {dueDate}. Vui lòng kiểm tra và thanh toán. | `/portal/invoices/:id` |
| **TB-HD-02** | Nhắc nợ trước hạn 1 ngày (Job tự động) | In-app, Push | Khách thuê | ⏰ Sắp đến hạn đóng tiền phòng | Hóa đơn kỳ {period} ({amount} đ) sẽ đến hạn vào ngày mai ({dueDate}). Quét mã VietQR để đóng nhanh! | `/portal/invoices/:id` |
| **TB-HD-03** | Hóa đơn quá hạn thanh toán (Job tự động) | In-app, Push | Khách thuê | ⚠️ Hóa đơn tiền phòng ĐÃ QUÁ HẠN | Hóa đơn kỳ {period} của phòng {room} đã quá hạn đóng ({dueDate}). Vui lòng thanh toán sớm cho chủ nhà. | `/portal/invoices/:id` |
| **TB-HD-04** | Khách quét VietQR chuyển khoản thành công | In-app, Push, Socket | **Khách thuê** | 💰 Thanh toán thành công | Đã ghi nhận thanh toán **{paidAmount} đ** cho hóa đơn kỳ {period}. Hóa đơn đã được gạch nợ thành công! | `/portal/invoices/:id` |
| **TB-HD-05** | Webhook ngân hàng báo có tiền | In-app, Push, Socket | **Chủ nhà** | 💵 Nhận tiền phòng {room} ({period}) | Phòng {room} ({tenantName}) vừa chuyển khoản **{paidAmount} đ** qua VietQR (Mã: {paymentCode}). | `/invoices/:id` |
| **TB-HD-06** | Chủ nhà xác nhận tiền mặt thủ công | In-app, Push | Khách thuê | 🧾 Xác nhận thu tiền mặt | Chủ nhà đã ghi nhận thanh toán tiền mặt **{paidAmount} đ** cho hóa đơn kỳ {period}. | `/portal/invoices/:id` |
| **TB-HD-07** | Hóa đơn bị hủy hoặc điều chỉnh | In-app, Push | Khách thuê | ℹ️ Hóa đơn kỳ {period} đã được điều chỉnh | Chủ nhà đã hủy/cập nhật lại hóa đơn kỳ {period}. Nhấn để xem số tiền mới nhất. | `/portal/invoices/:id` |

---

### 🏷️ Nhóm 2: Sự cố & Sửa chữa phòng (Maintenance - Phụ trách cốt lõi của TV4)

| Mã TB | Tên sự kiện kích hoạt | Kênh gửi | Người nhận | Tiêu đề thông báo mẫu | Nội dung chi tiết mẫu | Link điều hướng |
|:---:|---|:---:|:---:|---|---|:---:|
| **TB-SC-01** | Khách gửi yêu cầu báo hỏng mới | In-app, Push, Socket | **Chủ nhà** | ⚠️ Sự cố mới từ phòng {room} | Khách {tenantName} báo: **"{title}"**. Đã đính kèm ảnh hiện trường. | `/maintenance` |
| **TB-SC-02** | Chủ nhà tiếp nhận & hẹn thợ (`IN_PROGRESS`) | In-app, Push | **Khách thuê** | 🛠️ Sự cố {title}: ĐANG XỬ LÝ | Yêu cầu sửa chữa đã được chủ nhà tiếp nhận. **Lịch hẹn thợ: {scheduleNote}**. | `/portal/maintenance` |
| **TB-SC-03** | Thợ đã sửa xong hoàn tất (`DONE`) | In-app, Push | **Khách thuê** | 🟢 Sự cố {title}: ĐÃ HOÀN TẤT | Sự cố phòng bạn đã được xử lý xong vào lúc {resolvedTime}. Vui lòng kiểm tra và nghiệm thu! | `/portal/maintenance` |
| **TB-SC-04** | Chủ nhà từ chối xử lý (`REJECTED`) | In-app, Push | **Khách thuê** | 🔴 Yêu cầu sửa chữa bị từ chối | Yêu cầu "{title}" bị từ chối do: **{rejectReason}**. Nhấn để xem chi tiết. | `/portal/maintenance` |

---

### 🏷️ Nhóm 3: Hợp đồng & Tài khoản (Contract & Tenants)

| Mã TB | Tên sự kiện kích hoạt | Kênh gửi | Người nhận | Tiêu đề thông báo mẫu | Nội dung chi tiết mẫu | Link điều hướng |
|:---:|---|:---:|:---:|---|---|:---:|
| **TB-TK-01** | Chủ nhà tạo tài khoản cho khách | Email / SMS / In-app | Khách thuê | 🎉 Chào mừng bạn đến với Cổng Khách Thuê | Tài khoản của bạn đã được kích hoạt: Email: `{email}`, Mật khẩu tạm thời: `{tempPass}`. | `/login` |
| **TB-HD-08** | Hợp đồng sắp hết hạn (trước 30 ngày) | In-app, Push | Khách & Chủ | 📑 Hợp đồng phòng {room} sắp hết hạn | Hợp đồng thuê phòng {room} sẽ kết thúc vào ngày {endDate}. Vui lòng liên hệ để gia hạn hợp đồng. | `/portal/contract` |
| **TB-HD-09** | Thanh lý / Kết thúc hợp đồng (Trả phòng) | In-app | Khách thuê | 🚪 Hoàn tất thủ tục trả phòng | Hợp đồng phòng {room} đã kết thúc. Cảm ơn bạn đã gắn bó cùng khu trọ! | `/portal` |

---

### 🏷️ Nhóm 4: Bảng tin thông báo chung từ Chủ nhà (Broadcast Announcements)

| Mã TB | Tên sự kiện kích hoạt | Kênh gửi | Người nhận | Tiêu đề thông báo mẫu | Nội dung chi tiết mẫu | Link điều hướng |
|:---:|---|:---:|:---:|---|---|:---:|
| **TB-TB-01** | Cắt điện / nước bảo dưỡng tòa nhà | In-app, Push | Tất cả khách trong tòa | 📢 Thông báo bảo trì điện nước | Tòa nhà {buildingName} sẽ tạm ngừng cấp nước từ **08:00 đến 11:30 ngày mai** để súc rửa bể ngầm. | `/portal/notifications` |
| **TB-TB-02** | Nhắc nhở an ninh / Giờ đóng cửa | In-app, Push | Tất cả khách trong tòa | 🚨 Nhắc nhở an ninh & PCCC | Các bạn nhớ khóa cổ xe máy, tắt các thiết bị điện đun nấu trước khi ra khỏi phòng. | `/portal/notifications` |

---

## 💾 3. Cấu Trúc Dữ Liệu & Payload Kỹ Thuật

### A. Bản ghi trong Database (`schema.prisma`)
Mỗi thông báo In-app được lưu vào bảng `Notification`:
```typescript
interface NotificationRecord {
  id: number;
  userId: number;       // ID người nhận
  title: string;        // Tiêu đề ngắn gọn (<= 100 ký tự)
  body: string;         // Nội dung tóm tắt (<= 300 ký tự)
  link: string | null;  // Đường dẫn nhảy đến màn hình liên quan, VD: "/portal/invoices/5"
  readAt: Date | null;  // null = Chưa đọc (hiện chấm xanh/đỏ), có ngày = Đã đọc
  createdAt: Date;      // Thời điểm gửi
}
```

### B. Payload gửi Web Push Notification (Service Worker `sw.js`)
Khi gửi Web Push tới trình duyệt của người dùng (kể cả khi đã tắt app):
```json
{
  "title": "📄 Hóa đơn kỳ 10/2026 đã phát hành",
  "body": "Hóa đơn phòng P101 là 3.250.000 đ. Hạn nộp: 05/11/2026.",
  "icon": "/icons/icon-192.png",
  "badge": "/icons/badge-72.png",
  "vibrate": [100, 50, 100],
  "data": {
    "url": "/portal/invoices/12"
  },
  "actions": [
    { "action": "view", "title": "Xem hóa đơn" },
    { "action": "close", "title": "Để sau" }
  ]
}
```

---

## 🛠️ 4. Quy Chuẩn Giao Diện Người Dùng (Mobile UI Guidelines)

Theo thiết kế wireframe tại [wireframe-tv4-khach-thue.excalidraw](wireframes/wireframe-tv4-khach-thue.excalidraw):
1. **Icon quả chuông trên Header:**
   - Nếu `unreadCount > 0`: Hiển thị chấm đỏ hoặc badge số lượng chưa đọc (ví dụ: `🔔 2`).
   - Nhấn vào chuông: Chuyển hướng ngay tới `/portal/notifications`.
2. **Trang danh sách thông báo (`/portal/notifications`):**
   - **Bộ lọc:** `[ Tất cả ] [ Hóa đơn ] [ Sự cố ] [ Tin chung ]`.
   - **Trạng thái:** Tin chưa đọc có nền xanh nhạt + chấm xanh tròn nổi bật.
   - **Tương tác:** Bấm vào tin thông báo sẽ tự động gọi API `POST /api/notifications/:id/read` để gỡ badge chưa đọc và chuyển hướng người dùng đến đúng trang đích (`link`).
   - **Nút "Đánh dấu tất cả đã đọc":** Giúp khách xóa nhanh các chấm đỏ thông báo cũ.
3. **Banner xin quyền nhận Push (PWA Promotion Card):**
   - Đặt ở cuối trang thông báo hoặc sau khi khách đăng nhập lần đầu:  
     *"📱 Bật thông báo đẩy để không bỏ lỡ hóa đơn và lịch hẹn thợ sửa khi đã đóng ứng dụng"*.
