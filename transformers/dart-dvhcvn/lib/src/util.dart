import 'package:dvhcvn/src/data.dart';
import 'package:dvhcvn/src/internal.dart';
import 'package:dvhcvn/src/model.dart';

/// Finds level 1 entity by ID.
Level1? findLevel1ById(String id) => findById(level1s, id);

/// Finds level 1 entity by name.
Level1? findLevel1ByName(String name) => findByName(level1s, name);
