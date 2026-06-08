extends Node

signal save_completed(success: bool)
signal save_loaded(data: Dictionary)

const SAVE_DIR = "user://saves/"
const SAVE_FILE = "save_slot_1.tres"
const SETTINGS_FILE = "settings.json"

var _current_save: Dictionary = {}

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)

func save_game(slot: int = 1) -> bool:
	var save_data := _collect_save_data()
	var file_path: String = SAVE_DIR + "save_slot_%d.json" % slot
	var json := JSON.new()
	var json_string: String = json.stringify(save_data, "\t")
	var file := FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		push_error("SaveSystem: Failed to open save file: " + file_path)
		save_completed.emit(false)
		return false
	file.store_string(json_string)
	file.close()
	_current_save = save_data
	save_completed.emit(true)
	return true

func load_game(slot: int = 1) -> Dictionary:
	var file_path: String = SAVE_DIR + "save_slot_%d.json" % slot
	if not FileAccess.file_exists(file_path):
		push_warning("SaveSystem: No save file found: " + file_path)
		return {}
	var file := FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		push_error("SaveSystem: Failed to open save file: " + file_path)
		return {}
	var json_string: String = file.get_as_text()
	file.close()
	var json := JSON.new()
	var error: Error = json.parse(json_string)
	if error != OK:
		push_error("SaveSystem: Failed to parse save file")
		return {}
	_current_save = json.data
	save_loaded.emit(_current_save)
	return _current_save

func has_save(slot: int = 1) -> bool:
	var file_path: String = SAVE_DIR + "save_slot_%d.json" % slot
	return FileAccess.file_exists(file_path)

func delete_save(slot: int = 1) -> bool:
	var file_path: String = SAVE_DIR + "save_slot_%d.json" % slot
	return DirAccess.remove_absolute(file_path) == OK

func save_settings(settings: Dictionary) -> bool:
	var json := JSON.new()
	var json_string: String = json.stringify(settings, "\t")
	var file := FileAccess.open(SAVE_DIR + SETTINGS_FILE, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(json_string)
	file.close()
	return true

func load_settings() -> Dictionary:
	var file_path: String = SAVE_DIR + SETTINGS_FILE
	if not FileAccess.file_exists(file_path):
		return _default_settings()
	var file := FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return _default_settings()
	var json_string: String = file.get_as_text()
	file.close()
	var json := JSON.new()
	if json.parse(json_string) != OK:
		return _default_settings()
	return json.data

func _default_settings() -> Dictionary:
	return {
		"vsync": true,
		"target_fps": 60,
		"music_volume": 0.8,
		"sfx_volume": 1.0,
		"tutorial_completed": false,
		"tips_enabled": true,
		"input_mappings": {}
	}

func _collect_save_data() -> Dictionary:
	var data := {
		"version": "1.0",
		"timestamp": Time.get_datetime_string_from_system(),
		"game_state": {},
		"analytics": {}
	}
	if GameManager != null:
		data.game_state = GameManager.get_save_data()
	if Analytics != null:
		data.analytics = Analytics.get_save_data()
	return data

func apply_loaded_data(data: Dictionary) -> void:
	if data.is_empty():
		return
	if data.has("game_state") and GameManager != null:
		GameManager.apply_save_data(data.game_state)
	if data.has("analytics") and Analytics != null:
		Analytics.apply_save_data(data.analytics)
