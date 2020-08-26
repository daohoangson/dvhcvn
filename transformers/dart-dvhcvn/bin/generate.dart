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

final typeEntries = types.entries.toList(growable: false);

void main(List<String> args) {
  stdout.writeln("import 'model.dart';");

  for (var i = 0; i < typeEntries.length; i++) {
    if (typeEntries[i].value != 'tptw') {
      stdout.writeln("const s$i = '${typeEntries[i].key}';");
    }

    stdout.writeln('const t$i = Type.${typeEntries[i].value};');
  }
  stdout.writeln();

  stdout.write('const level1s = [');

  final txt = File(args[0]).readAsStringSync();
  final json = jsonDecode(txt) as Map;
  final data = json['data'] as List;
  for (final level1 in data) {
    _processLevel1(level1);
  }

  stdout.write('];');
}

String _getString(String str) {
  if (!str.contains("'")) return "'$str'";
  if (!str.contains('"')) return '"$str"';
  return "'${str.replaceAll("'", "\\'")}'";
}

String _getStringName(String str) {
  var prefixFound = false;
  for (var i = 0; i < typeEntries.length; i++) {
    final prefix = typeEntries[i].key.toLowerCase();
    if (str.toLowerCase().startsWith(prefix)) {
      str = '\$s$i' + str.substring(prefix.length);
      prefixFound = true;
    }
  }

  if (!prefixFound) {
    stderr.writeln('No prefix found: $str');
    exit(1);
  }

  return _getString(str);
}

// ignore: missing_return
String _getType(String str) {
  for (var i = 0; i < typeEntries.length; i++) {
    if (typeEntries[i].key == str) {
      return 't$i';
    }
  }

  stderr.writeln('Type not found: $str');
  exit(1);
}

void _processLevel1(Map level1) {
  final id = _getString(level1['level1_id']);
  final name = _getStringName(level1['name']);
  final type = _getType(level1['type']);
  stdout.write("Level1($id, $name, $type, [");

  final level2s = level1['level2s'] as List;
  for (final level2 in level2s) {
    _processLevel2(level2);
  }

  stdout.writeln(']),');
}

void _processLevel2(Map level2) {
  final id = _getString(level2['level2_id']);
  final name = _getStringName(level2['name']);
  final type = _getType(level2['type']);
  stdout.write("Level2($id, $name, $type, [");

  final level3s = level2['level3s'] as List;
  for (final level3 in level3s) {
    _processLevel3(level3);
  }

  stdout.writeln(']),');
}

void _processLevel3(Map level3) {
  final id = _getString(level3['level3_id']);
  final name = _getStringName(level3['name']);
  final type = _getType(level3['type']);
  stdout.writeln("Level3($id, $name, $type),");
}
