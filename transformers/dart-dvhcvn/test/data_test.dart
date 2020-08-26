import 'package:dvhcvn/src/util.dart';
import 'package:test/test.dart';

import 'package:dvhcvn/dvhcvn.dart' as dvhcvn;

void main() {
  test('level1s is not empty', () {
    expect(dvhcvn.level1s, isNotEmpty);
  });

  test('findLevel1ById returns', () {
    final level1 = findLevel1ById('01');
    expect(level1, isNotNull);
    expect(level1.name, equals('Thành phố Hà Nội'));
  });

  test('findLevel1ByName returns', () {
    final level1 = findLevel1ByName('Thành phố Hà Nội');
    expect(level1, isNotNull);
    expect(level1.id, equals('01'));
  });

  group('L1', () {
    final haNoi = findLevel1ById('01');

    test('findLevel2ById returns', () {
      final level2 = haNoi.findLevel2ById('001');
      expect(level2, isNotNull);
      expect(level2.name, equals('Quận Ba Đình'));
    });

    test('findLevel2ByName returns', () {
      final level2 = haNoi.findLevel2ByName('Quận Ba Đình');
      expect(level2, isNotNull);
      expect(level2.id, equals('001'));
    });
  });

  group('L2', () {
    final haNoi = findLevel1ById('01');
    final baDinh = haNoi.findLevel2ById('001');

    test('findLevel3ById returns', () {
      final level3 = baDinh.findLevel3ById('00001');
      expect(level3, isNotNull);
      expect(level3.name, equals('Phường Phúc Xá'));
    });

    test('findLevel3ByName returns', () {
      final level3 = baDinh.findLevel3ByName('Phường Phúc Xá');
      expect(level3, isNotNull);
      expect(level3.id, equals('00001'));
    });
  });
}
