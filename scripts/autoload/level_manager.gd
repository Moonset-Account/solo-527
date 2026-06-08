extends Node

signal level_unlocked(level_id: String)
signal level_completed(level_id: String, stars: int)

var _levels_data: Array = []
var unlocked_levels: Dictionary = {}
var level_progress: Dictionary = {}

const SAVE_PATH: String = "user://save_data.json"
const LEVELS_PATH: String = "res://data/levels.json"


func _ready() -> void:
	_load_levels_data()
	_load_save_data()
	_ensure_first_level_unlocked()


func _ensure_first_level_unlocked() -> void:
	if _levels_data.is_empty():
		return
	var first_id = str(_levels_data[0].get("level_id", 1))
	if not unlocked_levels.has(first_id):
		unlocked_levels[first_id] = true


func get_level_data(level_id: String) -> Dictionary:
	for level in _levels_data:
		if str(level.get("level_id", "")) == level_id:
			return level
	return {}


func get_level_count() -> int:
	return _levels_data.size()


func get_all_levels() -> Array:
	return _levels_data


func unlock_level(level_id: String) -> void:
	if unlocked_levels.has(level_id):
		return
	unlocked_levels[level_id] = true
	level_unlocked.emit(level_id)
	_save_data()


func is_level_unlocked(level_id: String) -> bool:
	return unlocked_levels.get(level_id, false)


func complete_level(level_id: String, stars: int) -> void:
	var previous_stars: int = level_progress.get(level_id, 0)
	level_progress[level_id] = maxi(previous_stars, stars)
	if not unlocked_levels.has(level_id):
		unlocked_levels[level_id] = true
	level_completed.emit(level_id, stars)
	_save_data()


func _load_levels_data() -> void:
	if not FileAccess.file_exists(LEVELS_PATH):
		return
	var file := FileAccess.open(LEVELS_PATH, FileAccess.READ)
	if file == null:
		return
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	if err != OK:
		return
	var data = json.data
	if data is Dictionary:
		_levels_data = data.get("levels", [])
	elif data is Array:
		_levels_data = data


func _load_save_data() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	if err != OK:
		return
	var data = json.data
	if data is Dictionary:
		unlocked_levels = data.get("unlocked_levels", {})
		level_progress = data.get("level_progress", {})

func _save_data() -> void:
	var data := {
		"unlocked_levels": unlocked_levels,
		"level_progress": level_progress,
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify(data, "\t"))
