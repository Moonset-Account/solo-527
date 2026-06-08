class_name SaveData
extends Resource

@export var version: int = 1
@export var current_level: int = 0
@export var money: int = 0
@export var reputation: int = 100
@export var total_earnings: int = 0
@export var machine_upgrades: Dictionary = {}
@export var completed_levels: Dictionary = {}
@export var achievements: PackedStringArray = []
@export var play_time_seconds: float = 0.0
@export var total_failures: int = 0
@export var key_choices: Array[Dictionary] = []
@export var last_save_timestamp: int = 0
@export var level_progress: Dictionary = {}

func to_dict() -> Dictionary:
	var machines: Dictionary = {}
	for key in machine_upgrades:
		machines[key] = machine_upgrades[key]
	var completed: Dictionary = {}
	for key in completed_levels:
		var val = completed_levels[key]
		if val is Dictionary:
			completed[key] = val.duplicate()
		else:
			completed[key] = val
	var choices: Array = []
	for choice in key_choices:
		if choice is Dictionary:
			choices.append(choice.duplicate())
	var progress: Dictionary = {}
	for key in level_progress:
		var val = level_progress[key]
		if val is Dictionary:
			progress[key] = val.duplicate()
		else:
			progress[key] = val
	return {
		"version": version,
		"current_level": current_level,
		"money": money,
		"reputation": reputation,
		"total_earnings": total_earnings,
		"machine_upgrades": machines,
		"completed_levels": completed,
		"achievements": achievements,
		"play_time_seconds": play_time_seconds,
		"total_failures": total_failures,
		"key_choices": choices,
		"last_save_timestamp": last_save_timestamp,
		"level_progress": progress,
	}

static func from_dict(data: Dictionary) -> SaveData:
	var save := SaveData.new()
	if data.has("version"):
		save.version = int(data["version"])
	if data.has("current_level"):
		save.current_level = int(data["current_level"])
	if data.has("money"):
		save.money = int(data["money"])
	if data.has("reputation"):
		save.reputation = int(data["reputation"])
	if data.has("total_earnings"):
		save.total_earnings = int(data["total_earnings"])
	if data.has("machine_upgrades") and data["machine_upgrades"] is Dictionary:
		save.machine_upgrades = data["machine_upgrades"].duplicate()
	if data.has("completed_levels") and data["completed_levels"] is Dictionary:
		save.completed_levels = data["completed_levels"].duplicate()
	if data.has("achievements"):
		var achievements: PackedStringArray = []
		var raw = data["achievements"]
		if raw is Array:
			for item in raw:
				achievements.append(str(item))
		save.achievements = achievements
	if data.has("play_time_seconds"):
		save.play_time_seconds = float(data["play_time_seconds"])
	if data.has("total_failures"):
		save.total_failures = int(data["total_failures"])
	if data.has("key_choices") and data["key_choices"] is Array:
		var choices: Array[Dictionary] = []
		for item in data["key_choices"]:
			if item is Dictionary:
				choices.append(item.duplicate())
		save.key_choices = choices
	if data.has("last_save_timestamp"):
		save.last_save_timestamp = int(data["last_save_timestamp"])
	if data.has("level_progress") and data["level_progress"] is Dictionary:
		save.level_progress = data["level_progress"].duplicate()
	return save

func record_key_choice(choice_type: String, details: Dictionary) -> void:
	var entry: Dictionary = {
		"type": choice_type,
		"details": details.duplicate(),
		"timestamp": int(Time.get_unix_time_from_system()),
	}
	key_choices.append(entry)

func get_offline_duration_seconds() -> float:
	if last_save_timestamp <= 0:
		return 0.0
	var now := int(Time.get_unix_time_from_system())
	var diff := now - last_save_timestamp
	if diff <= 0:
		return 0.0
	return float(diff)
