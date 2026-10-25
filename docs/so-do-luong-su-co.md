# 🛠️ Tài Liệu Phân Tích & Thiết Kế Luồng Báo Cáo Sự Cố & Cổng Khách Thuê

> **Tài liệu phục vụ Tuần 2: Phân tích & Thiết kế**  
> **Người phụ trách:** **TV4** (Phụ trách Trải nghiệm Khách thuê & Giao diện di động)  
> **Review chéo bởi:** **TV1** (Trưởng nhóm / PM)

---

## 📌 1. Bối cảnh & Mục tiêu nghiệp vụ

Khách thuê trọ thường gặp các hư hỏng vật chất trong phòng (hỏng vòi nước, cháy bóng đèn, kẹt khóa cửa, tắc cống, hỏng bình nóng lạnh). Trong thực tế:
- **Khó khăn của khách:** Thường phải nhắn tin Zalo hoặc gọi điện thoại cho chủ nhà, hay bị trôi tin nhắn, không biết khi nào thợ đến sửa, không lưu lại được lịch sử.
- **Khó khăn của chủ nhà:** Nhận phản ánh lộn xộn, quên lịch hẹn thợ, khó kiểm soát chi phí sửa chữa theo từng phòng.
- **Giải pháp của hệ thống:**
  1. Cung cấp **form báo sự cố chuẩn hóa** trên điện thoại (chọn phân loại, chụp ảnh hiện trường gửi trực tiếp).
  2. Xây dựng **luồng trạng thái minh bạch**: `OPEN` ➔ `IN_PROGRESS` ➔ `DONE` (hoặc `REJECTED`).
  3. Tự động gửi **thông báo chuông (In-app)** và **Web Push Notification** tới điện thoại của khách và chủ nhà khi có cập nhật tiến độ.

---

## 📊 2. Sơ đồ Use Case phân hệ Khách thuê (Tenant Use Case)

