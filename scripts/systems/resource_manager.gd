class_name ResourceManager
extends Node

signal resource_changed(type: ResourceType.Type, old_val: int, new_val: int)
signal resource_critical(type: ResourceType.Type, val: int)
signal resource_depleted(type: ResourceType.Type)

@export var max_power: int = 100
@export var max_oxygen: int = 100
@export var max_sonar: int = 100
@export var max_repair: int = 5

var _resources: Dictionary = {}
var _threshold_critical: float = 0.25
var _threshold_depleted: float = 0.0

func _ready() -> void:
	_resources[ResourceType.Type.POWER] = max_power
	_resources[ResourceType.Type.OXYGEN] = max_oxygen
	_resources[ResourceType.Type.SONAR] = max_sonar
	_resources[ResourceType.Type.REPAIR] = max_repair

func get_value(type: ResourceType.Type) -> int:
	return _resources.get(type, 0)

func get_max(type: ResourceType.Type) -> int:
	match type:
		ResourceType.Type.POWER: return max_power
		ResourceType.Type.OXYGEN: return max_oxygen
		ResourceType.Type.SONAR: return max_sonar
		ResourceType.Type.REPAIR: return max_repair
		_: return 0

func get_ratio(type: ResourceType.Type) -> float:
	var mx := get_max(type)
	if mx <= 0:
		return 0.0
	return float(get_value(type)) / float(mx)

func set_value(type: ResourceType.Type, val: int) -> void:
	var mx := get_max(type)
	var clamped := clampi(val, 0, mx)
	var old := get_value(type)
	if old == clamped:
		return
	_resources[type] = clamped
	resource_changed.emit(type, old, clamped)
	if clamped <= int(mx * _threshold_depleted) and old > int(mx * _threshold_depleted):
		resource_depleted.emit(type)
	elif clamped <= int(mx * _threshold_critical) and old > int(mx * _threshold_critical):
		resource_critical.emit(type, clamped)

func modify(type: ResourceType.Type, delta: int) -> void:
	set_value(type, get_value(type) + delta)

func allocate(from_type: ResourceType.Type, to_type: ResourceType.Type, amount: int) -> bool:
	if from_type == to_type:
		return false
	if get_value(from_type) < amount:
		return false
	modify(from_type, -amount)
	modify(to_type, amount)
	return true

func is_critical(type: ResourceType.Type) -> bool:
	return get_ratio(type) <= _threshold_critical

func is_depleted(type: ResourceType.Type) -> bool:
	return get_value(type) <= 0

func get_all_states() -> Dictionary:
	var result := {}
	for t: ResourceType.Type in ResourceType.all_types():
		result[t] = {
			"value": get_value(t),
			"max": get_max(t),
			"ratio": get_ratio(t),
			"critical": is_critical(t),
			"depleted": is_depleted(t),
		}
	return result

func apply_nightly_drain(power_drain: int, oxygen_drain: int, sonar_drain: int) -> void:
	modify(ResourceType.Type.POWER, -power_drain)
	modify(ResourceType.Type.OXYGEN, -oxygen_drain)
	modify(ResourceType.Type.SONAR, -sonar_drain)

func reset() -> void:
	_resources[ResourceType.Type.POWER] = max_power
	_resources[ResourceType.Type.OXYGEN] = max_oxygen
	_resources[ResourceType.Type.SONAR] = max_sonar
	_resources[ResourceType.Type.REPAIR] = max_repair

func serialize() -> Dictionary:
	var data := {}
	for t: ResourceType.Type in ResourceType.all_types():
		data[str(t)] = get_value(t)
	return data

func deserialize(data: Dictionary) -> void:
	for t: ResourceType.Type in ResourceType.all_types():
		var key := str(t)
		if data.has(key):
			set_value(t, int(data[key]))
