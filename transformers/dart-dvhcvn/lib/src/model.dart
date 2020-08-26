import 'data.dart';
import 'internal.dart';

abstract class Entity<ParentType, ChildType> {
  final List<ChildType> children;
  final String id;
  final String name;
  final Type type;

  ParentType get parent;

  const Entity(this.id, this.name, this.type, [this.children]);
}

class Level1 extends Entity<void, Level2> {
  const Level1(String id, String name, Type type, List<Level2> children)
      : super(id, name, type, children);

  void get parent => null;

  Level2 findLevel2ById(String id) => findById<Level2>(children, id);

  Level2 findLevel2ByName(String name) => findByName<Level2>(children, name);
}

class Level2 extends Entity<Level1, Level3> {
  final int _level1Index;

  const Level2(this._level1Index, String id, String name, Type type,
      List<Level3> children)
      : super(id, name, type, children);

  Level1 get parent => level1s[_level1Index];

  Level3 findLevel3ById(String id) => findById<Level3>(children, id);

  Level3 findLevel3ByName(String name) => findByName<Level3>(children, name);
}

class Level3 extends Entity<Level2, void> {
  final int _level1Index;
  final int _level2Index;

  const Level3(
      this._level1Index, this._level2Index, String id, String name, Type type)
      : super(id, name, type);

  Level2 get parent => level1s[_level1Index].children[_level2Index];
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
