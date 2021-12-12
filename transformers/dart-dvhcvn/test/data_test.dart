import 'package:dvhcvn/dvhcvn.dart' as dvhcvn;
import 'package:dvhcvn/src/util.dart';
import 'package:test/test.dart';

void main() {
  test('level1s is not empty', () {
    expect(dvhcvn.level1s, isNotEmpty);
  });

  test('findLevel1ById returns', () {
    final level1 = findLevel1ById('01');
    expect(level1, isNotNull);
    expect(level1?.name, equals('Thành phố Hà Nội'));
  });

  test('findLevel1ByName returns', () {
    final level1 = findLevel1ByName('Thành phố Hà Nội');
    expect(level1, isNotNull);
    expect(level1?.id, equals('01'));
  });

  group('Entity', () {
    group('typeAsString', () {
      test('returns Type.huyen', () {
        final haNoi = dvhcvn.findLevel1ById('01');
        final socSon = haNoi?.findLevel2ById('016');
        expect(socSon?.typeAsString, equals('Huyện'));
      });

      test('returns Type.quan', () {
        final haNoi = dvhcvn.findLevel1ById('01');
        final baDinh = haNoi?.findLevel2ById('001');
        expect(baDinh?.typeAsString, equals('Quận'));
      });

      test('returns Type.phuong', () {
        final haNoi = dvhcvn.findLevel1ById('01');
        final baDinh = haNoi?.findLevel2ById('001');
        final phucXa = baDinh?.findLevel3ById('00001');
        expect(phucXa?.typeAsString, equals('Phường'));
      });

      test('returns Type.thi_tran', () {
        final haNoi = dvhcvn.findLevel1ById('01');
        final socSon = haNoi?.findLevel2ById('016');
        final thiTran = socSon?.findLevel3ById('00376');
        expect(thiTran?.typeAsString, equals('Thị trấn'));
      });

      test('returns Type.thi_xa', () {
        final haNoi = dvhcvn.findLevel1ById('01');
        final sonTay = haNoi?.findLevel2ById('269');
        expect(sonTay?.typeAsString, equals('Thị xã'));
      });

      test('returns Type.tinh', () {
        final haGiang = dvhcvn.findLevel1ById('02');
        expect(haGiang?.typeAsString, equals('Tỉnh'));
      });

      test('returns Type.tp', () {
        final haGiang = dvhcvn.findLevel1ById('02');
        final tp = haGiang?.findLevel2ById('024');
        expect(tp?.typeAsString, equals('Thành phố'));
      });

      test('returns Type.tptw', () {
        final haNoi = dvhcvn.findLevel1ById('01');
        expect(haNoi?.typeAsString, equals('Thành phố trực thuộc Trung ương'));
      });

      test('returns Type.xa', () {
        final haNoi = dvhcvn.findLevel1ById('01');
        final socSon = haNoi?.findLevel2ById('016');
        final bacSon = socSon?.findLevel3ById('00379');
        expect(bacSon?.typeAsString, equals('Xã'));
      });
    });
  });

  group('Level1', () {
    final haNoi = findLevel1ById('01');

    test('findLevel2ById returns', () {
      final level2 = haNoi?.findLevel2ById('001');
      expect(level2?.name, equals('Quận Ba Đình'));
    });

    test('findLevel2ByName returns', () {
      final level2 = haNoi?.findLevel2ByName('Quận Ba Đình');
      expect(level2?.id, equals('001'));
    });
  });

  group('Level2', () {
    final haNoi = findLevel1ById('01');
    final baDinh = haNoi?.findLevel2ById('001');

    test('parent returns', () => expect(baDinh?.parent, equals(haNoi)));

    test('findLevel3ById returns', () {
      final level3 = baDinh?.findLevel3ById('00001');
      expect(level3?.name, equals('Phường Phúc Xá'));
    });

    test('findLevel3ByName returns', () {
      final level3 = baDinh?.findLevel3ByName('Phường Phúc Xá');
      expect(level3?.id, equals('00001'));
    });
  });

  group('Level3', () {
    final haNoi = findLevel1ById('01');
    final baDinh = haNoi?.findLevel2ById('001');
    final phucXa = baDinh?.findLevel3ById('00001');

    test('parent returns', () => expect(phucXa?.parent, equals(baDinh)));
  });
}
