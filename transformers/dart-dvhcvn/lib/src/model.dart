import 'data.dart';
import 'internal.dart';

/// An entity.
abstract class Entity<ParentType, ChildType> {
  /// Sub-entities.
  final List<ChildType> children;

  /// The entity ID.
  final String id;

  /// The entity name.
  final String name;

  /// The entity type.
  final Type type;

  /// The entity parent.
  ParentType get parent;

  /// Creates an entity.
  const Entity(this.id, this.name, this.type, [this.children]);

  /// Returns type as Vietnamese string.
  // ignore: missing_return
  String get typeAsString {
    switch (type) {
      case Type.huyen:
        return 'Huyện';
      case Type.quan:
        return 'Quận';
      case Type.phuong:
        return 'Phường';
      case Type.thi_tran:
        return 'Thị trấn';
      case Type.thi_xa:
        return 'Thị xã';
      case Type.tinh:
        return 'Tỉnh';
      case Type.tp:
        return 'Thành phố';
      case Type.tptw:
        return 'Thành phố trực thuộc Trung ương';
      case Type.xa:
        return 'Xã';
    }
  }

  @override
  String toString() {
    final parent = this.parent?.toString();
    return parent != null ? '$parent > $name' : name;
  }
}

/// A level 1 entity.
class Level1 extends Entity<void, Level2> {
  /// Creates a level 1 entity.
  const Level1(String id, String name, Type type, List<Level2> children)
      : super(id, name, type, children);

  void get parent => null;

  /// Finds sub-entity by ID.
  Level2 findLevel2ById(String id) => findById<Level2>(children, id);

  /// Finds sub-entity by name.
  Level2 findLevel2ByName(String name) => findByName<Level2>(children, name);
}

/// A level 2 entity.
class Level2 extends Entity<Level1, Level3> {
  final int _level1Index;

  /// Creates a level 2 entity.
  const Level2(this._level1Index, String id, String name, Type type,
      List<Level3> children)
      : super(id, name, type, children);

  @override
  Level1 get parent => level1s[_level1Index];

  /// Finds sub-entity by ID.
  Level3 findLevel3ById(String id) => findById<Level3>(children, id);

  /// Finds sub-entity by name.
  Level3 findLevel3ByName(String name) => findByName<Level3>(children, name);
}

/// A level 3 entity.
class Level3 extends Entity<Level2, void> {
  final int _level1Index;
  final int _level2Index;

  /// Creates a level 3 entity.
  const Level3(
      this._level1Index, this._level2Index, String id, String name, Type type)
      : super(id, name, type);

  @override
  Level2 get parent => level1s[_level1Index].children[_level2Index];
}

/// Entity types.
enum Type {
  /// Huyện
  huyen,

  /// Quận
  quan,

  /// Phường
  phuong,

  /// Thị trấn
  thi_tran,

  /// Thị xã
  thi_xa,

  /// Tỉnh
  tinh,

  /// Thành phố
  tp,

  /// Thành phố trực thuộc Trung ương
  tptw,

  /// Xã
  xa,
}
