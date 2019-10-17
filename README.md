# Các đơn vị hành chính Việt Nam

Dữ liệu được cập nhật từ trang [Đơn vị hành chính](https://www.gso.gov.vn/dmhc2015/) của Tổng cục thống kê và [Hệ thống bản đồ hành chính](http://gis.chinhphu.vn) của Cổng thông tin điện tử Chính phủ.

## Sử dụng

- [dvhcvn.json](/data/dvhcvn.json): thông tin 3 cấp trả về từ [web service của TCTK](https://www.gso.gov.vn/dmhc2015/WebService.aspx):
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
- [gis.json.gz](/data/gis.json.gz): thông tin toạ độ trích xuất từ [Hệ thống bản đồ hành chính](http://gis.chinhphu.vn) cho 2 cấp: tỉnh thành và quận huyện. Mỗi đơn vị hành chính có các thông tin:
  - `coordinates` array
  - `bbox` array
  - `type`: MultiPolygon | Polygon

## Nhưng... tại sao?!

Bộ dữ liệu này được tạo ra vì các dự án tương tự trên mạng Internet cung cấp thông tin không đầy đủ hoặc không được cập nhật thường xuyên.
Để tránh việc tương tự xảy ra với dự án này, một [daily cron](/firebase/functions/src/cron.ts) sẽ đối chiếu ngày hiệu lực của [nghị định mới nhất](https://www.gso.gov.vn/dmhc2015/NghiDinh.aspx) và ngày cập nhật dữ liệu lần cuối trên GitHub để cảnh báo qua Telegram.

## Tự cập nhật

Nếu vì lý do nào đó bạn không muốn dùng dữ liệu có sẵn tại đây và muốn tự tải về trực tiếp từ nguồn, thực hiện các câu lệnh như sau:

```bash
git clone https://github.com/daohoangson/dvhcvn.git
cd dvhcvn

# xoá dữ liệu có sẵn
rm -rf ./data

# bắt đầu tải
./updater/updater.sh
```

## Nguồn tham khảo

- Tổng cục thống kê https://www.gso.gov.vn/dmhc2015/
- Cổng thông tin điện tử chính phủ http://gis.chinhphu.vn
- https://github.com/linhmtran168/vietnam-gis-crawler
- https://github.com/madnh/hanhchinhvn
