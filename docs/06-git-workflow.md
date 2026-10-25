# Quy trình Git của nhóm

Hướng dẫn Git áp dụng cho toàn dự án và mọi thành viên. Khi dùng agent, xem thêm
[`AGENTS.md`](../AGENTS.md); việc lưu hướng dẫn không tự cấp quyền commit, push hoặc merge.

## Các nhánh

```text
main      ← bản ổn định để nộp và demo. Chỉ merge từ dev ở các mốc (tuần 7, 11, 12)
  └─ dev  ← bản tích hợp hằng ngày. Mọi PR merge vào đây
       ├─ feature/rooms          (TV1)
       ├─ feature/tenants        (TV2)
       ├─ feature/billing        (TV3)
       └─ fix/sua-loi-dang-nhap  (ai cũng được)
```

## Làm một nhiệm vụ: 7 bước

Các lệnh dưới đây chạy từ thư mục gốc dự án. Kiểm tra `git status` trước khi đổi nhánh;
giữ lại công việc đang làm và chỉ stage các file thuộc nhiệm vụ, không đưa `.env` vào commit.

```bash
# 1. Cập nhật dev mới nhất
git checkout dev
git pull

# 2. Tạo nhánh mới cho nhiệm vụ
git checkout -b feature/rooms

# 3. Code... commit thường xuyên (mỗi lần xong một phần nhỏ chạy được)
git add .
git commit -m "feat: thêm API danh sách phòng"

# 4. Đẩy nhánh lên GitHub
git push -u origin feature/rooms

# 5. Lên GitHub → "Compare & pull request" → base: dev ← compare: feature/rooms
#    Điền mẫu PR, chọn người review

# 6. Người review góp ý → sửa → commit → push lại (PR tự cập nhật)

# 7. Được duyệt → TV2 (hoặc người được duyệt) bấm "Squash and merge" → xóa nhánh
```

PR cần ít nhất một approval. Trước khi mở PR, chạy các kiểm tra theo
[`AGENTS.md`](../AGENTS.md), gồm typecheck/build package bị ảnh hưởng và unit backend nếu đổi logic backend.

## Lấy code mới của người khác trong lúc đang làm
Nên làm mỗi ngày để tránh conflict lớn:
```bash
git checkout dev && git pull
git checkout feature/rooms
git merge dev
```
Sau đó cài lại dependencies của package bị đổi theo lockfile:

```bash
# Chỉ chạy cho package có package.json hoặc package-lock.json thay đổi
npm --prefix backend ci
npm --prefix frontend ci
```

Nếu có migration mới, xác nhận cấu hình trỏ tới DB phát triển riêng rồi chạy
`npm --prefix backend run db:migrate`. Không chạy migration trên DB production hoặc DB dùng chung.

## Gặp conflict (xung đột)
1. VS Code tô màu chỗ xung đột: **Current** (của mình) và **Incoming** (của người khác)
2. Chọn "Accept Both" hoặc tự sửa cho đúng, **xóa hết các dấu `<<<<<<<`, `=======`, `>>>>>>>`**
3. `git add .` rồi `git commit`
4. Không chắc thì **gọi người viết đoạn code kia** cùng sửa. Đừng xóa code của người khác.

## Quy ước commit message
| Tiền tố | Dùng khi | Ví dụ |
|---|---|---|
| `feat:` | Thêm tính năng | `feat: thêm form tạo hợp đồng` |
| `fix:` | Sửa lỗi | `fix: tiền nước theo người tính sai khi hợp đồng có 1 người` |
| `refactor:` | Sửa code, không đổi chức năng | `refactor: tách hàm tính dịch vụ` |
| `docs:` | Tài liệu | `docs: cập nhật công thức tính tiền` |
| `test:` | Thêm test | `test: thêm ca vào giữa tháng` |
| `chore:` | Cấu hình, thư viện | `chore: cài node-cron` |

## Thiết lập repo (TV2 làm ở Tuần 1)
1. GitHub → **New repository** → tên `quan-ly-tro`, **Private**, không tick tạo README
2. Trong thư mục project:
   ```bash
   git init
   git add .
   git commit -m "chore: khởi tạo khung dự án"
   git branch -M main
   git remote add origin https://github.com/<ten>/quan-ly-tro.git
   git push -u origin main
   git checkout -b dev
   git push -u origin dev
   ```
3. **Settings → Collaborators**: mời 3 bạn còn lại (và giáo viên nếu được yêu cầu)
4. **Settings → Branches → Add rule** cho `main` và `dev`: tick *Require a pull request before merging* và *Require approvals: 1*
5. **Settings → General → Default branch**: đổi thành `dev`
6. **Projects → New project → Board**: cột *Todo / In progress / In review / Done*

## Lệnh cứu nguy
| Tình huống | Lệnh |
|---|---|
| Lỡ sửa linh tinh một file, muốn bỏ | `git restore ten-file` |
| Lỡ commit trên `dev` thay vì nhánh riêng | `git checkout -b feature/ten-moi` (commit đi theo nhánh mới), rồi báo TV2 |
| Xem mình đang ở nhánh nào, sửa gì | `git status` |
| Xem lịch sử | `git log --oneline --graph -15` |
| Lỡ commit file `.env` | Báo TV2 ngay, **đổi mật khẩu DB và JWT_SECRET** |

> ⚠️ **Không dùng** `git push --force` trên `dev` hay `main`.

**Học Git trong 1 buổi:** https://learngitbranching.js.org/?locale=vi (làm phần "Main" mục 1–4)

**Ghi chú công việc:** `[day/memberID]`.
