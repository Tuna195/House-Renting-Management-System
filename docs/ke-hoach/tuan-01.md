# Tuần 1: Khởi động và học nền

**Mục tiêu tuần:** cả 4 người chạy được khung trên máy mình, hiểu một request đi qua những file nào, nắm Git cơ bản.
**Thời gian dự kiến:** 8–10 giờ mỗi người (phần lớn là học).

---

## 👥 Cả nhóm

### N1.1 Họp khởi động (1 giờ, ngay đầu tuần)
**Kết quả cần đạt**
- Đã điền tên vào [`01-phan-cong.md`](../01-phan-cong.md), ngày bắt đầu và hạn nộp vào [`README.md`](README.md)
- Thống nhất lịch họp cố định hằng tuần (ví dụ tối Chủ nhật, 21h, Google Meet)
- Có nhóm chat (Zalo hoặc Messenger) và quy ước: hỏi kỹ thuật thì kèm ảnh chụp lỗi

**Gợi ý:** dùng 15 phút đầu để từng người nói mình đã biết gì (HTML/CSS, JS, React, SQL, Git) và muốn học gì. Phân vai dựa trên đó.

### N1.2 Cài đặt và chạy khung (2 giờ)
**Kết quả cần đạt**
- Mở http://localhost:5173, đăng nhập bằng tài khoản demo chủ nhà, thấy trang Tòa nhà có dữ liệu
- Đăng nhập tài khoản khách thuê, thấy "Cổng khách thuê"
- Thêm, sửa, xóa được một tòa nhà

**Cách làm:** làm theo [`README.md`](../../README.md) mục "Cài đặt lần đầu". TV2 tạo repo xong (N1-TV2) thì clone từ GitHub.

**Bẫy thường gặp**
- Đặt project trong OneDrive → `npm install` rất chậm hoặc lỗi. Chuyển ra `C:\code\`
- Quên tạo `backend/.env` → backend báo lỗi đỏ ngay khi chạy
- Chỉ chạy frontend mà quên backend → "Không kết nối được máy chủ"

### N1.3 Học nền (4–5 giờ, chọn phần mình còn yếu)
| Chủ đề | Tài liệu | Tối thiểu cần biết |
|---|---|---|
| Git | https://learngitbranching.js.org/?locale=vi | branch, commit, push, pull, merge, Pull Request |
| JavaScript | https://javascript.info (Phần 1, chương 2, 4, 5, 6.1–6.4, 11) | biến, hàm mũi tên, object, mảng (`map`, `filter`, `reduce`), `async/await`, Promise |
| TypeScript | https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html | type, interface, union `'A' \| 'B'`, optional `?`, generic `Array<T>` |
| React | https://react.dev/learn (Quick Start và Thinking in React) | component, props, `useState`, `useEffect`, render danh sách |
| HTTP và REST | Hỏi AI: "giải thích REST API, HTTP method, status code cho người mới" | GET/POST/PATCH/DELETE, mã 200/201/400/401/403/404/500, JSON |
| Express, Prisma | https://www.prisma.io/docs/getting-started/quickstart-sqlite | route, middleware, `findMany`, `create`, `where` |

### N1.4 Bài tập đọc hiểu khung (2 giờ), quan trọng nhất tuần
**Kết quả cần đạt:** mỗi người **tự vẽ ra giấy** (chụp ảnh gửi nhóm) đường đi của thao tác *"bấm Lưu trong form Thêm tòa nhà"* qua các file:
```
BuildingFormModal.tsx  →  BuildingsPage.tsx (useMutation)  →  api/buildings.ts  →  api/client.ts (gắn token)
  →  [HTTP POST /api/buildings]  →  vite proxy  →  app.ts  →  routes.ts  →  buildings.routes.ts
  →  requireAuth  →  requireRole  →  validateBody  →  buildings.controller.ts  →  buildings.service.ts
  →  prisma  →  PostgreSQL  →  ...trả ngược lại...  →  invalidateQueries  →  bảng tự tải lại
