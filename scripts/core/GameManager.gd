extends Node

signal scene_changed(scene_name: String)
signal level_completed(level_id: int, score: int, data: Dictionary)
signal level_failed(level_id: int, reason: Dictionary, replay_data: Dictionary)

var current_level_id: int = 0
var current_scene: String = "MainMenu"
var player_gold: int = 500
var unlocked_levels: Array[int] = [1]
var unlocked_tools: Array[String] = []
var repair_codex: Array[Dictionary] = []

func _ready() -> void:
	load_progress()

func change_scene(scene_name: String) -> void:
	current_scene = scene_name
	emit_signal("scene_changed", scene_name)
	match scene_name:
		"MainMenu":
			get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")
		"LevelSelect":
			get_tree().change_scene_to_file("res://scenes/LevelSelect.tscn")
		"Repair":
			get_tree().change_scene_to_file("res://scenes/RepairScene.tscn")
		"Settlement":
			get_tree().change_scene_to_file("res://scenes/Settlement.tscn")
		"FailReplay":
			get_tree().change_scene_to_file("res://scenes/FailReplay.tscn")
		"Codex":
			get_tree().change_scene_to_file("res://scenes/Codex.tscn")
		_:
			push_warning("Unknown scene: %s" % scene_name)

func start_level(level_id: int) -> void:
	current_level_id = level_id
	var tools = get_unlocked_tools_for_level(level_id)
	unlocked_tools = tools
	change_scene("Repair")

func complete_level(level_id: int, score: int, data: Dictionary) -> void:
	player_gold += int(data.get("reward", 0))
	var next_level: int = level_id + 1
	if not unlocked_levels.has(next_level):
		unlocked_levels.append(next_level)
	_save_to_codex(level_id, data)
	SaveManager.save_game(self)
	emit_signal("level_completed", level_id, score, data)

func fail_level(level_id: int, reason: Dictionary, replay_data: Dictionary) -> void:
	SaveManager.save_fail_record(level_id, reason, replay_data)
	emit_signal("level_failed", level_id, reason, replay_data)

func get_unlocked_tools_for_level(level_id: int) -> Array[String]:
	var level_data: Dictionary = LevelLoader.get_level(level_id)
	if level_data.is_empty():
		return []
	return level_data.get("unlocked_tools", [])

func load_progress() -> void:
	var save_data: Dictionary = SaveManager.load_game()
	if save_data.is_empty():
		return
	player_gold = save_data.get("player_gold", 500)
	unlocked_levels = save_data.get("unlocked_levels", [1])
	repair_codex = save_data.get("repair_codex", [])

func _save_to_codex(level_id: int, data: Dictionary) -> void:
	var record: Dictionary = {
		"level_id": level_id,
		"timestamp": Time.get_unix_time_from_system(),
		"score": data.get("score", 0),
		"materials_used": data.get("materials_used", {}),
		"time_taken": data.get("time_taken", 0),
		"strength_result": data.get("strength_result", 0),
		"damage_repaired": data.get("damage_repaired", 0),
		"zones_detail": data.get("zones_detail", [])
	}
	repair_codex.append(record)

func get_codex_records_for_level(level_id: int) -> Array[Dictionary]:
	var records: Array[Dictionary] = []
	for rec in repair_codex:
		if rec.get("level_id") == level_id:
			records.append(rec)
	return records
