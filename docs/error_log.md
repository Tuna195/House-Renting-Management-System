# Error log

## ERR-20261017-001

- **Error Description:** Backend typecheck/build không đạt vì thiếu kiểu Prisma; ngăn xác nhận toàn bộ backend sau khi bổ sung mô tả ca kiểm thử billing.
- **Reproduction/Evidence:** Ngày 17/10/2026, chạy `npm --prefix backend run typecheck` và `npm --prefix backend run build`, cả hai exit 2: `auth.ts(3,15)` thiếu export `Role`; `error-handler.ts(19,29)` thiếu `PrismaClientKnownRequestError`. Billing regression exit 0: 5 passed, 6 todo.
- **Root Cause Analysis:** Đã xác nhận lỗi ở các tham chiếu kiểu `@prisma/client` ngoài file test thay đổi. Giả thuyết **chưa xác minh**: Prisma Client cục bộ chưa được generate đúng schema. Chưa xác nhận đây là lỗi baseline bằng một checkout độc lập.
- **Fix Applied:** Chưa sửa Prisma/config hoặc database vì ngoài phạm vi điền kết quả tính tay. Chỉ cập nhật `billing.test.ts` và tài liệu công thức.
- **Verification:** Billing regression đạt; backend typecheck/build chưa đạt. Cần kiểm tra Prisma Client và chạy lại hai lệnh trước khi xác nhận backend build được.
- **Lessons Learned:** Phân biệt test đang chạy với `it.todo`; regression billing đạt không thay thế typecheck/build. Không chạy migration để sửa lỗi kiểu generated client khi chưa xác minh nguyên nhân.
- **Date/Status:** 2026-10-17T09:56:00+07:00 — resolved (xem xác minh bổ sung bên dưới).

### Xác minh bổ sung ngày 17/10/2026 (+07:00)

- **Reproduction/Evidence:** Người dùng gặp runtime `@prisma/client did not initialize yet` khi chạy API. Lần generate trong sandbox bị `EPERM` khi cập nhật cache engine; chạy lại với quyền được cấp thành công, exit 0.
- **Root Cause Analysis:** Xác nhận Prisma Client cục bộ chưa được generate theo schema: sau generate, khởi tạo client và cả hai kiểm tra TypeScript đều đạt, không sửa source.
- **Fix Applied:** Chạy `./node_modules/.bin/prisma generate` từ `backend`, tạo Prisma Client v6.19.3. Không migration, seed hoặc thay đổi dữ liệu DB.
- **Verification:** Backend typecheck và build exit 0; tạo `new PrismaClient()` rồi disconnect exit 0. Chưa kiểm tra kết nối DB hoặc health API.
- **Lessons Learned:** Sau cài thư viện, nếu client chưa khởi tạo hoặc thiếu kiểu generated, chạy Prisma generate rồi kiểm tra lại; không cần nâng phiên bản Prisma hoặc reset DB.

## ERR-20261017-002

- **Error Description:** Frontend không khởi động, `sh: vite: command not found`.
- **Reproduction/Evidence:** Người dùng chạy `npm --prefix frontend run dev`, shell không tìm thấy Vite; kiểm tra không có executable `frontend/node_modules/.bin/vite`.
- **Root Cause Analysis:** Chưa cài đủ dependencies frontend từ lockfile.
- **Fix Applied:** Chạy `npm --prefix frontend ci` với quyền mạng được cấp; thêm 166 packages, audit không phát hiện vulnerability. Không sửa package/lockfile.
- **Verification:** Frontend build (gồm typecheck) exit 0; có cảnh báo bundle lớn hơn 500 kB. Vite v7.3.6 khởi động thành công tại `http://127.0.0.1:5173/`. Sandbox ban đầu chặn bind cổng, chạy lại với quyền được cấp thành công. Chưa kiểm tra luồng đăng nhập/API.
- **Lessons Learned:** Cài dependencies riêng cho cả backend và frontend bằng npm ci; thư viện backend không cung cấp Vite cho frontend.
- **Date/Status:** 2026-10-17 (+07:00) — resolved.
