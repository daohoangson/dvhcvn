# Các đơn vị hành chính Việt Nam

Dữ liệu được cập nhật từ trang [Đơn vị hành chính](https://www.gso.gov.vn/dmhc2015/) của Tổng cục thống kê và [Hệ thống bản đồ hành chính](http://gis.chinhphu.vn) của Cổng thông tin điện tử Chính phủ.

## Các tập dữ liệu

### [dvhcvn.json](/data/dvhcvn.json)

Thông tin 3 cấp đơn vị hành chính trả về từ [web service của TCTK](https://www.gso.gov.vn/dmhc2015/WebService.aspx):

- Tỉnh thành:
  - `level1_id` string
  - `name` string
  - `type`: Thành phố Trung ương | Tỉnh
  - `level2s` array
- Quận huyện
  - `level2_id` string
  - `name` string
  - `type`: Quận | Huyện | Thành phố | Thị xã
  - `level3s` array
- Phường xã
  - `level3_id` string
  - `name` string
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

### [gis/*.json](/data/gis/)

Thông tin địa giới trích xuất từ [Hệ thống bản đồ hành chính](http://gis.chinhphu.vn) cho 2 cấp: tỉnh thành và quận huyện.
Do nhiều dữ liệu nên mỗi tỉnh thành được tách ra một tập riêng lưu tại `data/gis/<level1_id>.json`.

Mỗi đơn vị hành chính có các thông tin:

- `coordinates` array
- `bbox` array
- `type`: MultiPolygon | Polygon

Ví dụ tập dữ liệu của Khánh Hoà, [data/gis/56.json](/data/gis/56.json), có nội dung như sau:

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

#### Nha Trang, Khánh Hoà ([xem](https://dvhcvn.daohoangson.now.sh/demo/gis.html?level1_id=56&level2_id=568))

![GIS demo: Nha Trang, Khánh Hoà](/demo/gis/56/568.png)

Huyện Trường Sa thuộc tỉnh Khánh Hoà nên khoanh vùng của tỉnh vượt về phía bên phải (đi ra biển Đông).

#### Ha Nang, Tuyên Quang ([xem](https://dvhcvn.daohoangson.now.sh/demo/gis.html?level1_id=08&level2_id=072))

![GIS demo: Ha Nang, Tuyên Quang](/demo/gis/08/072.png)

Đa số các đơn vị hành chính có dữ liệu địa giới dạng `MultiPolygon` nhưng một số ít, như huyện Ha Nang, có địa giới dạng `Polygon`.

## Nhưng... tại sao?!

Bộ dữ liệu này được tạo ra vì các dự án tương tự trên mạng Internet cung cấp thông tin không đầy đủ hoặc không được cập nhật thường xuyên.
Để tránh việc tương tự xảy ra với dự án này, một [daily cron](/firebase/functions/src/cron.ts) sẽ đối chiếu ngày hiệu lực của [nghị định mới nhất](https://www.gso.gov.vn/dmhc2015/NghiDinh.aspx) và ngày cập nhật dữ liệu lần cuối trên GitHub để cảnh báo qua Telegram.

## Tự tải về

Nếu vì lý do nào đó bạn không muốn dùng dữ liệu có sẵn tại đây và muốn tự tải về trực tiếp từ nguồn, thực hiện các câu lệnh như sau:

```bash
git clone https://github.com/daohoangson/dvhcvn.git
cd dvhcvn

# xoá dữ liệu có sẵn
rm -rf ./data

# bắt đầu tải
./downloader/download.sh

# chạy các đoạn mã chuyển đổi
./transformers/transform-all.sh
```

## Nguồn tham khảo

- Tổng cục thống kê https://www.gso.gov.vn/dmhc2015/
- Cổng thông tin điện tử chính phủ http://gis.chinhphu.vn
- https://github.com/linhmtran168/vietnam-gis-crawler
- https://github.com/madnh/hanhchinhvn
