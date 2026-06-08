class_name SaveManager
extends Node

const SAVE_DIR := "user://saves/"
const SAVE_EXTENSION := ".sav"
const AUTO_SAVE_NAME := "autosave"

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)

func save_game(slot_name: String, game_data: Dictionary) -> bool:
	var path := SAVE_DIR + slot_name + SAVE_EXTENSION
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		push_error("Failed to open save file: " + path)
		return false
	var json_string := JSON.stringify(game_data, "\t")
	file.store_string(json_string)
	file.close()
	return true

func load_game(slot_name: String) -> Dictionary:
	var path := SAVE_DIR + slot_name + SAVE_EXTENSION
	if not FileAccess.file_exists(path):
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var json_string := file.get_as_text()
	file.close()
	var json := JSON.new()
	var err := json.parse(json_string)
	if err != OK:
		push_error("Save file parse error: " + json.get_error_message())
		return {}
	return json.data

func delete_save(slot_name: String) -> bool:
	var path := SAVE_DIR + slot_name + SAVE_EXTENSION
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)
		return true
	return false

func has_save(slot_name: String) -> bool:
	var path := SAVE_DIR + slot_name + SAVE_EXTENSION
	return FileAccess.file_exists(path)

func list_saves() -> Array[String]:
	var result: Array[String] = []
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return result
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if file_name.ends_with(SAVE_EXTENSION):
			result.append(file_name.replace(SAVE_EXTENSION, ""))
		file_name = dir.get_next()
	dir.list_dir_end()
	return result

func auto_save(game_data: Dictionary) -> bool:
	return save_game(AUTO_SAVE_NAME, game_data)

func load_auto_save() -> Dictionary:
	return load_game(AUTO_SAVE_NAME)

func build_save_data(
	night: int,
	resource_mgr: ResourceManager,
	equipment_sys: EquipmentWearSystem,
	repair_q: RepairQueue,
	event_sched: EventScheduler,
	night_history: Array[Dictionary],
	tutorial_done: bool,
	stats: Dictionary
) -> Dictionary:
	return {
		"version": 1,
		"night": night,
		"resources": resource_mgr.serialize(),
		"equipment": equipment_sys.serialize(),
		"repair_queue": repair_q.serialize(),
		"event_scheduler": event_sched.serialize(),
		"night_history": night_history,
		"tutorial_done": tutorial_done,
		"stats": stats,
		"timestamp": Time.get_datetime_string_from_system(),
	}
