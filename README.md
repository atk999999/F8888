# Ngã Dục Tu Chân · bản React v04

Dự án React 19, TypeScript và Vite. Nút **Chơi cốt truyện gốc · 824 mục** mở kịch bản trích từ APK 我要修真 1.8. Nút **Chơi bản phóng tác v03** giữ phiên bản trước và dùng một ô lưu riêng.

## Chạy và build

Giải nén ZIP ngoài một lần. Đưa thư mục chứa package.json vào dự án web trong AI Studio. Giữ nguyên tệp trong archive. Dùng Node 22 hoặc 24.

```bash
npm ci
npm test
npm run dev
```

Máy chủ phát triển dùng cổng 3000. Để tạo bản web tĩnh, chạy `npm run build`. Thư mục kết quả là `dist/`. Chạy `npm run preview` để mở bản build. Game chơi bằng trình duyệt, lưu vào localStorage và có chức năng xuất/nhập JSON. Cài đặt npm lần đầu cần mạng. Web không yêu cầu khóa AI, đăng nhập hay dịch vụ game.

## Nội dung đã chuyển

* src/data/goc_config_event.json lưu đủ 824 mục. Ba bảng vi-a/b/c.json cung cấp tên, lời kể Việt hóa rút gọn và lựa chọn theo đúng ID. 110 mục gốc không có lời kể. Có thể tra toàn bộ bằng nút Tiên lục.
* src/original/rules.mjs xử lý điều kiện thuộc tính, tuổi, tháng, thiên phú, sự kiện đã gặp, ưu tiên, trọng số, hồi chiêu, giới hạn số lần, lựa chọn, thay đổi thuộc tính, chuyển nhánh và kết cục. Kiểm thử cấu trúc đưa từng lựa chọn qua hai biên RNG. Đây chưa phải đối chiếu kết quả với bản Android chạy thật.
* Phân bổ cơ bản 20 điểm trên 4 thuộc tính, tối đa 3 thiên phú. Các phép cộng điểm khởi đầu lấy từ config_pd_buff. Web rút tối đa 10 ứng viên và cho rút lại. Cách lấy mẫu chưa đối chiếu phân bố trên thiết bị.
* 129 WebP từ 129 texture có pixel. Hai texture còn lại trống trong serialized asset. Cả ba AudioClip có Ogg Vorbis phát được. Thư mục docs có sơ đồ đối tượng scene và dữ liệu atlas.
* archive/WoYaoXiuZhen_1.8.apk là APK gốc nguyên byte. Trước khi dev/build, script Node đọc APK như ZIP và tách các tài nguyên cần cho kho tra cứu. Trình duyệt không chạy thư viện Android.
* reverse/ có bảng 7.074 phương thức Assembly-CSharp, hợp ngữ ARM64 của 6.556 thân hàm có địa chỉ, công cụ tra cứu, báo cáo REA gốc và hướng dẫn tái tạo.

## Phạm vi còn mở

Chưa khôi phục dự án Unity/C# nguyên bản. 518 phương thức trong assembly chưa có con trỏ thân hàm trong bảng đã đối chiếu. Một số quy tắc chọn sự kiện, thứ tự xử lý trong một lượt, xác suất, thọ nguyên và tác động đặc biệt của thiên phú cần xác minh bằng bản chạy Android. Sáu mục không có đường dẫn trong đồ thị điều kiện và liên kết sự kiện trích được. Có thể đọc chúng trong Tiên lục. Các dịch vụ Android, quảng cáo, đăng nhập, kho kịch bản trực tuyến, trình biên tập/thị trường kịch bản của game và chuyển đổi bản lưu Unity chưa được tái hiện. Dự án đã kiểm thử ở môi trường Node/Vite cục bộ. Chưa thử nhập trên tài khoản AI Studio của người dùng.
