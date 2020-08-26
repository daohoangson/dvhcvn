import 'data.dart';
import 'internal.dart';
import 'model.dart';

Level1 findLevel1ById(String id) => findById<Level1>(level1s, id);

Level1 findLevel1ByName(String name) => findByName<Level1>(level1s, name);
