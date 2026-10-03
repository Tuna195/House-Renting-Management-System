# Tuần 10: Nâng cao (3) — Tích hợp, Bảo mật, Offline

**Mục tiêu tuần:** hoàn thiện và **ổn định** phần nâng cao. Đây là **tuần cuối được thêm tính năng**, sang Tuần 11 sẽ đóng băng.
Bắt đầu **tập vấn đáp** theo cặp (15 phút mỗi buổi họp) với [`08-van-dap-va-bao-cao.md`](../08-van-dap-va-bao-cao.md).

---

## ⚡ TV1: Tích hợp realtime vào các màn hình
**Kết quả cần đạt**
- `invoice:paid` → trang danh sách và chi tiết hóa đơn **tự cập nhật** trạng thái (cả 2 phía) và hiện popup "Phòng P101 vừa thanh toán 3.940.000đ"
- `maintenance:new` → trang Sự cố của chủ nhà tự thêm dòng mới
- Dashboard tự cập nhật số liệu khi có thanh toán
- Bỏ `refetchInterval` 30 giây ở chuông (đã có realtime); mất kết nối thì tự kết nối lại và tải lại dữ liệu
- Quay video ngắn 2 cửa sổ cạnh nhau để làm **video demo dự phòng**

**Cách làm:** mỗi sự kiện chỉ cần `invalidateQueries` đúng `queryKey`, React Query tự tải lại. Thống nhất danh sách sự kiện trong [`05-api.md`](../05-api.md).

**Checklist**
- [ ] 3 sự kiện realtime hoạt động
- [ ] Tự kết nối lại khi mất mạng
- [ ] Video demo realtime
- [ ] PR đã merge

---

## 🔐 TV2: Bảo mật và kiểm tra lần 2
**Kết quả cần đạt**
- **Giới hạn đăng nhập sai:** tối đa 5 lần / phút / IP (`express-rate-limit`)
- **Đổi mật khẩu** (`POST /api/auth/change-password`, cần mật khẩu cũ) và **chủ nhà đặt lại mật khẩu cho khách**
- Chạy lại **kiểm tra bảo mật** (`security.http`) cho **mọi API mới** từ Tuần 5 đến 9, cập nhật `docs/kiem-tra-bao-mat.md`
- Webhook chạy trên **bản online** với nhà cung cấp thật hoặc sandbox (không cần ngrok nữa)
- Rà soát: không còn khóa bí mật nào trong code hay lịch sử Git (`git log -p | grep -i secret`); `.env.example` đủ mọi biến

**Gợi ý vấn đáp:** chuẩn bị giải thích các lớp bảo vệ của hệ thống: *HTTPS → helmet → CORS → rate limit → JWT → requireRole → lọc ownerId → zod validate → Prisma (chống SQL injection) → bcrypt*.

**Checklist**
- [ ] Rate limit đăng nhập
- [ ] Đổi và đặt lại mật khẩu
- [ ] Kiểm tra bảo mật lần 2, đã sửa hết lỗi
- [ ] Webhook trên bản online
- [ ] PR đã merge

---

## 📴 TV3: Ghi chỉ số offline 🟢 (hoặc Hóa đơn tất toán)
> Chọn **một** trong hai, ưu tiên A (gắn với công nghệ PWA của đề tài).

### A. Ghi chỉ số khi mất mạng
**Kết quả cần đạt**
- Ở chế độ "đi ghi số", mất mạng vẫn nhập và bấm Lưu được → dữ liệu **lưu tạm trên máy** (IndexedDB), hiện *"Đã lưu trên máy (3 phòng), sẽ gửi khi có mạng"*
- Có mạng lại → **tự đồng bộ**, báo kết quả; F5 hoặc đóng app rồi mở lại vẫn không mất dữ liệu tạm
- Xung đột (server đã có số khác cho phòng đó trong kỳ đó) → hỏi người dùng giữ bản nào

**Cách làm**
1. `npm i idb-keyval` (thư viện IndexedDB rất nhỏ): `set('pending-readings', [...])`, `get(...)`
2. Lưu thất bại do mạng (`!navigator.onLine` hoặc lỗi axios không có `response`) → đưa vào hàng chờ
3. `window.addEventListener('online', syncPending)` và thử đồng bộ mỗi lần mở trang
4. (Nâng cao) **Background Sync API**: đồng bộ ngay cả khi đã đóng trang, chỉ có trên trình duyệt Chromium. Biết để trình bày là đủ
5. Tài liệu lý thuyết: IndexedDB, chiến lược offline-first

### B. Hóa đơn tất toán khi trả phòng
- Kết thúc hợp đồng → tạo hóa đơn cuối: tiền phòng tính theo ngày đến ngày trả, điện nước theo chỉ số chốt khi trả, trừ tiền cọc. Số âm nghĩa là chủ nhà phải trả lại khách

**Checklist**
- [ ] Đã chọn A hoặc B, hoàn thành
- [ ] Unit test (B) hoặc kịch bản thử offline (A)
- [ ] PR đã merge

---

## 📲 TV4: Hoàn thiện PWA
**Kết quả cần đạt**
- **Xem hóa đơn khi offline:** cache API `GET /api/portal/*` theo chiến lược **NetworkFirst** (có mạng lấy mới, mất mạng lấy bản đã lưu), hiện dải *"Đang offline, dữ liệu cập nhật lúc 14:32"*
- ⚠️ **Đăng xuất phải xóa cache dữ liệu cá nhân** (`caches.delete(...)`). Câu vấn đáp: "Hai người dùng chung một máy thì sao?"
- Lighthouse: Performance, Accessibility, Best Practices **≥ 90** ở khổ điện thoại (chụp ảnh cho báo cáo)
- Thử push trên iPhone thật nếu nhóm có, ghi lại kết quả và hạn chế

**Cách làm**
```ts
workbox: {
  runtimeCaching: [{
    urlPattern: ({ url }) => url.pathname.startsWith('/api/portal/'),
    handler: 'NetworkFirst',
    options: { cacheName: 'portal-api', networkTimeoutSeconds: 3, expiration: { maxAgeSeconds: 7 * 24 * 3600 } },
  }],
}
```
Bản online gọi API ở domain khác (Render) → `urlPattern` phải khớp **địa chỉ đầy đủ**, không chỉ `pathname`.

**Checklist**
- [ ] Xem hóa đơn đã tải khi offline
- [ ] Đăng xuất xóa cache
- [ ] Lighthouse ≥ 90, có ảnh chụp
- [ ] PR đã merge

---

## ✅ Cuối tuần: kiểm tra chung
- [ ] Mọi mục 🟡 trong [`02-yeu-cau-chuc-nang.md`](../02-yeu-cau-chuc-nang.md) đã xong (mục 🟢 làm được đến đâu thì ghi lại đến đó)
- [ ] Cập nhật kịch bản demo có phần nâng cao
- [ ] Mỗi người đã tập vấn đáp ít nhất 1 lần
