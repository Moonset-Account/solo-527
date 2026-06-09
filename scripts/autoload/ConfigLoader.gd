extends Node

var characters: Dictionary = {}
var level_list: Dictionary = {}
var balance: Dictionary = {}
var _loaded_levels: Dictionary = {}

signal config_loaded()

func _ready():
	_load_all()

func _load_all():
	characters = _load_json("res://data/characters.json")
	level_list = _load_json("res://data/level_list.json")
	balance = _load_json("res://data/balance.json")
	emit_signal("config_loaded")

func _load_json(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file:
		var content: String = file.get_as_text()
		file.close()
		var parsed: Variant = JSON.parse_string(content)
		if typeof(parsed) == TYPE_DICTIONARY:
			return parsed
		push_warning("JSON parse failed: " + path)
		return {}
	else:
		push_error("Cannot open file: " + path)
		return {}

func get_character(char_id: String) -> Dictionary:
	for ch in characters.get("characters", []):
		if ch.get("id", "") == char_id:
			return ch
	return {}

func get_skill(char_id: String, skill_idx: int) -> Dictionary:
	var ch: Dictionary = get_character(char_id)
	var skills: Array = ch.get("skills", [])
	if skill_idx >= 0 and skill_idx < skills.size():
		return skills[skill_idx]
	return {}

func load_level_data(level_id: String) -> Dictionary:
	if _loaded_levels.has(level_id):
		return _loaded_levels[level_id]
	for lv in level_list.get("levels", []):
		if lv.get("level_id", "") == level_id:
			var data: Dictionary = _load_json(lv.get("file", ""))
			if data:
				_loaded_levels[level_id] = data
			return data
	return {}

func get_level_meta(level_id: String) -> Dictionary:
	for lv in level_list.get("levels", []):
		if lv.get("level_id", "") == level_id:
			return lv
	return {}

func is_level_unlocked(level_id: String, completed_levels: Array) -> bool:
	var meta: Dictionary = get_level_meta(level_id)
	if meta.get("unlocked_by_default", false):
		return true
	var unlock_cond: String = meta.get("unlock_condition", "")
	return unlock_cond != "" and unlock_cond in completed_levels

func get_balance(key: String, default_val: Variant = null) -> Variant:
	var parts: PackedStringArray = key.split(".")
	var cur: Variant = balance
	for p in parts:
		if typeof(cur) == TYPE_DICTIONARY and (cur as Dictionary).has(p):
			cur = (cur as Dictionary)[p]
		else:
			return default_val
	return cur
