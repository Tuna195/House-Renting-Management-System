# Thiết kế database (TV2 giữ, cả nhóm review ở Tuần 2)

Nguồn chính xác nhất là [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). Tài liệu này để **đọc hiểu** và **đưa vào báo cáo**.
Sơ đồ viết bằng [Mermaid](https://mermaid.js.org): GitHub và VS Code (extension "Markdown Preview Mermaid Support") tự vẽ thành hình.

```mermaid
erDiagram
    User ||--o{ Building : "sở hữu"
    User ||--o{ Tenant : "quản lý (chủ nhà)"
    User |o--o| Tenant : "tài khoản (khách)"
    Building ||--o{ Room : "có"
    Building ||--o{ Service : "có"
    Room ||--o{ Contract : "có"
    Room ||--o{ MeterReading : "có"
    Room ||--o{ MaintenanceRequest : "có"
    Contract ||--o{ ContractTenant : "gồm người"
    Tenant ||--o{ ContractTenant : "tham gia"
    Contract ||--o{ ContractService : "dùng dịch vụ"
    Service ||--o{ ContractService : ""
    Contract ||--o{ Invoice : "phát sinh"
    Invoice ||--o{ InvoiceItem : "gồm khoản"
    Invoice ||--o{ Payment : "được trả bởi"
    User ||--o{ Notification : "nhận"
    User ||--o{ PushSubscription : "đăng ký push"

    User {
        int id PK
        string email UK
        string passwordHash
        string fullName
        enum role
    }
    Building {
        int id PK
        int ownerId FK
        string name
        int electricityPrice
        int waterPrice
        enum waterBillingType
        int invoiceDueDay
    }
    Room {
        int id PK
        int buildingId FK
        string name
        int baseRent
        int maxOccupants
        enum status
    }
    Service {
        int id PK
        int buildingId FK
        string name
        int price
        enum unit
    }
    Tenant {
        int id PK
        int ownerId FK
        int userId FK
        string fullName
        string phone
        string idNumber
    }
    Contract {
        int id PK
        int roomId FK
        date startDate
        date endDate
        int rentPrice
        int deposit
        enum status
    }
    ContractTenant {
        int contractId PK
        int tenantId PK
        bool isPrimary
    }
    ContractService {
        int contractId PK
        int serviceId PK
        int quantity
    }
    MeterReading {
        int id PK
        int roomId FK
        string period
        int electricStart
        int electricEnd
        int waterStart
        int waterEnd
    }
    Invoice {
        int id PK
        int contractId FK
        string period
        enum status
        int totalAmount
        int paidAmount
        date dueDate
        string paymentCode UK
    }
    InvoiceItem {
        int id PK
        int invoiceId FK
        enum type
        string description
        float quantity
        int unitPrice
        int amount
    }
    Payment {
        int id PK
        int invoiceId FK
        int amount
        enum method
        string transactionRef UK
    }
    MaintenanceRequest {
        int id PK
        int roomId FK
        int createdById FK
        string title
        enum status
    }
    Notification {
        int id PK
        int userId FK
        string title
        string body
        date readAt
    }
    PushSubscription {
        int id PK
        int userId FK
        string endpoint UK
    }
```

## Giải thích các quyết định thiết kế (dùng khi vấn đáp)
| Quyết định | Lý do |
|---|---|
| Tiền lưu `Int` (VND) | Số thực bị sai số: `0.1 + 0.2 = 0.30000000000000004` |
| `Tenant` tách khỏi `User` | Không phải khách nào cũng cần tài khoản. Chủ nhà lưu hồ sơ trước, cấp tài khoản sau (`userId` có thể null) |
| `ContractTenant` (nhiều–nhiều) | Một phòng ở ghép nhiều người; một người có thể thuê nhiều lần theo thời gian |
| `Contract.rentPrice` tách khỏi `Room.baseRent` | Giá thỏa thuận có thể khác giá niêm yết; đổi giá phòng không làm sai hợp đồng cũ |
| `MeterReading` lưu cả chỉ số đầu và cuối | Hóa đơn hiển thị rõ "1250 → 1380"; sửa một tháng không ảnh hưởng tháng khác |
| `@@unique([roomId, period])`, `@@unique([contractId, period])` | Database chặn ghi trùng chỉ số hoặc hóa đơn cùng kỳ, kể cả khi code có lỗi |
| `InvoiceItem` lưu sẵn `amount` | Hóa đơn là chứng từ: đổi giá điện sau này **không được** làm thay đổi hóa đơn cũ |
| `Payment.transactionRef @unique` | **Idempotency**: cổng thanh toán gửi webhook 2 lần thì lần 2 bị chặn, không gạch nợ 2 lần |
| `Invoice.paymentCode @unique` | Mã trong nội dung chuyển khoản (VD `HD000123`) để webhook biết tiền vào thuộc hóa đơn nào |

## Quy trình sửa schema
1. Báo TV2 trong nhóm chat: "Mình cần thêm trường X vào bảng Y để làm Z"
2. Sửa `schema.prisma` trên nhánh của mình
3. `npm run db:migrate -- --name them_truong_x` → sinh thư mục mới trong `prisma/migrations/`
4. **Commit cả `schema.prisma` lẫn thư mục migration**
5. Người khác pull về thì chạy `npm run db:migrate` để áp dụng
6. Cập nhật sơ đồ ở file này và kiểu dữ liệu trong `frontend/src/types/index.ts`

## Câu hỏi để review ở Tuần 2
- [ ] Có cần lưu **lịch sử giá** (giá điện tháng trước khác tháng này) không? Hiện tại `InvoiceItem.unitPrice` đã lưu giá tại thời điểm tạo hóa đơn
- [ ] Có cần lưu **ảnh** (ảnh phòng, ảnh sự cố, ảnh công tơ) không? Nếu có thì lưu ở đâu? (Gợi ý: Cloudinary miễn phí, DB chỉ lưu URL)
- [ ] Thông tin **tài khoản ngân hàng nhận tiền** của chủ nhà (cho VietQR, Tuần 8) lưu ở `User` hay `Building`?
- [ ] Có cần **xóa mềm** (`deletedAt`) thay vì xóa hẳn không?
