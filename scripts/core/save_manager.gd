extends Node

const SAVE_PATH: String = "user://save_data.json"
const SEGMENT_PATH: String = "user://segment_data.json"

func save_game(data: Dictionary) -> void:
	var save_data: Dictionary = data.duplicate()
	save_data["saved_at"] = Time.get_datetime_string_from_system()
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data, "\t"))
		file.close()

func load_game() -> Dictionary:
	if not has_save():
		return {}
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return {}
	var json: JSON = JSON.new()
	var err: Error = json.parse(file.get_as_text())
	file.close()
	if err != OK or not json.data is Dictionary:
		return {}
	return json.data

func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

func delete_save() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)
	if FileAccess.file_exists(SEGMENT_PATH):
		DirAccess.remove_absolute(SEGMENT_PATH)

func save_segment_state(segment_data: Dictionary = {}) -> void:
	if segment_data.is_empty():
		segment_data = {
			"current_level": LevelManager.current_level_id,
			"current_segment": LevelManager.current_segment_index,
			"saved_at": Time.get_datetime_string_from_system()
		}
	var file: FileAccess = FileAccess.open(SEGMENT_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(segment_data, "\t"))
		file.close()
	save_game(_merge_save_with_segment(segment_data))

func load_segment_state() -> Dictionary:
	if not FileAccess.file_exists(SEGMENT_PATH):
		return {}
	var file: FileAccess = FileAccess.open(SEGMENT_PATH, FileAccess.READ)
	if not file:
		return {}
	var json: JSON = JSON.new()
	var err: Error = json.parse(file.get_as_text())
	file.close()
	if err != OK or not json.data is Dictionary:
		return {}
	return json.data

func _merge_save_with_segment(segment_data: Dictionary) -> Dictionary:
	var existing: Dictionary = load_game()
	existing.merge(segment_data, true)
	return existing
