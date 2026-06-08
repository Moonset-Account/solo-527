class_name GameEvent
extends RefCounted

var id: String = ""
var event_name: String = ""
var description: String = ""
var target_resource: StringName = &""
var damage: float = 0.0
var damage_type: String = "leak"
var weight: float = 1.0
var cooldown: float = 30.0
var requires_unlock: String = ""
var priority_override: int = 0

func _init(data: Dictionary = {}) -> void:
	if data.is_empty():
		return
	id = data.get("id", "")
	event_name = data.get("name", "")
	description = data.get("description", "")
	target_resource = StringName(data.get("target_resource", ""))
	damage = data.get("damage", 10.0)
	damage_type = data.get("damage_type", "leak")
	weight = data.get("weight", 1.0)
	cooldown = data.get("cooldown", 30.0)
	requires_unlock = data.get("requires_unlock", "")
	priority_override = data.get("priority_override", 0)
