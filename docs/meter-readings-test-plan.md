# Kiểm thử và đề xuất CI cho chỉ số điện nước

## Kiểm thử thực thi

Cài theo lockfile: `npm --prefix backend ci` và `npm --prefix frontend ci`.
Test đối chiếu hợp đồng frontend/backend import schema backend nên cần dependencies của cả hai package.
Không thêm runtime dependency cho ứng dụng; user-event chỉ là devDependency mô phỏng bàn phím trong test.

- `npm --prefix backend test`: kiểm tra ID/schema và HTTP loopback qua Express/error handler thật,
  Prisma và auth được giả lập để không truy cập DB hoặc cần credential.
  Bao phủ lỗi 400 có path, JSON sai, 404, 409 nghiệp vụ, hóa đơn khóa và không lộ metadata DB.
- `npm --prefix frontend test`: Vitest, React Testing Library, jsdom, user-event.
  Test cùng dữ liệu số ở UI và Zod backend để phát hiện lệch giới hạn/quy tắc.
  Test ô nhập Ant Design thật: giữ dữ liệu sai qua blur, aria-invalid/aria-describedby,
  lỗi server, Tab/Shift+Tab, Enter/Shift+Enter bỏ qua dòng khóa, biên bảng và IME.
  Test cảnh báo riêng điện/nước ở 0, dưới ngưỡng gấp đôi, đúng ngưỡng và kỳ trước bằng 0.
  Test API error parser không tin response và ánh xạ index theo snapshot roomId.
  Test concurrent điều khiển resolve/reject để tái hiện phản hồi muộn/ngược thứ tự,
  scope/version, lỗi server muộn, refetch và chống request trùng cùng scope.
- `npm --prefix backend run typecheck` và `npm --prefix backend run build`.
- `npm --prefix frontend run build`: bao gồm typecheck.
- `git diff --check`.

## CI đề xuất — chưa tích hợp

Chưa tạo/sửa workflow, cấu hình GitHub hay branch protection. Nhóm cần thống nhất trước:

1. Trigger PR vào dev và chạy trên Node 22 tương thích lockfile (ít nhất 22.12 với Vite 7).
2. Cài cả hai package theo lockfile, tạo Prisma client nếu job cài đặt chưa thực hiện.
3. Chạy các lệnh kiểm tra phía trên, không cần DB production/shared hoặc credential thật.
4. Chọn tên required status checks và cấu hình branch protection trên dev để chặn merge khi check fail.
   Workflow chạy thành công/thất bại đơn thuần chưa bảo đảm chặn merge nếu không đặt required checks.
5. Định nghĩa cách xử lý 7 billing TODO hiện có; không tự bỏ TODO, đổi test hay che lỗi.

## Giới hạn

jsdom không kiểm chứng layout/responsive, focus trên trình duyệt thực hoặc screen reader thực tế.
Cần smoke test 320px/1280px và browser E2E trước khi chốt trải nghiệm người dùng.
Test HTTP dùng Prisma giả không chứng minh rollback/isolation hay cuộc đua phát hành hóa đơn trên PostgreSQL.
Bản nháp chỉ sống trong trang hiện tại; không ngăn mất dữ liệu khi reload hoặc ghi đồng thời giữa nhiều tab.
