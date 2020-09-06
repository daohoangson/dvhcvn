import 'dart:convert';
import 'dart:io';

const types = {
  'Thành phố Trung ương': 'tptw',
  'Tỉnh': 'tinh',
  'Thành phố': 'tp',
  'Quận': 'quan',
  'Huyện': 'huyen',
  'Phường': 'phuong',
  'Xã': 'xa',
  'Thị trấn': 'thi_tran',
  'Thị xã': 'thi_xa',
};

void main(List<String> args) {
  stdout.writeln("import 'model.dart';");
  stdout.writeln();

  stdout.writeln('/// Level 1 entities.');
  stdout.write('const level1s = [');

  final txt = File(args[0]).readAsStringSync();
  final json = jsonDecode(txt) as Map;
  final data = json['data'] as List;
  for (var i = 0; i < data.length; i++) {
    _processLevel1(i, data[i]);
  }

  stdout.write('];');
}

String _getString(String str) {
  if (!str.contains("'")) return "'$str'";
  if (!str.contains('"')) return '"$str"';
  return "'${str.replaceAll("'", "\\'")}'";
}

// ignore: missing_return
String _getType(String str) {
  if (types.containsKey(str)) return 'Type.${types[str]}';

  stderr.writeln('Type not found: $str');
  exit(1);
}

void _processLevel1(int level1Index, Map level1) {
  final id = _getString(level1['level1_id']);
  final name = _getString(level1['name']);
  final type = _getType(level1['type']);
  stdout.write("Level1($id, $name, $type, [");

  final level2s = level1['level2s'] as List;
  for (var i = 0; i < level2s.length; i++) {
    _processLevel2(level1Index, i, level2s[i]);
  }

  stdout.writeln(']),');
}

void _processLevel2(int level1Index, int level2Index, Map level2) {
  final id = _getString(level2['level2_id']);
  final name = _getString(level2['name']);
  final type = _getType(level2['type']);
  stdout.write("Level2($level1Index, $id, $name, $type, [");

  final level3s = level2['level3s'] as List;
  for (final level3 in level3s) {
    _processLevel3(level1Index, level2Index, level3);
  }

  stdout.writeln(']),');
}

void _processLevel3(int level1Index, int level2Index, Map level3) {
  final id = _getString(level3['level3_id']);
  final name = _getString(level3['name']);
  final type = _getType(level3['type']);
  stdout.writeln("Level3($level1Index, $level2Index, $id, $name, $type),");
}
