extends Node

const SAVE_DIR := "user://saves/"
const AUTO_SAVE_PATH := SAVE_DIR + "autosave.json"
const SETTINGS_PATH := "user://settings.json"
const PROFILE_PATH := "user://profile.json"

var current_save: Dictionary = {}
var profile: Dictionary = {}
var settings: Dictionary = {}

func _ready() -> void:
	_ensure_save_dir()
	_load_profile()
	_load_settings()

func _ensure_save_dir() -> void:
	if not DirAccess.dir_exists_absolute(SAVE_DIR):
		var err: int = DirAccess.make_dir_absolute(SAVE_DIR)
		if err != OK:
			push_warning("Failed to create save directory: %s" % SAVE_DIR)

func _load_profile() -> void:
	if FileAccess.file_exists(PROFILE_PATH):
		var f: FileAccess = FileAccess.open(PROFILE_PATH, FileAccess.READ)
		if f:
			var content: String = f.get_as_text()
			f.close()
			var parsed: Variant = JSON.parse_string(content)
			if parsed is Dictionary:
				profile = parsed
				return
	profile = _get_default_profile()
	_save_profile()

func _save_profile() -> void:
	var f: FileAccess = FileAccess.open(PROFILE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(profile, "\t"))
		f.close()

func _get_default_profile() -> Dictionary:
	return {
		"player_name": "档案员",
		"total_play_time": 0.0,
		"completed_levels": {},
		"achievements": [],
		"created_at": Time.get_unix_time_from_system(),
		"last_played": Time.get_unix_time_from_system()
	}

func _load_settings() -> void:
	if FileAccess.file_exists(SETTINGS_PATH):
		var f: FileAccess = FileAccess.open(SETTINGS_PATH, FileAccess.READ)
		if f:
			var content: String = f.get_as_text()
			f.close()
			var parsed: Variant = JSON.parse_string(content)
			if parsed is Dictionary:
				settings = parsed
				return
	settings = _get_default_settings()
	_save_settings()

func _save_settings() -> void:
	var f: FileAccess = FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(settings, "\t"))
		f.close()

func _get_default_settings() -> Dictionary:
	return {
		"video": {
			"vsync": true,
			"frame_rate_limit": 60,
			"fullscreen": false,
			"resolution": [1280, 720]
		},
		"audio": {
			"master_volume": 0.0,
			"music_volume": -5.0,
			"sfx_volume": -3.0,
			"ui_volume": -2.0
		},
		"input": {
			"key_mappings": {}
		},
		"gameplay": {
			"animation_speed": 1.0,
			"auto_save": true,
			"show_performance_stats": false,
			"confirm_on_submit": true,
			"hint_enabled": true
		}
	}

func apply_settings_to_engine() -> void:
	if settings.has("video"):
		var v: Dictionary = settings.video
		if v.has("vsync"):
			DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if v.vsync else DisplayServer.VSYNC_DISABLED)
		if v.has("frame_rate_limit"):
			Engine.max_fps = int(v.frame_rate_limit)
		if v.has("fullscreen"):
			var mode: int = DisplayServer.WINDOW_MODE_FULLSCREEN if v.fullscreen else DisplayServer.WINDOW_MODE_WINDOWED
			DisplayServer.window_set_mode(mode)
		if v.has("resolution") and v.resolution.size() >= 2:
			DisplayServer.window_set_size(Vector2i(int(v.resolution[0]), int(v.resolution[1])))

func save_game(level_id: String, game_state: Dictionary, slot_name: String = "") -> String:
	var timestamp: int = Time.get_unix_time_from_system()
	var save_id: String = slot_name if not slot_name.is_empty() else "save_%d" % timestamp
	var save_data: Dictionary = {
		"save_id": save_id,
		"level_id": level_id,
		"timestamp": timestamp,
		"game_state": game_state,
		"play_time": game_state.get("play_time", 0.0)
	}
	var path: String = SAVE_DIR + save_id + ".json"
	var f: FileAccess = FileAccess.open(path, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(save_data, "\t"))
		f.close()
		return save_id
	return ""

func load_game(save_id: String) -> Dictionary:
	var path: String = SAVE_DIR + save_id + ".json"
	if not FileAccess.file_exists(path):
		return {}
	var f: FileAccess = FileAccess.open(path, FileAccess.READ)
	if f:
		var content: String = f.get_as_text()
		f.close()
		var parsed: Variant = JSON.parse_string(content)
		if parsed is Dictionary:
			return parsed
	return {}

