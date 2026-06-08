class_name StatsManager
extends Node

var _stats: Dictionary = {}

func _ready() -> void:
	_reset_stats()

func _reset_stats() -> void:
	_stats = {
		"nights_survived": 0,
		"total_nights": 0,
		"events_resolved": 0,
		"repairs_completed": 0,
		"equipment_broken": 0,
		"times_oxygen_critical": 0,
		"times_power_critical": 0,
		"times_sonar_critical": 0,
		"resources_allocated": {
			"0": 0,
			"1": 0,
			"2": 0,
			"3": 0,
		},
		"deaths_by_oxygen": 0,
		"deaths_by_power": 0,
		"deaths_by_repair": 0,
		"deaths_by_sonar": 0,
		"longest_survival": 0,
	}

func record_night_survived() -> void:
	_stats["nights_survived"] += 1
	_stats["total_nights"] += 1
	if _stats["nights_survived"] > _stats["longest_survival"]:
		_stats["longest_survival"] = _stats["nights_survived"]

func record_night_failed(failure_type: NightResult.FailureType) -> void:
	_stats["total_nights"] += 1
	match failure_type:
		NightResult.FailureType.OXYGEN_DEPLETED:
			_stats["deaths_by_oxygen"] += 1
		NightResult.FailureType.POWER_OVERLOAD:
			_stats["deaths_by_power"] += 1
		NightResult.FailureType.REPAIR_QUEUE_FULL:
			_stats["deaths_by_repair"] += 1
		NightResult.FailureType.SONAR_BLACKOUT:
			_stats["deaths_by_sonar"] += 1

func record_event_resolved() -> void:
	_stats["events_resolved"] += 1

func record_repair_completed() -> void:
	_stats["repairs_completed"] += 1

func record_equipment_broken() -> void:
	_stats["equipment_broken"] += 1

func record_critical(type: ResourceType.Type) -> void:
	match type:
		ResourceType.Type.OXYGEN: _stats["times_oxygen_critical"] += 1
		ResourceType.Type.POWER: _stats["times_power_critical"] += 1
		ResourceType.Type.SONAR: _stats["times_sonar_critical"] += 1

func record_allocation(type: ResourceType.Type, amount: int) -> void:
	var key := str(type)
	if _stats["resources_allocated"].has(key):
		_stats["resources_allocated"][key] += amount

func get_stats() -> Dictionary:
	return _stats.duplicate(true)

func get_stat(key: String) -> Variant:
	return _stats.get(key)

func serialize() -> Dictionary:
	return _stats.duplicate(true)

func deserialize(data: Dictionary) -> void:
	for key: String in data:
		_stats[key] = data[key]

func reset() -> void:
	_reset_stats()
