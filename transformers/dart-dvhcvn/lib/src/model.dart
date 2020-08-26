import 'internal.dart';

abstract class Entity<ChildType> {
  final List<ChildType> children;
  final String id;
  final String name;
  final Type type;

  const Entity(this.id, this.name, this.type, [this.children]);
}

class Level1 extends Entity<Level2> {
  const Level1(String id, String name, Type type, List<Level2> children)
      : super(id, name, type, children);

  Level2 findLevel2ById(String id) => findById<Level2>(children, id);

  Level2 findLevel2ByName(String name) => findByName<Level2>(children, name);
}

class Level2 extends Entity<Level3> {
  const Level2(String id, String name, Type type, List<Level3> children)
      : super(id, name, type, children);

  Level3 findLevel3ById(String id) => findById<Level3>(children, id);

  Level3 findLevel3ByName(String name) => findByName<Level3>(children, name);
}

class Level3 extends Entity<void> {
  const Level3(String id, String name, Type type) : super(id, name, type);
}

enum Type {
  huyen,
  quan,
  phuong,
  thi_tran,
  thi_xa,
  tinh,
  tp,
  tptw,
  xa,
}
