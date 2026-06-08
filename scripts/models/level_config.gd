class_name LevelConfig
extends RefCounted

var level_id: int = 1
var level_name: String = ""
var description: String = ""
var duration: float = 120.0
var robot_count: int = 3
var resources: Dictionary = {}
var events: Array[Dictionary] = []
var tutorial_steps: Array[Dictionary] = []
var unlocked_resources: Array[StringName] = []
var event_interval: float = 15.0

func _init(data: Dictionary = {}) -> void:
	if data.is_empty():
		return
	level_id = data.get("level_id", 1)
	level_name = data.get("level_name", "")
	description = data.get("description", "")
	duration = data.get("duration", 120.0)
	robot_count = data.get("robot_count", 3)
	resources = data.get("resources", {})
	events = data.get("events", [])
	tutorial_steps = data.get("tutorial_steps", [])
	unlocked_resources = data.get("unlocked_resources", [])
	event_interval = data.get("event_interval", 15.0)
