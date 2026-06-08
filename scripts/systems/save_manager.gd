class_name SaveManager
extends RefCounted

const SAVE_PATH: String = "user://lunar_greenhouse_save.json"

static func save_game(data: Dictionary) -> bool:
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	var json_string = JSON.stringify(data, "\t")
	file.store_string(json_string)
	file.close()
	return true

static func load_game() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return {}
	var json_string = file.get_as_text()
	file.close()
	var json = JSON.new()
	var error = json.parse(json_string)
	if error != OK:
		return {}
	var data = json.data
	if data is Dictionary:
		return data
	return {}

static func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

static func delete_save() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)

static func save_level_progress(level_id: int, completed: bool) -> void:
	var data = load_game()
	if not data.has("level_progress"):
		data["level_progress"] = {}
	data["level_progress"][str(level_id)] = {
		"completed": completed,
		"timestamp": Time.get_datetime_string_from_system(),
	}
	save_game(data)

static func get_level_progress() -> Dictionary:
	var data = load_game()
	return data.get("level_progress", {})

static func save_game_state(state: Dictionary) -> bool:
	var data = load_game()
	data["game_state"] = state
	return save_game(data)

static func load_game_state() -> Dictionary:
	var data = load_game()
	return data.get("game_state", {})
