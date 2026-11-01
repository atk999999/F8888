# Đối chiếu mã máy của 我要修真 1.8

Đã so khớp SHA-256 của libil2cpp.so và global-metadata.dat trong APK với hồ sơ REA68. Bảng coverage.json lưu các mã băm để xác định đúng bản phát hành.

## Phạm vi

Trong Assembly-CSharp.dll, metadata khai báo 859 kiểu và 7.074 phương thức. 6.556 phương thức có địa chỉ ARM64 riêng và mỗi địa chỉ đều khớp điểm bắt đầu một FDE trong bảng unwind của ELF. Tổng cộng 1.775.704 byte tương ứng 443.926 lệnh dài 4 byte được bộ giải mã LLVM nhận diện. 518 mục có trạng thái no-body trong bảng con trỏ mã của REA. Những mục này cần đối chiếu thêm, chẳng hạn với cơ chế khởi tạo hàm generic.

methods.tsv ghi một dòng cho mỗi phương thức, chữ ký, RVA đầu và cuối, số byte và vị trí trong danh sách hợp ngữ đã giải nén. Địa chỉ cuối không thuộc thân hàm. Nhánh trực tiếp B và BL được ghi đích tuyệt đối và bổ sung tên nếu đích khớp một con trỏ phương thức trong hồ sơ. Các lệnh BLR gọi qua thanh ghi cần theo dõi riêng. FDE mô tả phạm vi mã ABI của trình biên dịch. Một phương thức có thể chuyển việc sang thân hàm khác, thunk hoặc mã runtime.

Kết quả bao phủ các thân hàm có địa chỉ trong assembly này, kể cả mã SDK được biên dịch chung. Việc giải mã từng lệnh chưa chuyển hành vi đó thành React, chưa phục hồi nguyên bản C# và chưa đánh giá các thư viện Unity, mã generic ngoài bảng con trỏ, DEX hay dịch vụ máy chủ.

## Tra cứu

Sau khi giải nén dự án, chạy bằng Python 3. Bộ tra cứu chỉ đọc các tệp tại máy.

```bash
python3 reverse/query.py 'EventOneD::' --list
python3 reverse/query.py 'EventOneD::CanDo4CD'
python3 reverse/query.py 0x1359128
```

Để tạo lại toàn bộ kết quả trên Linux, cài GNU readelf và libLLVM hỗ trợ AArch64, rồi chạy lệnh dưới đây với đúng APK và báo cáo REA68 mà bạn đã cung cấp. Công cụ kiểm tra mã băm trước khi phân tích.

```bash
python3 reverse/extract.py '修仙模拟器-我要修真_1.8.apk' Tutien789_REA68_Report.tar.gz reverse
```

## Quy tắc đã lần theo ở mức lệnh

| Hàm và RVA | Hành vi đọc được |
| --- | --- |
| SaveData::NextDay, 0x1359128 | Lấy trị tuyệt đối của số bước, tính chiều tiến hoặc lùi và gọi getTimeNextDay một lần cho mỗi bước. Bước 0 bỏ qua vòng lặp. |
| SaveData::getTimeNextDay, 0x135e5b0 | Sao chép ba số nguyên năm, tháng, ngày ở các offset 16, 20, 24. Tiến từ ngày 30 sang ngày 1 tháng tiếp. Lùi từ ngày 1 về ngày 30 tháng trước. Tháng vượt 12 hoặc về 0 làm đổi năm tương ứng. |
| TimeBase::getTimeSum, 0x135cb54 | Tổng thời gian nội bộ bằng năm × 360 + tháng × 30 + ngày − 30. |
| EventOneD::CanDo, 0x134a3e8 | Tại 0x134a488–0x134a4b0, bốn phép kiểm tra lần lượt là hồi chiêu, xác suất, số lần tối đa và điều kiện loại bỏ. Nếu một trong bốn phép không đạt, luồng thực thi rẽ nhánh ngay. Sau khi qua bốn phép này, hàm còn xử lý biểu thức điều kiện thông qua Calculate, R_FixD và R_FixRetD. |
| EventOneD::CanDo4CD, 0x134a2c0 | Trả đúng nếu GetEventT trả −1. Trường hợp đã ghi nhận sự kiện, so sánh tổng thời gian hiện tại ≥ thời gian lần trước + giá trị hồi chiêu tại offset 92. |
| EventOneD::CanDo4MaxTime, 0x134a1e0 | Gọi GetEventTimes rồi trả đúng nếu giới hạn tại offset 100 bằng 0 hoặc số lần đã xảy ra nhỏ hơn giới hạn. |
| EventOneD::CanDo4Remove, 0x134a258 | Đảo giá trị Boolean của SaveData::isHaveCondi với khóa sự kiện ở offset 32. |
| EventOneD::CanDo4Rate, 0x134a38c | Đưa giá trị tại offset 96 và số 100 vào G_Fun::getIsRandIn. Tại 0x133ff08–0x133ff24, hàm này gọi bộ sinh số qua thanh ghi với hai đối số 1 và 101, sau đó xét kết quả ≤ giá trị yêu cầu. Kiểu triển khai thực tế của lời gọi gián tiếp phụ thuộc đối tượng tại thời điểm chạy. |
| SaveData::Save, 0x1358d2c | Trong các nhánh có lời gọi chuyển đối tượng ra JSON bằng G_Fun::getObToJosn rồi chuyển tiếp đến SaveData::SaveToDisk4Compress. Khả năng nhập bản lưu Unity vào trình duyệt cần một bộ giải mã và đối chiếu bản lưu thật. |
| UI_Event::ShowEvent, 0x136fb0c | Chính entry point này chỉ có một lệnh ret. Tên phương thức riêng lẻ không đủ để suy ra màn hình không hiển thị sự kiện. Cần đối chiếu các phương thức và callback UI khác. |
