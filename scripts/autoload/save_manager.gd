extends Node

const SAVE_DIR = "user://saves/"
const SETTINGS_FILE = "user://settings.json"
const SAVE_FILE = "user://save_data.json"

var _save_data: Dictionary = {}
var _settings: Dictionary = {}

signal save_completed(success: bool)
signal settings_changed(key: String, value)

func _ready() -> void:
	_ensure_save_dir()
	_load_settings()
	_load_save_data()

func _ensure_save_dir() -> void:
	if not DirAccess.dir_exists_absolute(SAVE_DIR):
		DirAccess.make_dir_recursive_absolute(SAVE_DIR)

func _load_settings() -> void:
	if FileAccess.file_exists(SETTINGS_FILE):
		var file = FileAccess.open(SETTINGS_FILE, FileAccess.READ)
		if file:
			var json = JSON.new()
			var err = json.parse(file.get_as_text())
			if err == OK:
				_settings = json.data
			file.close()
	if _settings.is_empty():
		_settings = _default_settings()

func _default_settings() -> Dictionary:
	return {
		"master_volume": 0.8,
		"sfx_volume": 1.0,
		"music_volume": 0.6,
		"fullscreen": false,
		"vsync": true,
		"target_fps": 60,
		"show_fps": false,
		"show_performance": false,
		"haptic_enabled": true,
		"input_method": "auto",
		"key_bindings": {
			"move_left": "4194319",
			"move_right": "4194321",
			"move_up": "4194320",
			"move_down": "4194322",
			"rotate_cw": "82",
			"rotate_ccw": "69",
			"confirm": "4194309",
			"undo": "ctrl+90",
			"pause": "4194305"
		}
	}

func _load_save_data() -> void:
	if FileAccess.file_exists(SAVE_FILE):
		var file = FileAccess.open(SAVE_FILE, FileAccess.READ)
		if file:
			var json = JSON.new()
			var err = json.parse(file.get_as_text())
			if err == OK:
				_save_data = json.data
			file.close()
	if _save_data.is_empty():
		_save_data = {
			"completed_levels": {},
			"total_stars": 0,
			"total_score": 0,
			"play_time": 0.0,
			"levels_attempted": 0,
			"items_broken_total": 0,
			"best_scores": {}
		}

func save_settings() -> void:
	var file = FileAccess.open(SETTINGS_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_settings, "\t"))
		file.close()

func get_setting(key: String, default = null) -> Variant:
	return _settings.get(key, default)

func set_setting(key: String, value) -> void:
	_settings[key] = value
	settings_changed.emit(key, value)
	save_settings()
	match key:
		"master_volume":
			AudioServer.set_bus_volume_db(0, linear_to_db(float(value)))
		"fullscreen":
			if value:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
			else:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		"vsync":
			DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if value else DisplayServer.VSYNC_DISABLED)
		"target_fps":
			Engine.max_fps = int(value)
		"show_fps", "show_performance":
			PerfMonitor.stats_visible = value

func save_level_result(level_id: String, result: Dictionary) -> void:
	if not _save_data.has("completed_levels"):
		_save_data["completed_levels"] = {}
	var prev = _save_data["completed_levels"].get(level_id, {})
	var prev_stars = prev.get("stars", 0)
	if result.get("stars", 0) >= prev_stars:
		_save_data["completed_levels"][level_id] = result
		_save_data["best_scores"][level_id] = result.get("total_score", 0)
	_save_data["total_stars"] = _count_total_stars()
	_save_data["total_score"] = _count_total_score()
	_save_data["levels_attempted"] = _save_data.get("levels_attempted", 0) + 1
	_save_data["items_broken_total"] = _save_data.get("items_broken_total", 0) + result.get("fragile_broken", 0)
	_write_save_data()
	save_completed.emit(true)

func _write_save_data() -> void:
	var file = FileAccess.open(SAVE_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_save_data, "\t"))
		file.close()

func _count_total_stars() -> int:
	var total = 0
	for level_data in _save_data.get("completed_levels", {}).values():
		total += level_data.get("stars", 0)
	return total

func _count_total_score() -> int:
	var total = 0
	for score in _save_data.get("best_scores", {}).values():
		total += int(score)
	return total

func get_level_result(level_id: String) -> Dictionary:
	return _save_data.get("completed_levels", {}).get(level_id, {})

func get_total_stars() -> int:
	return _save_data.get("total_stars", 0)

func get_total_score() -> int:
	return _save_data.get("total_score", 0)

func get_stats() -> Dictionary:
	return {
		"total_stars": _save_data.get("total_stars", 0),
		"total_score": _save_data.get("total_score", 0),
		"levels_attempted": _save_data.get("levels_attempted", 0),
		"items_broken_total": _save_data.get("items_broken_total", 0),
		"play_time": _save_data.get("play_time", 0.0),
		"completed_count": _save_data.get("completed_levels", {}).size()
	}

func update_play_time(delta: float) -> void:
	_save_data["play_time"] = _save_data.get("play_time", 0.0) + delta

func serialize_game_state() -> Dictionary:
	var tree = get_tree()
	var all_items: Array[Dictionary] = []
	if tree:
		for node in tree.get_nodes_in_group("items"):
			if is_instance_valid(node) and node.has_method("serialize"):
				all_items.append(node.serialize())
	var state = {
		"level_id": GameManager.current_level_id,
		"score": GameManager.current_score,
		"time": GameManager.level_time,
		"fragile_broken_count": GameManager.fragile_broken_count,
		"undo_stack": GameManager.undo_stack,
		"all_items": all_items
	}
	return state

func save_game_slot(slot: int) -> bool:
	var state = serialize_game_state()
	var file_path = SAVE_DIR + "slot_%d.json" % slot
	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(state, "\t"))
		file.close()
		return true
	return false

func load_game_slot(slot: int) -> Dictionary:
	var file_path = SAVE_DIR + "slot_%d.json" % slot
	if not FileAccess.file_exists(file_path):
		return {}
	var file = FileAccess.open(file_path, FileAccess.READ)
	if file:
		var json = JSON.new()
		var err = json.parse(file.get_as_text())
		file.close()
		if err == OK:
			return json.data
	return {}

func has_save_slot(slot: int) -> bool:
	return FileAccess.file_exists(SAVE_DIR + "slot_%d.json" % slot)

func delete_save_slot(slot: int) -> void:
	var file_path = SAVE_DIR + "slot_%d.json" % slot
	if FileAccess.file_exists(file_path):
		DirAccess.remove_absolute(file_path)

func get_key_binding(action: String) -> String:
	var bindings = _settings.get("key_bindings", {})
	return bindings.get(action, "")

func set_key_binding(action: String, keycode: String) -> void:
	if not _settings.has("key_bindings"):
		_settings["key_bindings"] = {}
	_settings["key_bindings"][action] = keycode
	save_settings()
	InputManager.remap_action(action, keycode)
