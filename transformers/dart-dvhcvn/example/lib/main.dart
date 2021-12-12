// ignore_for_file: avoid_print

import 'package:dvhcvn/dvhcvn.dart' as dvhcvn;

void main() {
  final haNoi = dvhcvn.findLevel1ById('01');
  final baDinh = haNoi?.findLevel2ById('001');
  final phucXa = baDinh?.findLevel3ById('00001');

  print(phucXa); // Thành phố Hà Nội > Quận Ba Đình > Phường Phúc Xá
}
