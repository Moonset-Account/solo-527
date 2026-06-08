class_name Database
extends RefCounted

static var _characters: Dictionary = {}
static var _levels: Dictionary = {}
static var _level_order: Array[String] = []

static func load_characters() -> void:
	var paths: Array[String] = [
		"res://resources/characters/char_xiaoming.tres",
		"res://resources/characters/char_xiaohong.tres",
		"res://resources/characters/char_xiaoli.tres",
		"res://resources/characters/char_xiaozhang.tres",
		"res://resources/characters/char_xiaowang.tres",
	]
	for p in paths:
		if ResourceLoader.exists(p):
			var res: CharacterData = load(p)
			if res:
				_characters[res.id] = res

static func get_character(id: String) -> CharacterData:
	if _characters.is_empty():
		load_characters()
	return _characters.get(id, null) as CharacterData

static func load_levels() -> void:
	_level_order.clear()
	for i in range(5):
		var p: String = "res://resources/levels/level_%d.tres" % i
		if ResourceLoader.exists(p):
			var res: LevelData = load(p)
			if res:
				_levels[res.id] = res
				_level_order.append(res.id)

static func get_level(id: String) -> LevelData:
	if _levels.is_empty():
		load_levels()
	return _levels.get(id, null) as LevelData

static func get_level_by_index(idx: int) -> LevelData:
	if _levels.is_empty():
		load_levels()
	if idx >= 0 and idx < _level_order.size():
		return _levels[_level_order[idx]] as LevelData
	return null

static func get_level_count() -> int:
	if _levels.is_empty():
		load_levels()
	return _levels.size()
