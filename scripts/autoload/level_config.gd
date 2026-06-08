extends Node

const LEVELS_DIR = "res://configs/levels/"
const USER_LEVELS_DIR = "user://levels/"
var _level_cache: Dictionary = {}

func _ready() -> void:
	_preload_levels()

func _preload_levels() -> void:
	_load_levels_from_dir(LEVELS_DIR)
	_load_levels_from_dir(USER_LEVELS_DIR)

func _load_levels_from_dir(dir_path: String) -> void:
	var dir = DirAccess.open(dir_path)
	if not dir:
		return
	dir.list_dir_begin()
	var file_name = dir.get_next()
	while file_name != "":
		if file_name.ends_with(".json"):
			var level_id = file_name.replace(".json", "")
			if not _level_cache.has(level_id):
				var config = _load_level_file(dir_path + file_name)
				if not config.is_empty():
					_level_cache[level_id] = config
		file_name = dir.get_next()
	dir.list_dir_end()

func _load_level_file(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var file = FileAccess.open(path, FileAccess.READ)
	if not file:
		return {}
	var json = JSON.new()
	var err = json.parse(file.get_as_text())
	file.close()
	if err != OK:
		return {}
	return json.data

func load_level(level_id: String) -> Dictionary:
	if _level_cache.has(level_id):
		return _level_cache[level_id]
	var config = _load_level_file(LEVELS_DIR + level_id + ".json")
	if config.is_empty():
		config = _load_level_file(USER_LEVELS_DIR + level_id + ".json")
	if not config.is_empty():
		_level_cache[level_id] = config
	return config

func get_all_level_ids() -> PackedStringArray:
	var ids: PackedStringArray = []
	for key in _level_cache:
		ids.append(key)
	ids.sort()
	return ids

func get_level_count() -> int:
	return _level_cache.size()

func get_chapter_levels(chapter: String) -> PackedStringArray:
	var ids: PackedStringArray = []
	for key in _level_cache:
		var config = _level_cache[key]
		if config.get("chapter", "") == chapter:
			ids.append(key)
	ids.sort()
	return ids

func get_item_template(template_name: String) -> Dictionary:
	for level_data in _level_cache.values():
		for item in level_data.get("items", []):
			if item.get("template", "") == template_name:
				return item
	return {}

func create_item_data(template_name: String, overrides: Dictionary = {}) -> Dictionary:
	var base = get_item_template(template_name)
	if base.is_empty():
		base = {
			"template": template_name,
			"shape": "rect",
			"width": 40,
			"height": 40,
			"weight": 1.0,
			"is_fragile": false,
			"fragility": 1.0,
			"color": "#4488CC",
			"label": template_name
		}
	for key in overrides:
		base[key] = overrides[key]
	return base
