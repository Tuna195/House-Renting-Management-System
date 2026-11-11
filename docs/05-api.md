# Danh sách API (TV2 giữ; ai làm API nào thì tự cập nhật trạng thái)

Tất cả bắt đầu bằng `/api`. 🔒 = cần đăng nhập. Vai trò: **L** = chủ nhà, **T** = khách thuê.
Trạng thái: ✅ xong · 🚧 đang làm · ⬜ chưa làm. Request mẫu để thử: `backend/api.http`.

## Auth (TV2)
| Method | Đường dẫn | Vai trò | Mô tả | TT |
|---|---|---|---|---|
| POST | `/auth/register` | — | Chủ nhà đăng ký | ✅ |
| POST | `/auth/login` | — | Đăng nhập, trả `{ user, token }` | ✅ |
| GET | `/auth/me` | 🔒 L,T | Thông tin tài khoản hiện tại | ✅ |
| POST | `/auth/change-password` | 🔒 L,T | Đổi mật khẩu | ⬜ T10 |

## Tòa nhà ✅ (mẫu), Phòng, Dịch vụ (TV1)
| Method | Đường dẫn | Vai trò | Mô tả | TT |
|---|---|---|---|---|
| GET/POST | `/buildings` | 🔒 L | Danh sách, tạo | ✅ |
| GET/PATCH/DELETE | `/buildings/:id` | 🔒 L | Xem, sửa, xóa | ✅ |
| GET | `/rooms?buildingId=&status=` | 🔒 L | Danh sách phòng, lọc | ⬜ T3 |
| POST | `/rooms` | 🔒 L | Tạo phòng | ⬜ T3 |
| GET/PATCH/DELETE | `/rooms/:id` | 🔒 L | Chi tiết (kèm hợp đồng hiện tại), sửa, xóa | ⬜ T3 |
| GET | `/services?buildingId=` | 🔒 L | Dịch vụ của tòa nhà | ⬜ T4 |
| POST/PATCH/DELETE | `/services`, `/services/:id` | 🔒 L | | ⬜ T4 |
| GET | `/dashboard/summary` | 🔒 L | Số liệu tổng quan | ⬜ T6 |
| GET | `/dashboard/revenue?months=6` | 🔒 L | Doanh thu theo tháng | ⬜ T8 |

## Khách thuê, Hợp đồng (TV2)
| Method | Đường dẫn | Vai trò | Mô tả | TT |
|---|---|---|---|---|
| GET | `/tenants?q=` | 🔒 L | Danh sách, tìm theo tên hoặc SĐT | ⬜ T3 |
| POST/PATCH/DELETE | `/tenants`, `/tenants/:id` | 🔒 L | | ⬜ T3 |
| POST | `/tenants/:id/account` | 🔒 L | Cấp tài khoản đăng nhập cho khách | ⬜ T3 |
| GET | `/contracts?status=&buildingId=` | 🔒 L | Danh sách | ⬜ T4 |
| POST | `/contracts` | 🔒 L | Tạo (kèm người ở, dịch vụ) | ⬜ T4 |
| GET/PATCH | `/contracts/:id` | 🔒 L | Chi tiết, sửa | ⬜ T4 |
| POST | `/contracts/:id/end` | 🔒 L | Kết thúc hợp đồng | ⬜ T4 |

## Chỉ số, Hóa đơn, Thanh toán (TV3, TV2)
| Method | Đường dẫn | Vai trò | Mô tả | TT |
|---|---|---|---|---|
| GET | `/meter-readings?buildingId=&period=` | 🔒 L | Bảng chỉ số cả tòa nhà trong kỳ (kèm chỉ số cũ gợi ý) | ⬜ T4 |
| PUT | `/meter-readings/bulk` | 🔒 L | Lưu nhiều phòng một lần | ⬜ T4 |
| POST | `/invoices/generate` | 🔒 L | `{ buildingId, period }` → tạo hóa đơn nháp hàng loạt | ⬜ T5 |
| GET | `/invoices?period=&status=&buildingId=` | 🔒 L | Danh sách | ⬜ T5 |
| GET/PATCH | `/invoices/:id` | 🔒 L | Chi tiết, sửa khi còn nháp | ⬜ T5 |
| POST | `/invoices/:id/issue` | 🔒 L | Phát hành | ⬜ T6 |
| POST | `/invoices/:id/payments` | 🔒 L | Ghi nhận thanh toán thủ công | ⬜ T6 |
| GET | `/invoices/:id/vietqr` | 🔒 L,T | Thông tin và URL ảnh QR | ⬜ T8 |
| POST | `/payments/webhook` | — (xác thực bằng khóa bí mật) | Cổng thanh toán gọi khi có tiền vào | ⬜ T9 |
| POST | `/jobs/:name/run` | 🔒 L | Chạy job ngay (để demo) | ⬜ T8 |

