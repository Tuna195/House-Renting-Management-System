# Công thức tính tiền — BẢN NHÁP (TV3 chốt cùng nhóm ở Tuần 2)

> Đây là phần **giáo viên hay hỏi sâu nhất** và **nhóm hay cãi nhau nhất**. Phải chốt bằng văn bản trước khi code.
> Mỗi mục có ô **"Quyết định của nhóm"**. Điền xong thì ghi ngày chốt. Muốn đổi sau này phải họp lại.

## Hóa đơn một tháng gồm những khoản nào
```
Tổng = Tiền phòng + Tiền điện + Tiền nước + Σ Tiền dịch vụ + Khoản khác − Giảm trừ
```
Mỗi khoản là một dòng `InvoiceItem` (loại, mô tả, số lượng, đơn giá, thành tiền). Tiền là **số nguyên VND**.

---

## 1. Tiền phòng
- Ở **đủ tháng**: `= rentPrice` của hợp đồng
- **Vào hoặc ra giữa tháng**: tính theo ngày
  ```
  tiền = rentPrice × số ngày ở / số ngày của tháng   → làm tròn đến 1.000đ
  ```
  Ví dụ: giá 3.100.000, vào ngày 16/10 (tháng 10 có 31 ngày, ở 16 ngày) → 3.100.000 × 16/31 = **1.600.000đ**

**Câu hỏi cần chốt:**
- [ ] Ngày vào có được tính là một ngày ở không? (Đề xuất: **có**)
- [ ] Làm tròn đến 1.000đ hay 500đ, làm tròn lên hay làm tròn gần nhất? (Đề xuất: **gần nhất, đến 1.000đ**)
- [ ] Thu tiền phòng **trước** (đầu tháng thu tháng này) hay **sau** (cuối tháng thu tháng vừa ở)? (Đề xuất cho đơn giản: **thu sau**, cùng hóa đơn với điện nước của tháng đó)

**Quyết định của nhóm:** ______________________ (ngày chốt: ___/___)

## 2. Tiền điện
```
số kWh = chỉ số mới − chỉ số cũ
```
- **Cách A: giá cố định** (phổ biến ở nhà trọ): `= số kWh × electricityPrice`. Ví dụ: 130 kWh × 3.500 = **455.000đ**
- **Cách B: bậc thang** (giống EVN), 🟢 nếu dư thời gian. Ví dụ với 3 bậc giả định:

  | Bậc | Từ–đến (kWh) | Giá |
  |---|---|---|
  | 1 | 0–50 | 1.984 |
  | 2 | 51–100 | 2.050 |
  | 3 | > 100 | 2.500 |

  130 kWh = 50×1.984 + 50×2.050 + 30×2.500 = 99.200 + 102.500 + 75.000 = **276.700đ**

**Câu hỏi cần chốt:**
- [ ] MVP dùng cách A. Có làm cách B không? (Đề xuất: **cách A cho MVP**; cách B làm thêm nếu kịp, cần thêm bảng giá bậc vào Building)
- [ ] Chỉ số mới nhỏ hơn chỉ số cũ (thay công tơ): xử lý thế nào? (Đề xuất: **báo lỗi**, chủ nhà nhập lại chỉ số cũ bằng tay)

**Quyết định của nhóm:** ______________________

## 3. Tiền nước
Theo `waterBillingType` của tòa nhà:
- `PER_M3`: `= số khối × waterPrice`. Ví dụ: 5 m³ × 25.000 = **125.000đ**
- `PER_PERSON`: `= số người trong hợp đồng × waterPrice`. Ví dụ: 3 người × 100.000 = **300.000đ**

**Câu hỏi cần chốt:**
- [ ] Ở giữa tháng thì nước theo người có tính theo ngày không? (Đề xuất: **không**, tính đủ cho đơn giản)

**Quyết định của nhóm:** ______________________

## 4. Dịch vụ
Theo `unit` của từng dịch vụ (bảng `Service`), chỉ tính các dịch vụ gắn với hợp đồng (bảng `ContractService`):
- `PER_ROOM`: `= price`. Ví dụ: Internet **100.000đ**
- `PER_PERSON`: `= price × số người`. Ví dụ: Vệ sinh 30.000 × 2 người = **60.000đ**
- `PER_QUANTITY`: `= price × quantity`. Ví dụ: Gửi xe 100.000 × 2 xe = **200.000đ**

**Quyết định của nhóm:** ______________________

## 5. Hạn thanh toán, quá hạn
- `dueDate` = ngày `invoiceDueDay` của **tháng sau kỳ**. Ví dụ: kỳ 2026-10, `invoiceDueDay = 5` → hạn **05/11/2026**
- Quá hạn mà chưa trả đủ → hiển thị "Quá hạn" (tính khi hiển thị, hoặc cron đánh dấu ở Tuần 8)
- [ ] Có phạt trả chậm không? (Đề xuất: **không** cho MVP)

## 6. Thanh toán
- `paidAmount` = tổng các `Payment` của hóa đơn
- `paidAmount = 0` → `UNPAID`; `0 < paidAmount < totalAmount` → `PARTIAL`; `paidAmount ≥ totalAmount` → `PAID`
- Trả thừa: [ ] ghi nhận và hiển thị số dư? [ ] trừ vào tháng sau? (Đề xuất: **chỉ ghi nhận**, không trừ tự động)

## 7. Tiền cọc
- Lưu ở `Contract.deposit`, **không** tính vào hóa đơn tháng
- Trả phòng: [ ] có tạo "hóa đơn tất toán" (tiền phòng theo ngày + điện nước cuối, trừ cọc) không? (Đề xuất: 🟢 nếu dư thời gian)

---

## Ví dụ hóa đơn đầy đủ (dùng làm ca kiểm thử)
Phòng P101, kỳ 2026-10, ở đủ tháng, 2 người, gửi 2 xe. Tòa nhà: điện 3.500/kWh, nước 25.000/m³.

| Khoản | Chi tiết | Thành tiền |
|---|---|---|
| Tiền phòng | Tháng 10/2026 | 3.000.000 |
| Điện | 1250 → 1380 = 130 kWh × 3.500 | 455.000 |
| Nước | 210 → 215 = 5 m³ × 25.000 | 125.000 |
| Internet | 1 phòng × 100.000 | 100.000 |
| Vệ sinh | 2 người × 30.000 | 60.000 |
| Gửi xe máy | 2 xe × 100.000 | 200.000 |
| **Tổng** | | **3.940.000** |

> TV3: viết ít nhất **3 ví dụ như trên** (đủ tháng; vào giữa tháng; nước theo người), **tính tay** rồi đưa vào `billing.test.ts`.
