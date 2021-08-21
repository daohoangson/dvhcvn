# Các đơn vị hành chính Việt Nam

Dữ liệu được cập nhật từ trang [Danh mục hành chính](https://danhmuchanhchinh.gso.gov.vn/) của Tổng cục thống kê và [Hệ thống bản đồ hành chính](http://gis.chinhphu.vn) của Cổng thông tin điện tử Chính phủ.

## Các tập dữ liệu

### dvhcvn.json

Thông tin 3 cấp đơn vị hành chính trả về từ [web service của TCTK](https://danhmuchanhchinh.gso.gov.vn/DMDVHC.asmx):

- Tỉnh thành:
  - `level1_id`
  - `name`
  - `type`: Thành phố Trung ương | Tỉnh
  - `level2s`
- Quận huyện
  - `level2_id`
  - `name`
  - `type`: Quận | Huyện | Thành phố | Thị xã
  - `level3s`
- Phường xã
  - `level3_id`
  - `name`
  - `type`: Phường | Xã | Thị trấn

Ví dụ:

```json
{
  "level1_id": "56",
  "name": "Tỉnh Khánh Hòa",
  "type": "Tỉnh",
  "level2s": [
    {
      "level2_id": "568",
      "name": "Thành phố Nha Trang",
      "type": "Thành phố",
      "level3s": [
        {
          "level3_id": "22363",
          "name": "Phường Lộc Thọ",
          "type": "Phường"
        },
        "..."
      ]
    },
    "..."
  ]
```

### [gis/\*.json](/data/gis/)

Thông tin địa giới trích xuất từ [Hệ thống bản đồ hành chính](http://gis.chinhphu.vn) cho 2 cấp: tỉnh thành và quận huyện.

#### <level1_id>.json

Do nhiều dữ liệu nên mỗi tỉnh thành được tách ra một tập riêng.
Trong đó, mỗi đơn vị hành chính (tỉnh thành hoặc quận huyện) có các thông tin:

- `coordinates`
- `bbox`
- `type`: MultiPolygon | Polygon

Ví dụ [tập dữ liệu của Khánh Hoà](/data/gis/56.json), có nội dung như sau:

```json
{
  "level1_id": "56",
  "name": "Tỉnh Khánh Hòa",
  "level2s": [
    {
      "level2_id": "568",
      "name": "Thành phố Nha Trang",
      "coordinates": [
        [
          [[109.317273127, 12.1642742720001], "... (khoảng 30 cặp toạ độ)"],
          "... (khoảng 10 đa giác)"
        ]
      ],
      "bbox": [109.110859607, 12.141705888, 109.370714452, 12.3798137530001],
      "type": "MultiPolygon"
    },
    "..."
  ],
  "coordinates": ["... (khoảng 50 đa giác)"],
  "bbox": [108.669676534, 7.89146445900019, 115.836420367, 12.86823071],
  "type": "MultiPolygon"
}
```

#### level1s_bbox.json

Riêng dữ liệu `bbox` của tỉnh thành được lưu riêng với nội dung như sau:

```json
{
  "01": [
    105.28500419,
    20.5642508770001,
    106.020154616,
    21.3855144820001
  ],
  "..."
}
```

### [sorted.json](/data/sorted.json)

Thông tin 3 cấp đơn vị hành chính đã được sắp xếp theo tên riêng.
Để tiết kiệm dung lượng, mỗi đơn vị hành chính là một mảng có các thành phần theo thứ tự như sau:

0. Mã đơn vị
1. Tên riêng
2. Tiền tố
3. Tên riêng không dấu
4. Các đơn vị trực thuộc

Ví dụ:

```json
[
  [
    "89", "An Giang", "Tỉnh", "An Giang",
    [
      [
        "886", "An Phú", "Huyện", "An Phu",
        [
          ["30337", "An Phú", "Thị trấn", "An Phu"],
          ["30373", "Đa Phước", "Xã", "Da Phuoc"],
          ["30340", "Khánh An", "Xã", "Khanh An"],
          "..."
        ]
      ],
      "..."
    ]
  ],
  "..."
]
```

## Thư viện hỗ trợ

- Dart [pub.dev](https://pub.dev/packages/dvhcvn)
- JavaScript [npm](https://www.npmjs.com/package/dvhcvn)

## Demo

- [geolocation](https://dvhcvn.vercel.app/demo/geolocation.html): xác định dvhc từ kinh độ, vĩ độ
- [map](https://dvhcvn.vercel.app/demo/map.html): hiển thị dvhc trên bản đồ [Goong.io](https://goong.io)
- [parser](https://dvhcvn.vercel.app/demo/parser.html): xác định dvhc từ địa chỉ (xem parser API bên dưới)
- [parser API](https://dvhcvn.vercel.app/demo/parser/api):
  - Cách 1: `curl https://dvhcvn.vercel.app/demo/parser/api -d input=hanoi` -> chỉ trả về tên các dvhc "**Thành phố Hà Nội**"
  - Cách 2: `curl https://dvhcvn.vercel.app/demo/parser/api -H 'Content-Type: text/plain' -d hanoi` -> trả về thông tin chi tiết
  - Ví dụ: `curl https://dvhcvn.vercel.app/demo/parser/api -H 'Content-Type: text/plain' -d 'trung tu, dong da, ha noi'` trả về `[{"id":"00226","name":"Trung Tự","type":"Phường"},{"id":"006","name":"Đống Đa","type":"Quận"},{"id":"01","name":"Hà Nội","type":"Thành phố"}]`

## Nhưng... tại sao?!

Bộ dữ liệu này được tạo ra vì các dự án tương tự trên mạng Internet cung cấp thông tin không đầy đủ hoặc không được cập nhật thường xuyên.
Để tránh việc tương tự xảy ra với dự án này, một [daily cron](/firebase/functions/src/cron.ts) sẽ đối chiếu ngày hiệu lực của [nghị định mới nhất](https://danhmuchanhchinh.gso.gov.vn/NghiDinh.aspx) và ngày cập nhật dữ liệu để cảnh báo qua [Telegram group](https://t.me/dvhcvn).

## Tự tải về

Nếu vì lý do nào đó bạn không muốn dùng dữ liệu có sẵn tại đây và muốn tự tải về trực tiếp từ nguồn, thực hiện các câu lệnh như sau:

```bash
git clone https://github.com/daohoangson/dvhcvn.git
cd dvhcvn

# xoá dữ liệu có sẵn
rm -rf ./data/*

# bắt đầu tải
./downloader/download.sh

# chạy các đoạn mã chuyển đổi
./transformers/transform-all.sh
```

## Nguồn tham khảo

- Tổng cục thống kê https://danhmuchanhchinh.gso.gov.vn
- Cổng thông tin điện tử chính phủ http://gis.chinhphu.vn
- https://github.com/linhmtran168/vietnam-gis-crawler
- https://github.com/madnh/hanhchinhvn