func auto_save(level_id: String, game_state: Dictionary) -> void:
	if not settings.get("gameplay", {}).get("auto_save", true):
		return
	var save_data: Dictionary = {
		"save_id": "autosave",
		"level_id": level_id,
		"timestamp": Time.get_unix_time_from_system(),
		"game_state": game_state,
		"play_time": game_state.get("play_time", 0.0)
	}
	var f: FileAccess = FileAccess.open(AUTO_SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(save_data, "\t"))
		f.close()

func load_auto_save() -> Dictionary:
	if not FileAccess.file_exists(AUTO_SAVE_PATH):
		return {}
	var f: FileAccess = FileAccess.open(AUTO_SAVE_PATH, FileAccess.READ)
	if f:
		var content: String = f.get_as_text()
		f.close()
		var parsed: Variant = JSON.parse_string(content)
		if parsed is Dictionary:
			return parsed
	return {}

func has_auto_save() -> bool:
	return FileAccess.file_exists(AUTO_SAVE_PATH)

func delete_save(save_id: String) -> bool:
	var path: String = SAVE_DIR + save_id + ".json"
	if save_id == "autosave":
		path = AUTO_SAVE_PATH
	if FileAccess.file_exists(path):
		var err: int = DirAccess.remove_absolute(path)
		return err == OK
	return false

func list_saves() -> Array:
	var saves: Array = []
	if not DirAccess.dir_exists_absolute(SAVE_DIR):
		return saves
	var dir: DirAccess = DirAccess.open(SAVE_DIR)
	if dir:
		dir.list_dir_begin()
		var fname: String = dir.get_next()
		while fname != "":
			if fname.ends_with(".json") and fname != "autosave.json":
				var path: String = SAVE_DIR + fname
				var f: FileAccess = FileAccess.open(path, FileAccess.READ)
				if f:
					var content: String = f.get_as_text()
					f.close()
					var parsed: Variant = JSON.parse_string(content)
					if parsed is Dictionary:
						saves.append(parsed)
			fname = dir.get_next()
		dir.list_dir_end()
	saves.sort_custom(func(a, b): return a.timestamp > b.timestamp)
	return saves

func complete_level(level_id: String, result: Dictionary) -> void:
	if not profile.has("completed_levels"):
		profile["completed_levels"] = {}
	var level_data: Dictionary = {
		"completed_at": Time.get_unix_time_from_system(),
		"best_score": result.get("final_score", 0),
		"best_grade": result.get("grade", "D"),
		"attempts": 1,
		"hints_used": result.get("hints_used", 0),
		"play_time": result.get("play_time", 0.0),
		"perfect": result.get("perfect", false)
	}
	if profile.completed_levels.has(level_id):
		var existing: Dictionary = profile.completed_levels[level_id]
		level_data.attempts = int(existing.get("attempts", 0)) + 1
		if result.get("final_score", 0) > int(existing.get("best_score", 0)):
			level_data.best_score = result.get("final_score", 0)
			level_data.best_grade = result.get("grade", "D")
	profile.completed_levels[level_id] = level_data
	profile.last_played = Time.get_unix_time_from_system()
	_save_profile()

func get_level_progress(level_id: String) -> Dictionary:
	if profile.completed_levels.has(level_id):
		return profile.completed_levels[level_id].duplicate(true)
	return {}

func get_setting(key: String, default_value: Variant = null) -> Variant:
	var keys: Array = key.split(".")
	var current: Variant = settings
	for k: String in keys:
		if current is Dictionary and current.has(k):
			current = current[k]
		else:
			return default_value
	return current

func set_setting(key: String, value: Variant) -> void:
	var keys: Array = key.split(".")
	var current: Dictionary = settings
	for i: int in range(keys.size() - 1):
		var k: String = keys[i]
		if not current.has(k) or not current[k] is Dictionary:
			current[k] = {}
		current = current[k]
	current[keys[keys.size() - 1]] = value
	_save_settings()

func update_play_time(delta: float) -> void:
	profile.total_play_time = float(profile.get("total_play_time", 0.0)) + delta
	_save_profile()

func get_default_settings() -> Dictionary:
	return _get_default_settings().duplicate(true)
