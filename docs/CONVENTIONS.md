# Quy ước code của nhóm

> **Khi nhờ AI viết code: dán file này cùng file mẫu liên quan vào prompt.** AI sẽ viết theo đúng kiểu của nhóm.
> Ai muốn đổi quy ước thì đề xuất trong buổi họp, không tự đổi.

## 1. Chung
- Ngôn ngữ: **TypeScript** cho cả frontend và backend. Hạn chế dùng `any`, nếu buộc phải dùng thì ghi chú lý do.
- Đặt tên **biến, hàm, trường dữ liệu bằng tiếng Anh** (`rentPrice`, `createInvoice`). **Thông báo hiển thị cho người dùng bằng tiếng Việt.** Comment viết tiếng Việt.
- Đặt tên:
  - biến, hàm: `camelCase`
  - component, type, interface: `PascalCase`
  - hằng số: `UPPER_SNAKE_CASE`
  - file backend: `kebab-case` hoặc `ten-module.loai.ts` (`rooms.service.ts`)
  - file component React: `PascalCase.tsx` (`RoomsPage.tsx`)
- **Tiền là số nguyên VND (`Int`)**, không bao giờ dùng số thực. Hiển thị bằng `formatVND()`.
- Kỳ thu tiền: chuỗi `"YYYY-MM"`.
- Bật **Format on Save** trong VS Code (Prettier). File `.prettierrc` đã cấu hình sẵn.

## 2. Backend

### Cấu trúc một module (copy `src/modules/buildings/`)
| File | Làm gì | Không làm gì |
|---|---|---|
| `x.schema.ts` | Định nghĩa zod schema kiểm tra dữ liệu đầu vào | |
| `x.service.ts` | Logic nghiệp vụ và truy vấn Prisma | Không đụng tới `req`, `res` |
| `x.controller.ts` | Lấy dữ liệu từ `req`, gọi service, trả `res.json(...)` | Không viết truy vấn DB |
| `x.routes.ts` | Khai báo đường dẫn, middleware `requireAuth`, `requireRole`, `validateBody` | |

### API
- Đường dẫn dạng số nhiều, kebab-case: `/api/meter-readings`, `/api/invoices/:id/issue`
- Phương thức: `GET` xem, `POST` tạo, `PATCH` sửa một phần, `DELETE` xóa. Hành động đặc biệt dùng `POST /:id/ten-hanh-dong`.
- Thành công: trả **dữ liệu trực tiếp** (object hoặc mảng). Tạo mới trả `201`, xóa trả `204`.
- Lỗi: `throw new AppError(status, 'Thông báo tiếng Việt')`. errorHandler sẽ trả `{ message, details }`.
  - `400` dữ liệu sai · `401` chưa đăng nhập · `403` không có quyền · `404` không tìm thấy · `409` xung đột hoặc trùng
- **Không cần try/catch trong controller**, Express 5 tự chuyển lỗi vào errorHandler.

### Bảo mật (bắt buộc, sẽ bị hỏi khi vấn đáp)
- **Mọi truy vấn dữ liệu của chủ nhà phải lọc theo `ownerId`**, kể cả gián tiếp (phòng → tòa nhà → ownerId). Xem `buildings.service.ts`.
- API khách thuê (`/api/portal/...`) chỉ trả dữ liệu của chính khách đó, lấy theo `req.user.id`, **không tin id gửi từ client**.
- Không bao giờ trả `passwordHash` ra ngoài.
- Không commit file `.env`.

### Database
- Sửa `schema.prisma` thì chạy `npm run db:migrate -- --name mo_ta_ngan` và **commit cả thư mục `prisma/migrations`**.
- Thao tác ghi nhiều bảng cùng lúc (tạo hợp đồng và cập nhật trạng thái phòng; ghi nhận thanh toán và cập nhật hóa đơn) phải dùng `prisma.$transaction`.

## 3. Frontend

### Cấu trúc một tính năng (copy `src/features/buildings/`)
- `src/api/x.ts`: các hàm gọi API, trả về `r.data`
- `src/features/x/XPage.tsx`: trang chính
- `src/features/x/XFormModal.tsx`: form thêm và sửa
- Kiểu dữ liệu thêm vào `src/types/index.ts`
- Trang mới: thêm route ở `router.tsx`, xóa `owner/week` của mục đó trong `navigation.tsx`

### Quy tắc
- Gọi API **chỉ qua `api` trong `src/api/client.ts`**, không gọi `fetch`/`axios` trực tiếp trong component.
- Lấy dữ liệu bằng `useQuery`, thêm/sửa/xóa bằng `useMutation`, xong thì `invalidateQueries`.
- Thông báo: `const { message } = App.useApp()`, lỗi thì `message.error(getErrorMessage(error))`.
- Ưu tiên dùng component có sẵn của Ant Design (Table, Form, Modal...), không tự viết lại.
- Kiểm tra giao diện ở **cả màn hình điện thoại** (DevTools → Toggle device toolbar), vì khách thuê chủ yếu dùng điện thoại.

## 4. Git
Xem chi tiết: [`docs/06-git-workflow.md`](docs/06-git-workflow.md)
- Không push thẳng lên `main` hay `dev`. Mỗi nhiệm vụ một nhánh `feature/ten-ngan`, xong thì mở Pull Request vào `dev`.
- Commit message: `feat: thêm trang danh sách phòng`, `fix: sửa lỗi tính tiền nước`, `docs: ...`, `refactor: ...`
- Trước khi mở PR, phải chạy được `npm run typecheck` (backend) và `npm run build` (frontend) mà không lỗi.
