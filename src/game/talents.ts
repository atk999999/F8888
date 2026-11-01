import type { Talent } from './types';
// Việt hóa thủ công từ config_pd_buff.json của APK 1.8.
export const TALENTS: Talent[] = [
 {id:2,name:'Huyết Mạch Thức Tỉnh',detail:'Trong cơ thể ẩn chứa huyết mạch thượng cổ.',tier:2,bonus:{theChat:2}},
 {id:3,name:'Sát Lục Chi Thần',detail:'Đạo tâm quyết liệt, lấy sát phạt để chứng đạo.',tier:3,bonus:{tuVi:3,daoTam:-2}},
 {id:4,name:'Thân Thể Cường Tráng',detail:'Gân cốt vượt xa phàm nhân.',tier:1,bonus:{theChat:1}},
 {id:5,name:'Lắm Lời',detail:'Không ngừng lẩm bẩm, dễ đắc tội người khác.',tier:0,bonus:{miLuc:-1}},
 {id:6,name:'Duy Ngã Độc Tôn',detail:'Chỉ tin đạo của chính mình.',tier:2,bonus:{daoTam:2}},
 {id:7,name:'Truy Cầu Chân Lý',detail:'Đạo lý trọng hơn sư mệnh.',tier:2,bonus:{ngoTinh:2}},
 {id:8,name:'Dung Mạo Xấu Xí',detail:'Vẻ ngoài không được lòng người.',tier:0,bonus:{miLuc:-1}},
 {id:9,name:'Khí Vũ Hiên Ngang',detail:'Phong thái bất phàm, nhân duyên tốt đẹp.',tier:2,bonus:{miLuc:2}},
 {id:10,name:'Tư Chất Bình Phàm',detail:'Không có sở trường rõ rệt.',tier:0},
 {id:11,name:'Ta Là Ai?',detail:'Thiên cơ che phủ, vận mệnh khó lường.',tier:3,bonus:{khiVan:3}},
 {id:12,name:'Nhân Sinh Khai Quải',detail:'Thiên mệnh ưu ái trên con đường tu tiên.',tier:3,bonus:{tuVi:5,khiVan:2}},
 {id:14,name:'Thiên Tài Tu Luyện',detail:'Bẩm sinh thấu hiểu quỹ tích linh khí.',tier:3,bonus:{ngoTinh:2}},
 {id:15,name:'Kế Thừa Gia Sản',detail:'Được hưởng gia nghiệp của trưởng bối.',tier:2,bonus:{giaCanh:2,linhThach:40}},
 {id:16,name:'Kỳ Tài Kinh Thương',detail:'Nhạy bén với cơ duyên tài lộc.',tier:2,bonus:{linhThach:50}},
 {id:17,name:'Thông Tuệ Hơn Người',detail:'Tâm trí tinh anh, lĩnh ngộ nhanh chóng.',tier:1,bonus:{ngoTinh:1}},
 {id:18,name:'Thiên Mệnh Chi Tử',detail:'Khí vận quấn thân, gặp dữ hóa lành.',tier:3,bonus:{khiVan:3}},
 {id:19,name:'Thông Minh Tuyệt Đỉnh',detail:'Ngộ tính siêu phàm, nhưng thiên tư kỳ lạ.',tier:2,bonus:{ngoTinh:3}},
 {id:20,name:'Lực Đại Vô Cùng',detail:'Khí huyết hùng hậu, thần lực trời sinh.',tier:2,bonus:{theChat:3}},
 {id:21,name:'Tổ Truyền Đan Dược',detail:'Sau tuổi năm mươi nhận được kỳ đan.',tier:2},
 {id:22,name:'Thiên Sinh Linh Thể',detail:'Sinh ra đã có thể cảm ứng thiên địa linh khí.',tier:2,bonus:{tuVi:2}},
 {id:23,name:'Sáng Thế Giả',detail:'Bước vào Nguyên Anh có thể ngộ cơ duyên kỳ dị.',tier:3,bonus:{khiVan:2}},
 {id:24,name:'Siêu Phàm',detail:'Căn cơ vượt xa người thường.',tier:2,bonus:{theChat:1,ngoTinh:1,khiVan:1}},
 {id:25,name:'Khai Quang',detail:'Linh đài sáng tỏ từ thuở bé thơ.',tier:1,bonus:{ngoTinh:1}},
 {id:26,name:'Tam Thập Nhi Lập',detail:'Sau ba mươi tuổi gia cảnh dần hưng thịnh.',tier:1},
 {id:27,name:'Khuyết Hãm',detail:'Căn cơ khuyết thiếu, tu hành khó khăn.',tier:1,bonus:{ngoTinh:-1}},
 {id:28,name:'Ách Vận',detail:'Tai kiếp thường xuyên giáng xuống.',tier:2,bonus:{khiVan:-3}},
 {id:29,name:'Thiên Bình',detail:'Hành sự công bằng, được lòng quần chúng.',tier:2,bonus:{danhVong:4}},
];
export const TIERS = ['Tạp phẩm','Phàm phẩm','Linh phẩm','Thiên phẩm'];
export const REALMS = [
 {name:'Phàm Nhân', need:0, desc:'Chưa bước lên tiên lộ'},
 {name:'Luyện Khí', need:10, desc:'Dẫn khí nhập thể'},
 {name:'Trúc Cơ', need:50, desc:'Linh dịch ngưng tụ'},
 {name:'Kim Đan', need:120, desc:'Đan thành nơi đan điền'},
 {name:'Nguyên Anh', need:200, desc:'Nguyên thần sơ hiện'},
 {name:'Hóa Thần', need:300, desc:'Thần niệm hóa hình'},
 {name:'Độ Kiếp', need:390, desc:'Đối mặt thiên uy'},
 {name:'Phi Thăng', need:500, desc:'Siêu thoát phàm trần'}
];
export const ITEM_INFO = [
 {id:'linhThao',icon:'🌿',name:'Linh thảo',desc:'Luyện đan hoặc đổi linh thạch'},
 {id:'trucCoDan',icon:'🟠',name:'Trúc Cơ Đan',desc:'Gia tăng xác suất đột phá'},
 {id:'hoiNguyenDan',icon:'🔵',name:'Hồi Nguyên Đan',desc:'Phục hồi sinh lực'},
 {id:'coBao',icon:'⚔️',name:'Cổ bảo',desc:'Di vật cất giấu linh lực'},
 {id:'tinhThach',icon:'💠',name:'Tinh thạch',desc:'Tinh hoa thiên địa'},
 {id:'tinhThanQuyet',icon:'📜',name:'Tinh Thần Quyết',desc:'Công pháp thất truyền của Tần gia'}
] as const;
