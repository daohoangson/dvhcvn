# Các đơn vị hành chính Việt Nam

Dữ liệu được cập nhật trực tiếp từ trang [Đơn vị hành chính](https://www.gso.gov.vn/dmhc2015/Default.aspx) của Tổng cục thống kê thông qua [web service](https://www.gso.gov.vn/dmhc2015/WebService.aspx).

## Sử dụng

- Dữ liệu đầy đủ [full.json](/data/full.json) bao gồm tất cả các thông tin mà TCTK cung cấp qua web service

## Tự cập nhật

Nếu vì lý do nào đó bạn không muốn dùng các file dữ liệu có sẵn tại đây và muốn tự tải về trực tiếp từ TCTK, thực hiện các câu lệnh như sau:

```bash
cd dvhcvn

# tải file full.json
./updater/updater.sh
```
