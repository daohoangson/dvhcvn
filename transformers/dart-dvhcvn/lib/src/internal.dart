import 'package:dvhcvn/src/model.dart';

T? findById<T extends Entity>(List<T> list, String id) {
  for (final item in list) {
    if (item.id == id) {
      return item;
    }
  }

  return null;
}

T? findByName<T extends Entity>(List<T> list, String name) {
  for (final item in list) {
    if (item.name == name) {
      return item;
    }
  }

  return null;
}
