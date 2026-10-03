# 🏠 Hệ thống quản lý vận hành và tính phí nhà cho thuê

Bài tập lớn môn Công nghệ Web — Nhóm ___ (4 thành viên)

Nền tảng web giúp **chủ nhà** quản lý tòa nhà, phòng, khách thuê, hợp đồng; ghi chỉ số điện nước, tự động tính và phát hành hóa đơn hằng tháng. **Khách thuê** xem và thanh toán hóa đơn online, gửi yêu cầu sửa chữa.

**Định hướng công nghệ Web:**
1. **Progressive Web App:** cài lên màn hình điện thoại, Web Push thông báo hóa đơn và nhắc nợ.
2. **Thanh toán VietQR và webhook:** tự động đối soát, gạch nợ khi khách chuyển khoản.
3. **Realtime (Socket.IO):** thông báo tức thời khi có sự cố hoặc thanh toán *(nếu kịp)*.

| Phần | Công nghệ |
|---|---|
| Frontend | React 19, Vite, TypeScript, Ant Design, TanStack Query, React Router |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM, Zod, JWT |
| Database | PostgreSQL (Neon) |

---

## 📚 Bắt đầu từ đâu?

**Thành viên mới: đọc [`docs/README.md`](docs/README.md) trước.** Ở đó có kế hoạch 12 tuần, phân công và hướng dẫn chi tiết từng nhiệm vụ.

---

## ⚙️ Cài đặt lần đầu

### 0. Chuẩn bị
- [Node.js](https://nodejs.org) bản **LTS** (20 trở lên). Kiểm tra: `node -v`
- [Git](https://git-scm.com). Kiểm tra: `git --version`
- [VS Code](https://code.visualstudio.com), cài các extension mà VS Code gợi ý khi mở project
- Tài khoản [GitHub](https://github.com) và [Neon](https://neon.tech) (PostgreSQL miễn phí)

> ⚠️ **Không đặt project trong thư mục OneDrive/Google Drive/Dropbox.** Thư mục `node_modules` có hàng chục nghìn file, đồng bộ sẽ rất chậm và hay gây lỗi khóa file. Hãy clone vào thư mục thường, ví dụ `C:\code\quan-ly-tro`.

### 1. Clone code
```bash
git clone <link-repo-github-cua-nhom>
cd quan-ly-tro
```

### 2. Tạo database trên Neon
1. Đăng nhập https://neon.tech, tạo project mới. Region chọn **Singapore** cho gần.
2. Mục **Connection string**: copy chuỗi bắt đầu bằng `postgresql://...`
3. Mỗi thành viên dùng **database riêng của mình** khi phát triển, để không ghi đè dữ liệu của nhau.

### 3. Chạy backend (cửa sổ terminal 1)
```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```
Mở `backend/.env`, dán chuỗi kết nối vào `DATABASE_URL` và đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên dài. Sau đó:
```bash
npm run db:migrate          # tạo các bảng trong database
npm run db:seed             # tạo dữ liệu demo
npm run dev                 # chạy API tại http://localhost:4000/api
```
Kiểm tra: mở http://localhost:4000/api/health, thấy `{"status":"ok",...}` là được.

### 4. Chạy frontend (cửa sổ terminal 2)
```bash
cd frontend
npm install
npm run dev                 # mở http://localhost:5173
```

### 5. Đăng nhập bằng tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Chủ nhà | `chunha@demo.vn` | `123456` |
| Khách thuê | `khach@demo.vn` | `123456` |

*(Chỉ là dữ liệu demo do `backend/prisma/seed.ts` tạo, không dùng cho hệ thống thật.)*

---

## 🧰 Lệnh thường dùng

| Thư mục | Lệnh | Tác dụng |
|---|---|---|
| backend | `npm run dev` | Chạy API, tự khởi động lại khi sửa code |
| backend | `npm test` | Chạy unit test (hàm tính tiền) |
| backend | `npm run typecheck` | Kiểm tra lỗi TypeScript |
| backend | `npm run db:migrate -- --name ten_thay_doi` | Sau khi sửa `schema.prisma`: tạo migration và cập nhật DB |
| backend | `npm run db:studio` | Mở giao diện xem và sửa dữ liệu trong DB |
| backend | `npm run db:reset` | ⚠️ Xóa sạch DB, tạo lại bảng và seed lại |
| frontend | `npm run dev` | Chạy giao diện |
| frontend | `npm run build` | Kiểm tra lỗi TypeScript và build bản production |

---

## 🗂️ Cấu trúc thư mục

```
quan-ly-tro/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Thiết kế database (các bảng)
│   │   ├── migrations/          # Lịch sử thay đổi DB (tự sinh, có commit)
│   │   └── seed.ts              # Dữ liệu demo
│   └── src/
│       ├── index.ts             # Điểm khởi động server
│       ├── app.ts               # Cấu hình Express
│       ├── routes.ts            # Gắn các module vào /api
│       ├── config/env.ts        # Đọc và kiểm tra file .env
│       ├── lib/prisma.ts        # Kết nối DB
│       ├── middlewares/         # auth (đăng nhập, phân quyền), validate, error-handler
│       ├── utils/
│       └── modules/             # MỖI TÍNH NĂNG MỘT THƯ MỤC
│           ├── auth/            # Đăng ký, đăng nhập
│           ├── buildings/       # ⭐ Module mẫu: copy cấu trúc này
│           └── billing/         # Hàm tính tiền và unit test
├── frontend/
│   └── src/
│       ├── api/                 # Hàm gọi API (mỗi module một file)
│       ├── features/            # MỖI TÍNH NĂNG MỘT THƯ MỤC
│       │   ├── auth/
│       │   └── buildings/       # ⭐ Trang mẫu: copy cấu trúc này
│       ├── layouts/             # Khung giao diện (menu, header)
│       ├── pages/               # Trang chung: Dashboard, 404...
│       ├── types/               # Kiểu dữ liệu, khớp với backend
│       ├── utils/               # formatVND, formatDate...
│       ├── navigation.tsx       # Menu và người phụ trách từng trang
│       └── router.tsx           # Khai báo đường dẫn các trang
├── docs/                        # 📚 Kế hoạch, phân công, hướng dẫn
└── CONVENTIONS.md               # Quy ước code chung (bắt buộc đọc)
```

---

## 🆘 Lỗi thường gặp

| Lỗi | Cách sửa |
|---|---|
| `❌ File backend/.env thiếu hoặc sai` | Chưa tạo `backend/.env` hoặc thiếu biến. Xem bước 3 |
| `Can't reach database server` | Sai `DATABASE_URL`, hoặc database Neon đang "ngủ" (đợi vài giây rồi thử lại) |
| Frontend báo "Không kết nối được máy chủ" | Backend chưa chạy. Mở terminal 1 kiểm tra |
| `EADDRINUSE: port 4000` | Đang có một backend khác chạy. Tắt terminal cũ hoặc đổi `PORT` |
| Kéo code mới về bị lỗi thiếu bảng hoặc cột | Chạy `npm run db:migrate` (có người vừa sửa schema) |
| Kéo code mới về bị lỗi thiếu thư viện | Chạy `npm install` ở thư mục đó |
| Seed lỗi `has no equivalent in encoding "WIN1252"` | Chỉ gặp khi dùng PostgreSQL cài trên Windows: database phải tạo với encoding **UTF8** (`CREATE DATABASE ten_db ENCODING 'UTF8' TEMPLATE template0;`). Neon luôn là UTF8 |