File ảnh vector SVG độ nét cao: [so-do-usecase-khach-thue.svg](file:///d:/2026.1/Web/House-Renting-Management-System-dev/House-Renting-Management-System-dev/docs/images/so-do-usecase-khach-thue.svg)

```mermaid
flowchart LR
    Tenant((Khách thuê))
    Bank((VietQR Bank))
    Landlord((Chủ nhà))

    subgraph Portal["Hệ Thống Cổng Khách Thuê (Tenant Portal)"]
        UC1(["UC1: Đăng nhập tài khoản"])
        UC2(["UC2: Xem phòng & hợp đồng"])
        UC3(["UC3: Xem danh sách hóa đơn"])
        UC4(["UC4: Chi tiết HĐ & Quét VietQR"])
        UC5(["UC5: Gửi yêu cầu sửa chữa ⭐"])
        UC6(["UC6: Theo dõi tiến độ sự cố"])
        UC7(["UC7: Nhận Web Push & In-app"])
        UC8(["UC8: Cài PWA lên điện thoại"])
    end

    Tenant --> UC1
    Tenant --> UC2
    Tenant --> UC3
    Tenant --> UC4
    Tenant --> UC5
    Tenant --> UC6
    Tenant --> UC7
    Tenant --> UC8

    UC4 -.->|đối soát tự động| Bank
    UC5 -.->|thông báo & xử lý| Landlord
    UC6 -.->|cập nhật tiến độ| Landlord
```

---

## 🔄 3. Sơ đồ Trạng thái Yêu cầu Sửa chữa (State Machine Diagram)

File ảnh vector SVG độ nét cao: [so-do-trang-thai-su-co.svg](file:///d:/2026.1/Web/House-Renting-Management-System-dev/House-Renting-Management-System-dev/docs/images/so-do-trang-thai-su-co.svg)

```mermaid
stateDiagram-v2
    [*] --> OPEN: Khách gửi form báo hỏng (kèm ảnh)

    OPEN --> IN_PROGRESS: Chủ nhà tiếp nhận & hẹn thợ sửa
    OPEN --> REJECTED: Chủ nhà từ chối (kèm lý do)

    IN_PROGRESS --> DONE: Thợ sửa xong, chủ nhà kiểm tra
    IN_PROGRESS --> REJECTED: Hủy ngang / khách tự khắc phục

    DONE --> [*]
    REJECTED --> [*]

    note right of OPEN
      Mã trạng thái: OPEN (Màu vàng)
      Quyền hạn: Khách tạo mới, có thể chỉnh sửa mô tả
      Kích hoạt: Bắn chuông cho Chủ nhà
    end note

    note right of IN_PROGRESS
      Mã trạng thái: IN_PROGRESS (Màu xanh dương)
      Quyền hạn: Chỉ Chủ nhà được chuyển
      Kích hoạt: Bắn Web Push cho Khách thuê kèm giờ hẹn
    end note

    note right of DONE
      Mã trạng thái: DONE (Màu xanh lá)
      Quyền hạn: Chủ nhà xác nhận nghiệm thu
      Kích hoạt: Ghi nhận resolvedAt, báo Khách thuê
    end note

    note right of REJECTED
      Mã trạng thái: REJECTED (Màu đỏ)
      Quyền hạn: Chủ nhà từ chối kèm lý do rõ ràng
      Kích hoạt: Bắn thông báo giải thích cho Khách thuê
    end note
```

---

## ⚡ 4. Sơ đồ Tuần tự Luồng Báo Cáo & Xử Lý Sự Cố (Sequence Diagram)

File ảnh vector SVG độ nét cao: [so-do-tuan-tu-su-co.svg](file:///d:/2026.1/Web/House-Renting-Management-System-dev/House-Renting-Management-System-dev/docs/images/so-do-tuan-tu-su-co.svg)

```mermaid
sequenceDiagram
    autonumber
    actor T as Khách thuê (Mobile)
    participant C as Portal Client (React)
    participant S as API Server (Express)
    participant DB as PostgreSQL (Neon)
    actor L as Chủ nhà (Desktop)

    Note over T,L: Giai đoạn 1: Khách gửi sự cố mới
    T->>C: Nhập tiêu đề, phân loại, đính kèm ảnh
    C->>S: POST /api/portal/maintenance { title, description, imageUrl, roomId }
    S->>DB: Prisma: prisma.maintenanceRequest.create(...)
    DB-->>S: Trả về bản ghi mới (status: "OPEN")
    S-->>L: 🔔 Socket.IO / Push: "Sự cố mới phòng P101"
    S-->>C: HTTP 201 Created
    C-->>T: Thông báo "Gửi thành công! Đang chờ chủ nhà duyệt"

    Note over T,L: Giai đoạn 2: Chủ nhà tiếp nhận & điều phối
    L->>S: PATCH /api/maintenance/:id { status: "IN_PROGRESS", note: "Thợ hẹn 14:00" }
    S->>DB: Prisma: prisma.maintenanceRequest.update(...)
    DB-->>S: Cập nhật thành công
    S-->>T: 📲 Web Push: "Sự cố vòi nước đang được xử lý (hẹn 14h)"
    S-->>L: HTTP 200 OK

    Note over T,L: Giai đoạn 3: Hoàn tất & Nghiệm thu
    L->>S: PATCH /api/maintenance/:id { status: "DONE", resolvedAt: now() }
    S->>DB: Prisma: prisma.maintenanceRequest.update(...)
    S-->>T: 🎉 Thông báo: "Sự cố phòng P101 đã sửa xong hoàn tất!"
    S-->>L: HTTP 200 OK
```

---

## 🔒 5. Ma trận Phân quyền & Hành động (RBAC Matrix)

| Hành động | Khách thuê (`TENANT`) | Chủ nhà (`LANDLORD`) | Ghi chú bảo mật |
|---|:---:|:---:|---|
| **Xem danh sách sự cố** | Chỉ xem của phòng mình | Xem toàn bộ các tòa nhà sở hữu | Lọc chặt theo `roomId` và hợp đồng hiệu lực |
| **Gửi sự cố mới** | ✅ Được phép | ❌ Không (chủ không tự báo) | Mặc định gán `status = OPEN` |
| **Sửa mô tả khi còn `OPEN`** | ✅ Được phép | ✅ Được phép | Tránh khách sửa khi thợ đã bắt đầu làm |
| **Đổi sang `IN_PROGRESS`** | ❌ Không | ✅ Được phép | Khách không thể tự nhận thợ |
| **Đổi sang `DONE` / `REJECTED`** | ❌ Không | ✅ Được phép | Bắt buộc ghi nhận `resolvedAt` |
| **Xóa sự cố** | ❌ Không | ✅ Khi là dữ liệu rác | Khuyên dùng ẩn thay vì xóa cứng |

---

## 📬 6. Ma trận Thông báo Tự động (Notification Matrix)

| Mã sự kiện | Sự kiện | Người nhận | Tiêu đề mẫu | Nội dung mẫu | URL đích |
|:---:|---|---|---|---|---|
| `NOTIF_01` | Hóa đơn mới phát hành | Khách thuê | 📄 Hóa đơn kỳ 10/2026 | Hóa đơn phòng P101 là 3.250.000 đ. Hạn: 05/11. | `/portal/invoices/:id` |
| `NOTIF_02` | Khách gửi sự cố mới | Chủ nhà | ⚠️ Sự cố phòng P101 | Khách báo: Vòi nước bồn rửa bát bị rò rỉ. | `/maintenance` |
| `NOTIF_03` | Tiếp nhận sự cố | Khách thuê | 🛠️ Tiến độ: ĐANG XỬ LÝ | Yêu cầu sửa vòi nước đã tiếp nhận. Thợ hẹn 14h. | `/portal/maintenance` |
| `NOTIF_04` | Sửa xong sự cố | Khách thuê | 🟢 Tiến độ: HOÀN TẤT | Sự cố vòi nước đã sửa xong. Vui lòng kiểm tra! | `/portal/maintenance` |
| `NOTIF_05` | Từ chối sự cố | Khách thuê | 🔴 Sự cố bị từ chối | Yêu cầu bị từ chối do: Hư hỏng do sử dụng sai. | `/portal/maintenance` |
| `NOTIF_06` | Gạch nợ VietQR tự động | Khách + Chủ | 💰 Thanh toán thành công | Đã nhận 3.250.000 đ chuyển khoản cho kỳ 10/2026. | `/portal/invoices/:id` |
| `NOTIF_07` | Nhắc nợ tự động (Cron) | Khách thuê | ⏰ Nhắc đóng tiền phòng | Hóa đơn kỳ 10/2026 đã quá hạn nộp. Vui lòng thanh toán. | `/portal/invoices/:id` |

---

## 🎯 7. Liên kết bàn giao Tuần 2 của TV4

- 🎨 **File vẽ Excalidraw:** [`docs/wireframes/wireframe-tv4-khach-thue.excalidraw`](wireframes/wireframe-tv4-khach-thue.excalidraw)
- 🌐 **Trang xem Wireframe HTML:** [`docs/wireframes/wireframe-preview.html`](wireframes/wireframe-preview.html)
- 🖼️ **Ảnh Sơ đồ trạng thái:** [`docs/images/so-do-trang-thai-su-co.svg`](images/so-do-trang-thai-su-co.svg)
- 🖼️ **Ảnh Sơ đồ tuần tự:** [`docs/images/so-do-tuan-tu-su-co.svg`](images/so-do-tuan-tu-su-co.svg)
- 🖼️ **Ảnh Sơ đồ Use Case:** [`docs/images/so-do-usecase-khach-thue.svg`](images/so-do-usecase-khach-thue.svg)
