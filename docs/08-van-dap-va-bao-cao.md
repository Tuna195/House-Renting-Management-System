# Chuẩn bị vấn đáp và báo cáo

## Bộ câu hỏi vấn đáp thường gặp
> Mỗi người tự trả lời **thành tiếng** được hết các câu chung và các câu về phần mình. Tập từ Tuần 10.

### Chung (ai cũng phải trả lời được)
1. Hệ thống giải quyết vấn đề gì? Ai dùng? Khác gì Excel cộng Zalo?
2. Vẽ kiến trúc hệ thống: frontend, backend, database giao tiếp với nhau thế nào?
3. Một request từ lúc bấm nút "Lưu" đến khi dữ liệu vào DB đi qua những file nào?
4. REST API là gì? Vì sao tạo dùng POST, sửa dùng PATCH?
5. Vì sao chọn React, Express, PostgreSQL, Prisma? Có phương án nào khác?
6. TypeScript khác gì JavaScript? Lợi ích cụ thể trong project này?
7. Đăng nhập hoạt động thế nào? JWT là gì, lưu ở đâu, hết hạn thì sao?
8. Mật khẩu lưu thế nào? Vì sao không lưu dạng gốc? bcrypt là gì?
9. Làm sao chủ nhà A không xem được dữ liệu của chủ nhà B? Chỉ vào code.
10. CORS là gì? Vì sao khi dev không bị lỗi CORS?
11. Nhóm phân công và làm việc nhóm thế nào? Dùng Git ra sao?

### Theo từng phần
| Phần | Câu hỏi dễ bị hỏi |
|---|---|
| **Tính tiền (TV3)** | Tính một hóa đơn cụ thể trên giấy. Vào giữa tháng tính thế nào? Vì sao lưu tiền bằng số nguyên? Vì sao hóa đơn lưu sẵn thành tiền thay vì tính lại mỗi lần? Unit test là gì, đã test những gì? |
| **Hợp đồng (TV2)** | Làm sao đảm bảo một phòng không có 2 hợp đồng hiệu lực? Transaction là gì, dùng ở đâu? |
| **Webhook (TV2)** | Webhook khác API thường thế nào? Làm sao biết request webhook là thật? Cổng thanh toán gửi 2 lần thì sao (idempotency)? Khách chuyển thiếu tiền hoặc ghi sai nội dung thì sao? |
| **PWA (TV4)** | PWA khác web thường và app native thế nào? Service Worker là gì, chạy ở đâu, vòng đời ra sao? manifest.json có gì? Vì sao bắt buộc HTTPS? Cache những gì, chiến lược cache nào? |
| **Web Push (TV4)** | VAPID là gì? Luồng từ server gửi đến điện thoại hiển thị thông báo đi qua những bên nào? Vì sao iPhone hạn chế? |
| **Realtime (TV1)** | WebSocket khác HTTP thế nào? Vì sao không dùng polling (gọi API mỗi 5 giây)? Socket.IO xác thực người dùng thế nào? |
| **Cron (TV3)** | Cron expression `0 7 1 * *` nghĩa là gì? Server khởi động lại giữa chừng thì sao? Chạy 2 lần có tạo trùng hóa đơn không? |
| **Dashboard (TV1)** | Câu truy vấn tính doanh thu viết thế nào? Dữ liệu nhiều thì có chậm không? |

### Câu hỏi "bẫy" và yêu cầu sửa code tại chỗ
- "Thêm một trường *Ghi chú* cho phòng, hiển thị lên giao diện." → phải làm được trong ~10 phút: schema → migrate → zod → types → form → bảng
- "Đổi hạn đóng tiền thành ngày 10." / "Thêm kiểm tra số người không vượt quá `maxOccupants`."
- "Tắt mạng đi, app còn chạy không?" (PWA)
- "Mở DevTools cho xem request đăng nhập gửi gì, nhận gì."

## Dàn ý báo cáo (điều chỉnh theo mẫu của giáo viên nếu có)
| Chương | Nội dung | Người viết |
|---|---|---|
| 1. Giới thiệu | Bối cảnh, vấn đề, mục tiêu, phạm vi, khảo sát chủ trọ | TV1 |
| 2. Khảo sát và phân tích | Hệ thống tham khảo, tác nhân, use case, yêu cầu chức năng và phi chức năng | TV1 |
| 3. Công nghệ sử dụng | React, Express, Prisma, PostgreSQL; **PWA, Web Push, VietQR và webhook, WebSocket**: lý thuyết và lý do chọn | Mỗi người viết phần công nghệ mình làm |
| 4. Thiết kế | Kiến trúc tổng thể, ERD, thiết kế API, luồng tính tiền, luồng thanh toán (sequence diagram), giao diện | TV2 (kiến trúc, ERD), TV3 (tính tiền), mỗi người viết luồng của mình |
| 5. Triển khai | Cấu trúc code, các chức năng kèm ảnh chụp, deploy | Mỗi người viết phần mình |
| 6. Kiểm thử | Unit test, kịch bản kiểm thử thủ công, Lighthouse | TV3, TV4 |
| 7. Kết luận | Đạt được, hạn chế, hướng phát triển | TV1 |
| Phụ lục | Phân công và đóng góp từng thành viên, link repo, link demo | TV1 |

## Slide bảo vệ (khoảng 15 phút, 12–15 slide)
1. Vấn đề và giải pháp (1–2 slide)
2. Kiến trúc và công nghệ (2 slide)
3. **Demo trực tiếp (7–8 phút)** theo kịch bản Tuần 7, nhấn mạnh 3 điểm: *cài PWA trên điện thoại thật → quét QR thanh toán → hóa đơn tự chuyển "Đã thanh toán" và điện thoại nhận push*
4. Điểm kỹ thuật nổi bật (2–3 slide): idempotency webhook, service worker, tính tiền có test
5. Phân công và quy trình làm việc nhóm (1 slide), kết luận (1 slide)

> 🎥 **Luôn có video demo quay sẵn** phòng khi mạng ở phòng bảo vệ chập chờn.
