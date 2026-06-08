class_name ResourceManager
extends Node

signal resource_changed(resource_type: StringName, new_value: float)
signal resource_depleted(resource_type: StringName)
signal all_critical_failed

const OXYGEN: StringName = &"oxygen"
const WATER: StringName = &"water"
const SOLAR: StringName = &"solar"
const PLANT_HEALTH: StringName = &"plant_health"

var _resources: Dictionary = {}
var _max_values: Dictionary = {}
var _decay_rates: Dictionary = {}
var _depleted_flags: Dictionary = {}

func _ready() -> void:
	for res in [OXYGEN, WATER, SOLAR, PLANT_HEALTH]:
		_resources[res] = 100.0
		_max_values[res] = 100.0
		_decay_rates[res] = 0.0
		_depleted_flags[res] = false

func setup(config: Dictionary) -> void:
	for res in [OXYGEN, WATER, SOLAR, PLANT_HEALTH]:
		if config.has(res):
			var c = config[res]
			_resources[res] = c.get("initial", 100.0)
			_max_values[res] = c.get("max", 100.0)
			_decay_rates[res] = c.get("decay", 0.0)
			_depleted_flags[res] = false

func get_value(resource_type: StringName) -> float:
	return _resources.get(resource_type, 0.0)

func get_max(resource_type: StringName) -> float:
	return _max_values.get(resource_type, 100.0)

func get_ratio(resource_type: StringName) -> float:
	var mx = get_max(resource_type)
	if mx <= 0.0:
		return 0.0
	return get_value(resource_type) / mx

func get_decay_rate(resource_type: StringName) -> float:
	return _decay_rates.get(resource_type, 0.0)

func set_decay_rate(resource_type: StringName, rate: float) -> void:
	_decay_rates[resource_type] = rate

func modify(resource_type: StringName, delta: float) -> void:
	var old = _resources.get(resource_type, 0.0)
	var mx = _max_values.get(resource_type, 100.0)
	var new_val = clampf(old + delta, 0.0, mx)
	_resources[resource_type] = new_val
	resource_changed.emit(resource_type, new_val)
	if new_val <= 0.0 and not _depleted_flags.get(resource_type, false):
		_depleted_flags[resource_type] = true
		resource_depleted.emit(resource_type)
	_check_all_depleted()

func apply_decay(delta_time: float) -> void:
	for res in _resources:
		var rate = _decay_rates.get(res, 0.0)
		if rate > 0.0:
			modify(res, -rate * delta_time)

func is_depleted(resource_type: StringName) -> bool:
	return _depleted_flags.get(resource_type, false)

func get_depleted_list() -> Array[StringName]:
	var result: Array[StringName] = []
	for res in _depleted_flags:
		if _depleted_flags[res]:
			result.append(res)
	return result

func _check_all_depleted() -> void:
	var critical = [OXYGEN, WATER]
	var all_dead = true
	for c in critical:
		if not _depleted_flags.get(c, false):
			all_dead = false
			break
	if all_dead:
		all_critical_failed.emit()

func serialize() -> Dictionary:
	var data = {}
	for res in _resources:
		data[res] = {
			"value": _resources[res],
			"max": _max_values[res],
			"decay": _decay_rates[res],
			"depleted": _depleted_flags[res],
		}
	return data

func deserialize(data: Dictionary) -> void:
	for res in data:
		var d = data[res]
		_resources[res] = d["value"]
		_max_values[res] = d["max"]
		_decay_rates[res] = d["decay"]
		_depleted_flags[res] = d["depleted"]
		resource_changed.emit(res, _resources[res])

static func resource_display_name(res: StringName) -> String:
	match res:
		OXYGEN: return "氧气"
		WATER: return "供水"
		SOLAR: return "太阳能"
		PLANT_HEALTH: return "植物健康"
		_: return String(res)
