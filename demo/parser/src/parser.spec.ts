import Parser from "./parser";
import { expect } from "chai";

describe("Parser", () => {
  describe("parse", () => {
    const p = new Parser();
    const parse = (address: string) => {
      const results = p.parse(address);
      return results.map(result => `${result.type} ${result.name}`);
    };

    const map = {
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
      "373/22/10/20 Hà Huy Giáp, thạnh xuân, quận 12. Tp. Hcm": [
        "Phường Thạnh Xuân",
        "Quận 12",
        "Thành phố Hồ Chí Minh"
      ],
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
      "9 Đinh Tiên Hoàng, pĐakao, q1 - Toà nhà SFC": [],
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
      "172/194/35, An Dương Vương, Q8, gần ngã 4 Võ Văn Kiệt-An Dương Vương": [],
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
      ]
    };

    Object.keys(map).forEach(input =>
      it(input, () => {
        const result = parse(input);
        expect(result).to.deep.equal(map[input]);
      })
    );

    // const only = '137 bến bãi sậy f4 q6 hcmc';
    // it.only(only, () => {
    //   const result = parse(only);
    //   expect(result).to.deep.equal(['Phường 4', 'Quận 6', 'Thành phố Hồ Chí Minh']);
    // })
  });
});
