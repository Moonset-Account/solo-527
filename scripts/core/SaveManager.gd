extends Node

const SAVE_PATH: String = "user://savegame.json"
const FAIL_RECORDS_PATH: String = "user://fail_records.json"

static func save_game(game_manager: Node) -> void:
	var save_data: Dictionary = {
		"player_gold": game_manager.player_gold,
		"unlocked_levels": game_manager.unlocked_levels,
		"repair_codex": game_manager.repair_codex,
		"saved_at": Time.get_unix_time_from_system()
	}
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Cannot open save file for writing")
		return
	file.store_string(JSON.stringify(save_data))
	file.close()

static func load_game() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		push_error("Cannot open save file for reading")
		return {}
	var json_str: String = file.get_as_text()
	file.close()
	var parse_result = JSON.parse_string(json_str)
	if parse_result == null:
		push_error("Failed to parse save data")
		return {}
	return parse_result

static func save_fail_record(level_id: int, reason: Dictionary, replay_data: Dictionary) -> void:
	var records: Array[Dictionary] = load_fail_records()
	var record: Dictionary = {
		"level_id": level_id,
		"timestamp": Time.get_unix_time_from_system(),
		"reason": reason,
		"replay_data": replay_data
	}
	records.append(record)
	var file: FileAccess = FileAccess.open(FAIL_RECORDS_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Cannot open fail records for writing")
		return
	file.store_string(JSON.stringify(records))
	file.close()

static func load_fail_records() -> Array[Dictionary]:
	if not FileAccess.file_exists(FAIL_RECORDS_PATH):
		return []
	var file: FileAccess = FileAccess.open(FAIL_RECORDS_PATH, FileAccess.READ)
	if file == null:
		push_error("Cannot open fail records for reading")
		return []
	var json_str: String = file.get_as_text()
	file.close()
	var parse_result = JSON.parse_string(json_str)
	if parse_result == null or typeof(parse_result) != TYPE_ARRAY:
		return []
	return parse_result

static func get_fail_records_for_level(level_id: int) -> Array[Dictionary]:
	var all_records: Array[Dictionary] = load_fail_records()
	var level_records: Array[Dictionary] = []
	for rec in all_records:
		if rec.get("level_id") == level_id:
			level_records.append(rec)
	return level_records

static func clear_all_saves() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)
	if FileAccess.file_exists(FAIL_RECORDS_PATH):
		DirAccess.remove_absolute(FAIL_RECORDS_PATH)
