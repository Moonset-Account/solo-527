class_name EquipmentSlot
extends RefCounted

var id: String = ""
var display_name: String = ""
var max_durability: int = 100
var current_durability: int = 100
var wear_per_night: int = 5
var critical_threshold: float = 0.3
var affects_system: ResourceType.Type = ResourceType.Type.POWER

func _init(p_id: String = "", p_name: String = "", p_system: ResourceType.Type = ResourceType.Type.POWER, p_wear: int = 5) -> void:
	id = p_id
	display_name = p_name
	affects_system = p_system
	wear_per_night = p_wear

func durability_ratio() -> float:
	if max_durability <= 0:
		return 0.0
	return float(current_durability) / float(max_durability)

func is_critical() -> bool:
	return durability_ratio() <= critical_threshold

func is_broken() -> bool:
	return current_durability <= 0

func apply_wear() -> void:
	current_durability = maxi(0, current_durability - wear_per_night)

func repair(amount: int) -> void:
	current_durability = mini(max_durability, current_durability + amount)

func full_repair() -> void:
	current_durability = max_durability

func serialize() -> Dictionary:
	return {
		"id": id,
		"current_durability": current_durability,
	}

func deserialize(data: Dictionary) -> void:
	if data.has("current_durability"):
		current_durability = int(data["current_durability"])