## Sự cố, Thông báo, Cổng khách thuê, Push (TV4)
| Method | Đường dẫn | Vai trò | Mô tả | TT |
|---|---|---|---|---|
| POST | `/portal/maintenance` | 🔒 T | Khách gửi yêu cầu (phòng lấy từ hợp đồng hiệu lực) | ⬜ T3 |
| GET | `/portal/maintenance` | 🔒 T | Yêu cầu của tôi | ⬜ T3 |
| GET | `/maintenance?status=` | 🔒 L | Mọi yêu cầu ở các tòa nhà của tôi | ⬜ T4 |
| PATCH | `/maintenance/:id` | 🔒 L | Đổi trạng thái | ⬜ T4 |
| GET | `/notifications` | 🔒 L,T | Thông báo của tôi | ⬜ T4 |
| POST | `/notifications/:id/read`, `/notifications/read-all` | 🔒 L,T | Đánh dấu đã đọc | ⬜ T4 |
| GET | `/portal/me` | 🔒 T | Phòng, hợp đồng hiệu lực | ⬜ T5 |
| GET | `/portal/invoices`, `/portal/invoices/:id` | 🔒 T | Hóa đơn đã phát hành của tôi | ⬜ T5 |
| GET | `/push/public-key` | — | VAPID public key | ⬜ T9 |
| POST/DELETE | `/push/subscribe` | 🔒 L,T | Đăng ký hoặc hủy nhận push | ⬜ T9 |

## Realtime (TV1)
Socket.IO, cùng cổng với API. Kết nối kèm `auth: { token }`. Server cho mỗi user vào room `user:<id>`.
| Sự kiện (server → client) | Dữ liệu | Khi nào | TT |
|---|---|---|---|
| `notification:new` | `Notification` | Có thông báo mới cho user | ⬜ T9 |
| `invoice:paid` | `{ invoiceId }` | Webhook gạch nợ xong | ⬜ T10 |
| `maintenance:new` | `MaintenanceRequest` | Khách gửi yêu cầu mới (gửi cho chủ nhà) | ⬜ T10 |

### Chỉ số điện nước

`GET /api/meter-readings?buildingId=1&period=2026-10` (LANDLORD) trả mảng
`{ room: { id, name }, current: MeterReading | null, previous: MeterReading | null, locked: boolean }`.
`previous` là kỳ gần nhất nhỏ hơn kỳ chọn, không bắt buộc liên tiếp.
Phòng có hợp đồng ACTIVE hoặc ENDED giao với tháng theo múi giờ Việt Nam; loại CANCELLED.
Ngày kết thúc được tính bao gồm ngày đó. Chưa có lịch sử thì giao diện để trống.

`PUT /api/meter-readings/bulk` nhận `{ buildingId, period, readings: [{ roomId, electricStart, electricEnd, waterStart, waterEnd }] }`, trả `{ saved: number }`.
Chỉ số nguyên 0..2147483647. Lỗi 400 có `details` là Zod issues với path
`readings/index/field`, hoặc `{ roomId }` khi phòng không hợp lệ. Không có quyền tòa nhà trả 404.
Hóa đơn có issuedAt hoặc trạng thái UNPAID/PARTIAL/PAID khóa ghi và trả 409 cùng roomId.
Transaction Serializable đảm bảo ghi cả lô nguyên tử; luồng phát hành hóa đơn tương lai
cần phối hợp cùng cơ chế transaction/khóa và xử lý retry xung đột để tránh cuộc đua phát hành/ghi chỉ số.

### Quy tắc ID tại biên HTTP

ID query/path nhận chuỗi thập phân chuẩn từ `1` đến `2147483647`; ID trong JSON body nhận number nguyên
trong cùng giới hạn. Không tự ép chuỗi/boolean/mảng thành ID. Sai định dạng hoặc vượt phạm vi trả **400**
trước khi gọi Prisma; ID hợp lệ nhưng tài nguyên không tồn tại/không thuộc chủ nhà vẫn trả **404**.
Ví dụ `buildingId=01`, `buildingId=1e3`, `buildingId=0x10`, `buildingId=2147483648` đều bị từ chối.
Xem [thiết kế validation và phạm vi áp dụng](validation-boundaries.md).
