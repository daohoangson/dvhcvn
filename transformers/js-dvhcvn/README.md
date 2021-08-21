# Các đơn vị hành chính Việt Nam

Dữ liệu được cập nhật từ [daohoangson/dvhcvn](https://github.com/daohoangson/dvhcvn).

## Ví dụ sử dụng

### JavaScript

```js
import { findLevel1ById } from 'dvhcvn'

// ...

const haNoi = findLevel1ById('01')
const baDinh = haNoi?.findLevel2ById('001')
const phucXa = baDinh?.findLevel3ById('00001')

console.log(phucXa); // Thành phố Hà Nội > Quận Ba Đình > Phường Phúc Xá
```

### Next.js

https://github.com/dvhcvn/nextjs-demo

## API

### const level1s

Đây là `array` chứa tất cả các đơn vị hành chính cấp 1 (thành phố trực thuộc Trung ương / tỉnh).

### findLevel1ById(string)

Tìm đơn vị hành chính cấp 1 theo ID.

### findLevel1ByName(string)

Tìm đơn vị hành chính cấp 1 theo tên.

### class Level1, Level2, Level3

Mỗi class này tương ứng với một cấp đơn vị hành chính.
Fields:

- `id: string`
- `name: string`
- `type: Type`

`Level2` và `Level3` có thêm field `parent`.

`Level1`, `Level2` có thêm field `children` và methods `findLevelXById`, `findLevelXByName`.
