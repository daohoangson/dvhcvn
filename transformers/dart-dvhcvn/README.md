# Các đơn vị hành chính Việt Nam

Dữ liệu được cập nhật từ [daohoangson/dvhcvn](https://github.com/daohoangson/dvhcvn).

## Ví dụ sử dụng

### Dart

```dart
import 'package:dvhcvn/dvhcvn.dart' as dvhcvn;

// ...

final haNoi = dvhcvn.findLevel1ById('01');
final baDinh = haNoi.findLevel2ById('001');
final phucXa = baDinh.findLevel3ById('00001');

print(phucXa); // Thành phố Hà Nội > Quận Ba Đình > Phường Phúc Xá
```

### Flutter

https://github.com/daohoangson/flutter-dvhcvn

<img src="https://github.com/daohoangson/flutter-dvhcvn/raw/master/screenshots/demo.gif" width="300" />

## API

### const level1s

Đây là `List` chứa tất cả các đơn vị hành chính cấp 1 (thành phố trực thuộc Trung ương / tỉnh).

### findLevel1ById(String)

Tìm đơn vị hành chính cấp 1 theo ID.

### findLevel1ByName(String)

Tìm đơn vị hành chính cấp 1 theo tên.

### class Level1, Level2, Level3

Mỗi class này tương ứng với một cấp đơn vị hành chính.
Fields:

- `String id`
- `String name`
- `Type type`

`Level2` và `Level3` có thêm field `parent`.

`Level1`, `Level2` có thêm field `children` và methods `findLevelXById`, `findLevelXByName`.