```

**Cách làm**
1. Mở DevTools (F12) → tab **Network** → thêm một tòa nhà → bấm vào request `buildings` → xem *Headers* (Authorization), *Payload*, *Response*
2. Đọc từng file theo thứ tự trên, chỗ nào không hiểu thì dùng prompt "Hiểu code" ở [`07-dung-ai-hieu-qua.md`](../07-dung-ai-hieu-qua.md)
3. Thử phá để hiểu: xóa `requireAuth` trong `buildings.routes.ts` rồi gọi lại xem chuyện gì xảy ra (nhớ hoàn tác bằng `git restore`)

**Bài tập thực hành (nhánh `practice/<ten-ban>`, KHÔNG merge):** thêm trường **"Số điện thoại quản lý"** (`managerPhone`, không bắt buộc) cho tòa nhà, đi đủ các bước:
`schema.prisma` → `npm run db:migrate -- --name practice` → `buildings.schema.ts` → `types/index.ts` → `BuildingFormModal.tsx` → cột trong `BuildingsPage.tsx`.
Xong thì `npm run db:reset` để DB trở về như cũ.

> Đây cũng chính là kiểu câu hỏi "sửa code tại chỗ" khi vấn đáp.

---

## 🧑‍💼 TV1: Tổ chức nhóm
**Kết quả cần đạt**
- Bảng **GitHub Projects** có issue cho mọi nhiệm vụ Tuần 1 và 2 (dùng mẫu issue "Nhiệm vụ")
- Biên bản họp khởi động theo [`mau-bien-ban-hop.md`](../mau-bien-ban-hop.md)
- Đã hẹn được **1–2 chủ trọ thật** (người quen, chủ nhà mình đang thuê) để khảo sát ở Tuần 2

**Gợi ý:** hỏi giáo viên ngay tuần này về tiêu chí chấm, mẫu báo cáo, ngày bảo vệ, có cần nộp đề cương không. Ghi vào [`README.md`](README.md).

**Checklist**
- [ ] Bảng phân công đã điền tên
- [ ] GitHub Projects đã tạo, có issue
- [ ] Đã hỏi giáo viên tiêu chí chấm và hạn nộp
- [ ] Đã hẹn chủ trọ để khảo sát

## 🛠️ TV2: Tạo repo và hướng dẫn Git
**Kết quả cần đạt**
- Repo GitHub private có nhánh `main` và `dev`, đã bật bảo vệ nhánh, 3 bạn đã được mời
- Tổ chức buổi **"Git 30 phút"** cho nhóm: mỗi người tạo nhánh, sửa README thêm tên mình, mở PR, được merge

**Cách làm:** làm theo mục "Thiết lập repo" trong [`06-git-workflow.md`](../06-git-workflow.md).

**Checklist**
- [ ] Repo đã tạo, push khung lên
- [ ] Bảo vệ nhánh `main`, `dev`
- [ ] Cả 4 người đã có 1 PR được merge (thêm tên vào README)
- [ ] Mỗi người đã có database Neon riêng và chạy được khung

## 🧮 TV3: Chuẩn bị khảo sát cách tính tiền
**Kết quả cần đạt:** danh sách **10–15 câu hỏi** cho chủ trọ, lấy từ các mục "Câu hỏi cần chốt" trong [`03-cong-thuc-tinh-tien.md`](../03-cong-thuc-tinh-tien.md). Ví dụ:
- Anh/chị tính điện bao nhiêu một số? Nước tính theo khối hay theo người?
- Khách vào giữa tháng thì tính tiền phòng thế nào? Thu tiền đầu tháng hay cuối tháng?
- Có những phí gì ngoài điện nước? Gửi xe tính theo xe hay theo phòng?
- Hiện tại anh/chị báo tiền cho khách thế nào? Khách trả bằng gì? Khó khăn lớn nhất là gì?
- Xin ảnh một tờ phiếu báo tiền hoặc file Excel đang dùng (che thông tin cá nhân)

**Checklist**
- [ ] Bộ câu hỏi đã gửi nhóm góp ý
- [ ] Đã đọc hiểu `backend/src/modules/billing/billing.ts` và chạy `npm test` thấy 5 test qua

## 📱 TV4: Tìm hiểu PWA và giao diện tham khảo
**Kết quả cần đạt**
- Ghi chú 1 trang (gửi nhóm): PWA là gì, gồm 3 thành phần nào, khác app native ra sao
- Thử cài 2 PWA thật trên điện thoại (ví dụ `m.facebook.com`, `twitter.com` bằng Chrome Android), chụp màn hình
- Sưu tầm **5–10 ảnh giao diện** app quản lý trọ hoặc app hóa đơn (LOZIDO, app ngân hàng, app điện lực EVN...) làm tham khảo

**Tài liệu:** https://web.dev/learn/pwa (đọc 3 bài đầu)

**Checklist**
- [ ] Ghi chú PWA đã gửi nhóm
- [ ] Bộ ảnh tham khảo giao diện

---

## ✅ Cuối tuần: kiểm tra chung
- [ ] Cả 4 người chạy được khung trên máy mình
- [ ] Cả 4 người đã có 1 PR được merge
- [ ] Cả 4 người đã gửi sơ đồ đường đi request (N1.4)
- [ ] Đã có lịch khảo sát chủ trọ
