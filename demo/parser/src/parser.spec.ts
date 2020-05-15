import Parser from "./parser";
import { expect } from "chai";

describe("Parser", () => {
  describe("parse", () => {
    const p = new Parser({ debug: !!process.env["PARSER_DEBUG"] });
    const parseForFullNames = (address: string) => {
      const results = p.parse(address);
      return results.map(result => `${result.type} ${result.name}`);
    };
    const parseForIds = (address: string) => {
      const results = p.parse(address);
      return results.map(result => result.id);
    };

    const map: { [key: string]: string[] } = {
      "123 3 Tháng 2, phường 12, Quận 10, Ho Chi Minh City, Vietnam": [
        "Phường 12",
        "Quận 10",
        "Thành phố Hồ Chí Minh"
      ],
      "123 Nguyễn Duy Cung, Ho Chi Minh City, Ho Chi Minh, Vietnam": [
        "Thành phố Hồ Chí Minh"
      ],
      "123 Cửa Bắc, Hanoi, Vietnam": ["Thành phố Hà Nội"],
      "123 Đường Vĩnh Viễn, P8Q10, HCM": [
        "Phường 8",
        "Quận 10",
        "Thành phố Hồ Chí Minh"
      ],
      "123 bến bãi sậy f4 q6 hcmc": [
        "Phường 4",
        "Quận 6",
        "Thành phố Hồ Chí Minh"
      ],
      "bình dương": ["Tỉnh Bình Dương"],
      "123 bạch Đằng P.24 Q.Bình Thạnh": [
        "Phường 24",
        "Quận Bình Thạnh",
        "Thành phố Hồ Chí Minh"
      ],
      "123 Lê Lợi, Hóc môn": ["Huyện Hóc Môn", "Thành phố Hồ Chí Minh"],
      "123 Lê Văn Quới, Bình Trị Đông, Ho Chi Minh, Vietnam": [
        "Phường Bình Trị Đông",
        "Quận Bình Tân",
        "Thành phố Hồ Chí Minh"
      ],
      "10/3a Đỗ Ngọc Thạnh, Hồ Chí Minh, Việt Nam": ["Thành phố Hồ Chí Minh"],
      "số 2 đường 32 phường 6 quận 4": [
        "Phường 6",
        "Quận 4",
        "Thành phố Hồ Chí Minh"
      ],
      "Q2, Tp HCM": ["Quận 2", "Thành phố Hồ Chí Minh"],
      "0908464524": [],
      "7 Tạ Hiện, P. Thạnh Mỹ Lợi, Q2": [
        "Phường Thạnh Mỹ Lợi",
        "Quận 2",
        "Thành phố Hồ Chí Minh"
      ],
      "130-132 Hồng Hà, Phường 9, Phú Nhuận": [
        "Phường 9",
        "Quận Phú Nhuận",
        "Thành phố Hồ Chí Minh"
      ],
      "Hồ Chí Minh, Việt Nam": ["Thành phố Hồ Chí Minh"],
      "421 Đường Phạm Văn Chí, phường 7, Hồ Chí Minh, Việt Nam": [
        "Thành phố Hồ Chí Minh"
      ],
      "98/5 cmt8. Bien hoa. Đồng Nai": ["Thành phố Biên Hòa", "Tỉnh Đồng Nai"],
      "quận Phú Nhuận, Hồ Chí Minh, Việt Nam": [
        "Quận Phú Nhuận",
        "Thành phố Hồ Chí Minh"
      ],
      "42/4/6 Trương Quốc Dung, F. 10, Q. Phú Nhuận, TP HCM": [
        "Phường 10",
        "Quận Phú Nhuận",
        "Thành phố Hồ Chí Minh"
      ],
      "345/17 Tân Kỳ Tân Quý, quận tân Phú, Hồ Chí Minh, Việt Nam": [
        // TODO
        "Phường Tân Quý",
        "Quận Tân Phú",
        "Thành phố Hồ Chí Minh"
      ],
      "Mỹ Phước, tx. Bến Cát, Bình Dương, Việt Nam": [
        "Phường Mỹ Phước",
        "Thị xã Bến Cát",
        "Tỉnh Bình Dương"
      ],
      "ketsatketbac@yahoo.com.vn": [],
      "533/15 Nguyễn Tri Phương P8 Q10": [
        "Phường 8",
        "Quận 10",
        "Thành phố Hồ Chí Minh"
      ],
      "Phú Mỹ Hưng, Q7, TP. HCM": ["Quận 7", "Thành phố Hồ Chí Minh"],
      "phuongxuanhieu@gmail.com": [],
      "Phòng Đào tạo - ĐH Nông Lâm Thái Nguyên": ["Tỉnh Thái Nguyên"],
      "Dốc Tam Đa, Thụy Khuê, Tây Hồ, Hà Nội": [
        "Phường Thụy Khuê",
        "Quận Tây Hồ",
        "Thành phố Hà Nội"
      ],
      "119/906e nguyễn kiệm , f3 , gò vấp": [
        "Phường 3",
        "Quận Gò Vấp",
        "Thành phố Hồ Chí Minh"
      ],
      "219A Phan Văn Khoẻ, Quận 6, Hồ Chí Minh, Việt Nam": [
        "Quận 6",
        "Thành phố Hồ Chí Minh"
      ],
      "1275b đường 3/2 P 16 quận 11 tp HCM": [
        "Phường 16",
        "Quận 11",
        "Thành phố Hồ Chí Minh"
      ],
      "Đường Tân Vĩnh, Quận 4, TP.HCM": ["Quận 4", "Thành phố Hồ Chí Minh"],
      "373/22/10/20 Hà Huy Giáp, thạnh xuân, quận 12. Tp. Hcm": ["TODO"],
      "Ba Đình, Hà Nội, Việt Nam": ["Quận Ba Đình", "Thành phố Hà Nội"],
      "Bắc Ninh, Việt Nam": ["Tỉnh Bắc Ninh"],
      "Lương Yên, Hà Nội, Việt Nam": ["Thành phố Hà Nội"],
      "Số 76 phùng khoang, trung văn, nam từ liêm": [
        "Phường Trung Văn",
        "Quận Nam Từ Liêm",
        "Thành phố Hà Nội"
      ],
      "38B34 đường Cây Keo, phường Tam Phú, Thủ Đức Tp.HCM": [
        "Phường Tam Phú",
        "Quận Thủ Đức",
        "Thành phố Hồ Chí Minh"
      ],
      "19/30 Hồ Văn Huê, Ho Chi Minh City, Ho Chi Minh, Vietnam": [
        "Thành phố Hồ Chí Minh"
      ],
      "Bách Khoa - Hai Bà Trưng - Hà Nội": [
        "Phường Bách Khoa",
        "Quận Hai Bà Trưng",
        "Thành phố Hà Nội"
      ],
      "Ngõ 219 Nguyễn Ngọc Nại, Hanoi, quận Thanh Xuân, Vietnam": [
        "Quận Thanh Xuân",
        "Thành phố Hà Nội"
      ],
      "57 vu trong phung, thanh xuan, hanoi": [
        "Quận Thanh Xuân",
        "Thành phố Hà Nội"
      ],
      "Quận 3, Ho Chi Minh, Vietnam": ["Quận 3", "Thành phố Hồ Chí Minh"],
      "P1108 - Nhà N01 Trần Quý Kiên - Cầu Giấy": [
        "Quận Cầu Giấy",
        "Thành phố Hà Nội"
      ],
      "Thành phố Hồ Chí Minh, Hồ Chí Minh, Việt Nam": ["Thành phố Hồ Chí Minh"],
      "81 Nguyen Chi Thanh, Da Nang, Vietnam": ["Thành phố Đà Nẵng"],
      "212 Nguyễn Trãi, Ho Chi Minh City, Vietnam": ["Thành phố Hồ Chí Minh"],
      "Định Công": [],
      "Cầu Giấy, Hanoi, Vietnam": ["Quận Cầu Giấy", "Thành phố Hà Nội"],
      "Hà Nội": ["Thành phố Hà Nội"],
      "336 tô ngọc vân thủ đức": ["Quận Thủ Đức", "Thành phố Hồ Chí Minh"],
      "Nhà số 3 hẻm 79/18 (Cạnh trường tiểu học La Thành), Ngõ Thổ Quan, Khâm Thiên, Quảng Đại, TP Hà Nội": [
        "Thành phố Hà Nội"
      ],
      "23 Nguyễn Hữu Thọ, Tân Hưng, Ho Chi Minh, Vietnam": [
        "Phường Tân Hưng",
        "Quận 7",
        "Thành phố Hồ Chí Minh"
      ],
      "9 Đinh Tiên Hoàng, pĐakao, q1 - Toà nhà SFC": [
        "Phường Đa Kao",
        "Quận 1",
        "Thành phố Hồ Chí Minh"
      ],
      "36 Trịnh Đình Thảo (Chung cư Lotus Garden), P.Hòa Thạnh, Q.Tân Phú": [
        "Phường Hòa Thạnh",
        "Quận Tân Phú",
        "Thành phố Hồ Chí Minh"
      ],
      "Nha Trang, Khanh Hoa Province, Vietnam": [
        "Thành phố Nha Trang",
        "Tỉnh Khánh Hòa"
      ],
      "Quận Hai Bà Trưng, Hà Nội": ["Quận Hai Bà Trưng", "Thành phố Hà Nội"],
      "17 Hồ xuân Hương, Q.3": ["Quận 3", "Thành phố Hồ Chí Minh"],
      "281 Lý Thường Kiệt, Phường 15, Quận 11, TP HCM": [
        "Phường 15",
        "Quận 11",
        "Thành phố Hồ Chí Minh"
      ],
      "Cộng Hòa, Tân Bình": ["Quận Tân Bình", "Thành phố Hồ Chí Minh"],
      "204 Hồ Tùng Mậu, Cầu Diễn, Cầu Giấy, Hà Nội 100000": [
        "Quận Cầu Giấy",
        "Thành phố Hà Nội"
      ],
      "8 Nguyễn Thượng Hiền, Phường 5, Quận 3, Thành phố Hồ Chí Minh": [
        "Phường 5",
        "Quận 3",
        "Thành phố Hồ Chí Minh"
      ],
      "961/51 Nguyễn Kiệm P. 3 GV": [
        "Phường 3",
        "Quận Gò Vấp",
        "Thành phố Hồ Chí Minh"
      ],
      "Số 7 ngõ 1 Tô Vĩnh Diện": [],
      "Toàn quốc": [],
      "Thanh Khê, Đà Nẵng, Việt Nam": ["Quận Thanh Khê", "Thành phố Đà Nẵng"],
      "P202, 2 Núi Trúc, Ba Đình, Hà Nội": ["Quận Ba Đình", "Thành phố Hà Nội"],
      "số 5 ngõ 4 đặng văn ngũ": [],
      "68 Phan Huy Ôn, Binh Thanh District, Ho Chi Minh City, Vietnam": [
        "Quận Bình Thạnh",
        "Thành phố Hồ Chí Minh"
      ],
      "214 Hưng Phú, p8 q8": ["Phường 8", "Quận 8", "Thành phố Hồ Chí Minh"],
      "Hai Bà Trưng HN": ["Quận Hai Bà Trưng", "Thành phố Hà Nội"],
      "40 phùng chí kiên hoàng văn thụ tp lạng sơn": [
        "Phường Hoàng Văn Thụ",
        "Thành phố Lạng Sơn",
        "Tỉnh Lạng Sơn"
      ],
      "52 Hai Bà Trưng, Hà Nội": ["Quận Hai Bà Trưng", "Thành phố Hà Nội"],
      "4 ngõ 695 Bạch Đằng, Hoàn Kiếm, Hà Nội": [
        "Quận Hoàn Kiếm",
        "Thành phố Hà Nội"
      ],
      "Quận 2 - Hồ Chí Minh": ["Quận 2", "Thành phố Hồ Chí Minh"],
      "270B/72 Lý Thường Kiệt P.6 ,Q.Tân Bình": [
        "Phường 6",
        "Quận Tân Bình",
        "Thành phố Hồ Chí Minh"
      ],
      "Bệnh viện phụ sản Hà Nội": ["Thành phố Hà Nội"],
      "Nghĩa Tân, Cầu Giấy": [
        "Phường Nghĩa Tân",
        "Quận Cầu Giấy",
        "Thành phố Hà Nội"
      ],
      "Quận Bình Thạnh, TP Hồ Chí Minh": [
        "Quận Bình Thạnh",
        "Thành phố Hồ Chí Minh"
      ],
      "43/5 Nơ Trang Long, phường 7, Ho Chi Minh, Vietnam": [
        "Thành phố Hồ Chí Minh"
      ],
      "Nga tu Xa lo Ha Noi  Quan 9 TP Ho chi minh": [
        "Quận 9",
        "Thành phố Hồ Chí Minh"
      ],
      "Quận Cầu Giấy": ["Quận Cầu Giấy", "Thành phố Hà Nội"],
      "Quán Nam - Khách sạn sinh viên Đại học Dân lập Hải Phòng": [
        "Thành phố Hải Phòng"
      ],
      "Ngõ 1 - Bùi Xương Trạch, Khương Đình, Hanoi, Vietnam": [
        "Phường Khương Đình",
        "Quận Thanh Xuân",
        "Thành phố Hà Nội"
      ],
      "nhà văn hoá từ liêm, bắc từ liêm, hà nội": [
        "Quận Bắc Từ Liêm",
        "Thành phố Hà Nội"
      ],
      "13 đường 31 quận bình tân 0903678061": [
        "Quận Bình Tân",
        "Thành phố Hồ Chí Minh"
      ],
      "7a/33/21 Thành Thái P14 Q10": [
        "Phường 14",
        "Quận 10",
        "Thành phố Hồ Chí Minh"
      ],
      "83 Đào Tấn": [],
      "Phan Ngữ, Ho Chi Minh City, Ho Chi Minh, Vietnam": [
        "Thành phố Hồ Chí Minh"
      ],
      "101 Trần Quang Diệu F14,Q3 HCM": [
        "Phường 14",
        "Quận 3",
        "Thành phố Hồ Chí Minh"
      ],
      "412 Nguyễn văn Cừ": [],
      "683a Âu Cơ, Phường Tân Thành, quận Tân Phú, Ho Chi Minh, Vietnam": [
        "Phường Tân Thành",
        "Quận Tân Phú",
        "Thành phố Hồ Chí Minh"
      ],
      "Đường Đỗ Pháp Thuận, An Phú, Ho Chi Minh, Vietnam": [
        // TODO
        // - phường An Phú, quận 2
        // - xã An Phú, Củ Chi
        "Thành phố Hồ Chí Minh"
      ],
      "Số 92 Đường Tứ Hiệp, TT Văn Điển, Thanh Trì, Hà Nội ( Gần Trung Tâm Thương Mại Huyện Thanh Trì )": [
        "Thị trấn Văn Điển",
        "Huyện Thanh Trì",
        "Thành phố Hà Nội"
      ],
      "B716 CC Hòa Bình F14 Q10 - đi hẻm 666 đường 3/2 vào": [
        "Phường 14",
        "Quận 10",
        "Thành phố Hồ Chí Minh"
      ],
      "3.04 Chung cư Res III - Phú Mỹ - Quận 7/ Đối diện FV - Gần Cresent Mall": [
        "Phường Phú Mỹ",
        "Quận 7",
        "Thành phố Hồ Chí Minh"
      ],
      "181/18 đường 3/2 phường 11 quận 10 (đối diện cổng khách sạn kỳ hòa)": [
        "Phường 11",
        "Quận 10",
        "Thành phố Hồ Chí Minh"
      ],
      "370/6d lê hồng phong bình dương ( Ngay Trường ĐH Bình Dương )": [
        "Tỉnh Bình Dương"
      ],
      "15/135 Cát Bi, Hai Phong, Haiphong, Vietnam": [
        "Phường Cát Bi",
        "Quận Hải An",
        "Thành phố Hải Phòng"
      ],
      "20 Trần Văn Hoàng P9 Q.TB (Gần ĐH Bách Khoa-Lý thuong kiệt Q10)": [
        "Phường 9",
        "Quận Tân Bình",
        "Thành phố Hồ Chí Minh"
      ],
      "Ngã 4 lạc long quân , q. tân bình , hcm ( nhà trong hẻm )": [
        "Quận Tân Bình",
        "Thành phố Hồ Chí Minh"
      ],
      "413 Lê Văn Sỹ, Hô Chi Minh, Vietnam": ["Thành phố Hồ Chí Minh"],
      "số 69 Trung Liệt Thái Hà Đông Đa": ["Quận Đống Đa", "Thành phố Hà Nội"],
      "139/18 Khương Thượng !": ["TODO"],
      "Số 2 Ngõ 508 Đường Láng,Đống Đa.(Cách Ngã Tư Sở 1km)": [
        "Quận Đống Đa",
        "Thành phố Hà Nội"
      ],
      "33 Đường Dân Lập – Lê Chân - Hải Phòng ( Đối Diện Cổng Trường ĐH DÂN LẬP)": [
        "Quận Lê Chân",
        "Thành phố Hải Phòng"
      ],
      "Số 3 ngõ 267 Hồ Tùng Mậu- Cầu Diễn-Từ Liêm-HN": ["TODO"],
      "63 Võ Văn Kiệt, phường An Lạc, Ho Chi Minh City, Ho Chi Minh, Vietnam": [
        "Phường An Lạc",
        "Quận Bình Tân",
        "Thành phố Hồ Chí Minh"
      ],
      "42/48 Chu Văn An, f12, quận Bình Thạnh,, Ho Chi Minh City, Ho Chi Minh, Vietnam": [
        "Phường 12",
        "Quận Bình Thạnh",
        "Thành phố Hồ Chí Minh"
      ],
      "Tiên Du District, Bac Ninh Province, Vietnam": [
        "Huyện Tiên Du",
        "Tỉnh Bắc Ninh"
      ],
      "48TT8B Khu đô Thị Văn Quán Hà Noi": [
        "Phường Văn Quán",
        "Quận Hà Đông",
        "Thành phố Hà Nội"
      ],
      "phố Linh Đường - Hoàng Mai ( đối diện bx Nước Ngầm)": [
        // TODO
        // - quận Hoàng Mai, Hà Nội
        // - thị xã Hoàng Mai, Nghệ An
      ],
      "Liên ấp 123, vĩnh lộc B, Bình Tân": ["TODO"],
      "Số 4 phố Vọng Đức, Hàng Bài, Hà Nội": [
        "Phường Hàng Bài",
        "Quận Hoàn Kiếm",
        "Thành phố Hà Nội"
      ],
      "30E Ky Con P.Ng.Thai Binh, Q.1": [
        // TODO: "Phường Nguyễn Thái Bình",
        "Quận 1",
        "Thành phố Hồ Chí Minh"
      ],
      "64/82/10 Nguyễn Khoái, P.02, Q.04, Tp.HCM": [
        "Phường 2",
        "Quận 4",
        "Thành phố Hồ Chí Minh"
      ],
      "98A Trần Quốc Toản, Phường 07, Quận 03, TPHCM": [
        "Phường 7",
        "Quận 3",
        "Thành phố Hồ Chí Minh"
      ],
      "151 An Dương Vương, thành phố Quảng Ngãi, Quảng Ngãi, Việt Nam": [
        "Thành phố Quảng Ngãi",
        "Tỉnh Quảng Ngãi"
      ],
      "Số 42 Ngõ 178 Thái Hà - ĐĐ - Hà Nội": [
        "Quận Đống Đa",
        "Thành phố Hà Nội"
      ],
      "147/A6 Đề Thám - Phường: Cô Giang - Quận: 1": [
        "Phường Cô Giang",
        "Quận 1",
        "Thành phố Hồ Chí Minh"
      ],
      "184 Lê Trọng Tấn – Thanh Xuân – Hà Nội": [
        "Quận Thanh Xuân",
        "Thành phố Hà Nội"
      ],
      "Số 30/294 lê lợi - TP Bắc Giang : ĐT 0985858180": ["TODO"],
      "Mỹ Đình 2, Từ Liêm, Hà Nội, Việt Nam": [
        "Phường Mỹ Đình 2",
        "Quận Nam Từ Liêm",
        "Thành phố Hà Nội"
      ],
      "cầu Sài Gòn": ["TODO"],
      "Đông Anh_Hà Nội": ["Huyện Đông Anh", "Thành phố Hà Nội"],
      "280 Trần Cung - Từ Liêm - Hà Nội": [
        "Quận Nam Từ Liêm",
        "Thành phố Hà Nội"
      ],
      "Cao Lãnh, Đồng Tháp": ["Thành phố Cao Lãnh", "Tỉnh Đồng Tháp"],
      "02 Xương Giang- TP Bắc Giang- Tỉnh Bắc Giang": [
        "Phường Xương Giang",
        "Thành phố Bắc Giang",
        "Tỉnh Bắc Giang"
      ],
      "Trường mẫu giáo Bé Hạnh Phúc, ngã 3 Tiểu La - Lê Thanh Nghị": [],
      "CHIẾN THẮNG/THANH TRÌ/HN": ["Huyện Thanh Trì", "Thành phố Hà Nội"],
      "Blackberry Sm@rtcom chính hãng - Petro Tower: 1-5 Lê Duẩn, Q.1, HCM": [
        "Quận 1",
        "Thành phố Hồ Chí Minh"
      ],
      "473 Duy Tân, tp Kon Tum, tỉnh Kon Tum": [
        "Phường Duy Tân",
        "Thành phố Kon Tum",
        "Tỉnh Kon Tum"
      ],
      "31 Đặng Văn Ngữ, Trung Tự, Hà Nội, Việt Nam": [
        "Phường Trung Tự",
        "Quận Đống Đa",
        "Thành phố Hà Nội"
      ],
      "Tòa nhà VNPT, 57 Huỳnh Thúc Kháng": [],
      "Tp. Thái Bình, Thái Bình, Việt Nam": [
        "Thành phố Thái Bình",
        "Tỉnh Thái Bình"
      ],
      "Tầng 13 Toà B5 - 234 Phạm Văn Đồng - HN": [],
      "640 Quốc Lộ 13, KP4, P. Hiệp  Bình Phước, Q. Thủ Đức": [
        "Phường Hiệp Bình Phước",
        "Quận Thủ Đức",
        "Thành phố Hồ Chí Minh"
      ],
      "585 Huỳnh Tấn Phát, Q.7": ["Quận 7", "Thành phố Hồ Chí Minh"],
      "97-99 Tôn Thất Đạm, Q1": ["Quận 1", "Thành phố Hồ Chí Minh"],
      NCT: [],
      "Tp. Hải Dương, Hải Dương, Việt Nam": [
        "Thành phố Hải Dương",
        "Tỉnh Hải Dương"
      ],
      "114/32 - Phạm Văn Chiêu - P.09 - GV": [
        "Phường 9",
        "Quận Gò Vấp",
        "Thành phố Hồ Chí Minh"
      ],
      "14 Hạc Thành, tp. Thanh Hoá, Thanh Hoa, Vietnam": [
        "Thành phố Thanh Hóa",
        "Tỉnh Thanh Hóa"
      ],
      "14 Thạch Lam.Phú Thạnh. Tân Phú - 0938223586": [
        "Phường Phú Thạnh",
        "Quận Tân Phú",
        "Thành phố Hồ Chí Minh"
      ],
      "255 Nguyễn Văn Rốp Kp5 P4 TP.Tây Ninh Tỉnh Tây Ninh": [
        "Phường 4",
        "Thành phố Tây Ninh",
        "Tỉnh Tây Ninh"
      ],
      "Mỹ Đình, Mỹ Đình 1, Từ Liêm, Hanoi, Vietnam": [
        "Phường Mỹ Đình 1",
        "Quận Nam Từ Liêm",
        "Thành phố Hà Nội"
      ],

      "133 tran hung dao quan5": ["Quận 5", "Thành phố Hồ Chí Minh"],
      "số 8 trần nhân tông , p thanh sơn , tp phan rang tháp chàm , ninh thuận": [
        "Phường Thanh Sơn",
        "Thành phố Phan Rang-Tháp Chàm",
        "Tỉnh Ninh Thuận"
      ],
      "Số 44 KV1, P. Ba Láng, Q. Cái Răng, Tp. Cần Thơ": [
        "Phường Ba Láng",
        "Quận Cái Răng",
        "Thành phố Cần Thơ"
      ],
      "số 2 tôn thất thuyết/phường mỹ đình 2/quận nam từ liêm/thành phố hà nội": [
        "Phường Mỹ Đình 2",
        "Quận Nam Từ Liêm",
        "Thành phố Hà Nội"
      ],
      "927 Tổ 23,KP,Bình Thung,P,Bình An,TX,Dĩ An,Tỉnh,Bình Dương": [
        // TODO
        "Tỉnh Bình Dương"
      ],
      "25 ngô quyền, hoàn kiếm": ["Quận Hoàn Kiếm", "Thành phố Hà Nội"],
      "Chung cư Viện Bỏng - Hà Đông": ["Quận Hà Đông", "Thành phố Hà Nội"],
      "Hà Đông, Hà Tây": ["Quận Hà Đông", "Thành phố Hà Nội"],
      "Hà Tây": ["Tỉnh Hà Tây"],
      "290 Bình Long, Phú Thạnh,Tân Phú,Hồ Chí Minh, Tân Phú, Việt Nam": [
        // TODO
        // - Huyện Tân Phú, Đồng Nai
        // - Quận Tân Phú, tp. Hồ Chí Minh
      ],
      "290 Bình Long, Phú Thạnh,Tân Phú,Hồ Chí Minh": [
        "Phường Phú Thạnh",
        "Quận Tân Phú",
        "Thành phố Hồ Chí Minh"
      ],
      "220/50A/50C XVNT QBT": [
        // TODO
        // - Quận Bình Thạnh, tp. Hồ Chí Minh
        // - Quận Bình Tân, tp. Hồ Chí Minh
        // - Quận Bình Thuỷ, Cần Thơ
      ],
      "Ngõ 86, Cầu Diễn": [],
      "Ngõ 86, Cầu Diễn, Việt Nam": [
        "Phường Cầu Diễn",
        "Quận Nam Từ Liêm",
        "Thành phố Hà Nội"
      ],
      "49 vũ tông phan": [],
      "Quy Nhon Binh Dinh": ["Thành phố Qui Nhơn", "Tỉnh Bình Định"],
      "tp. Quy Nhơn Bình Định": ["Thành phố Qui Nhơn", "Tỉnh Bình Định"],
      "Xài Đồng, Long Biên": [
        "Phường Sài Đồng",
        "Quận Long Biên",
        "Thành phố Hà Nội"
      ],
      "phường 12 quận x": ["Phường 12", "Quận 10", "Thành phố Hồ Chí Minh"],
      "Phường Duyệt Chung thành phố Cao Bằng tỉnh Cao Bằng": [
        "Phường Duyệt Trung",
        "Thành phố Cao Bằng",
        "Tỉnh Cao Bằng"
      ],
      "Thị trấn Pác Mi Ầu huyện Bảo Lâm tỉnh Cao Bằng": [
        "Thị trấn Pác Miầu",
        "Huyện Bảo Lâm",
        "Tỉnh Cao Bằng"
      ],
      "Xã Yên Trung huyện Thạnh Thất thành phố Hà Nội": [
        "Xã Yên Trung",
        "Huyện Thạch Thất",
        "Thành phố Hà Nội"
      ],
      "Phường Tràng Minh huyện Kiến An thành phố Hải Phòng": [
        "Phường Tràng Minh",
        "Quận Kiến An",
        "Thành phố Hải Phòng"
      ],
      "Tỉnh Thừa Thiên - Huế": ["Tỉnh Thừa Thiên Huế"],
      "49 - Tỉnh Thừa Thiên - Huế": ["Tỉnh Thừa Thiên Huế"],
      "Huyện Ia H'Drai tỉnh Kon Tum": ["Huyện Ia H' Drai", "Tỉnh Kon Tum"],
      "Thành phố Tuy Hoà tỉnh Phú Yên": ["Thành phố Tuy Hoà", "Tỉnh Phú Yên"],
      "thanh pho tuy hoa tinh phu yen": ["Thành phố Tuy Hoà", "Tỉnh Phú Yên"],
      "Xã Trung Thịnh huyện Xín Mần tỉnh Hà Giang": ["01117", "033", "02"],
      "Huyện Kỳ Anh tỉnh Hà Tĩnh": ["447", "42"],
      "Thị xã Kỳ Anh tỉnh Hà Tĩnh": ["449", "42"]
    };

    Object.keys(map).forEach(input =>
      it(input, function() {
        const expected = map[input];
        let parse = parseForFullNames;

        if (expected.length > 0) {
          if (expected[0] === "TODO") return this.skip();
          if (expected[0].match(/^[0-9]+$/)) parse = parseForIds;
        }

        const actual = parse(input);
        expect(actual).to.deep.equal(expected);
      })
    );
  });
});
