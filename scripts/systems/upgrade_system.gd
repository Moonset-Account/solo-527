class_name UpgradeSystem
extends Node

signal upgrade_purchased(machine_type, new_level)
signal upgrade_failed(machine_type, reason)

var upgrade_configs: Dictionary = {}
var machine_configs: Dictionary = {}
var player_upgrades: Dictionary = {}

func _ready() -> void:
	_load_configs()

func _load_configs() -> void:
	var upgrade_file := FileAccess.open("res://configs/upgrades.json", FileAccess.READ)
	if upgrade_file:
		var json := JSON.new()
		if json.parse(upgrade_file.get_as_text()) == OK:
			var data: Dictionary = json.data
			if data.has("upgrades"):
				upgrade_configs = data["upgrades"]
		upgrade_file.close()
	var machine_file := FileAccess.open("res://configs/machines.json", FileAccess.READ)
	if machine_file:
		var json := JSON.new()
		if json.parse(machine_file.get_as_text()) == OK:
			var data: Dictionary = json.data
			if data.has("machines"):
				machine_configs = data["machines"]
		machine_file.close()

func get_upgrade_level(machine_id: int) -> int:
	return player_upgrades.get(machine_id, 0)

func get_upgrade_cost(machine_type: String, from_level: int) -> int:
	var levels: Array = _get_levels_for_type(machine_type)
	var target_level := from_level + 1
	if target_level >= levels.size():
		return -1
	return int(levels[target_level].get("cost", -1))

func _get_levels_for_type(machine_type: String) -> Array:
	if upgrade_configs.has(machine_type):
		var data = upgrade_configs[machine_type]
		if data is Array:
			return data
	return []

func _get_max_level(machine_type: String) -> int:
	return _get_levels_for_type(machine_type).size()

func can_afford_upgrade(machine_type: String, from_level: int, money: int) -> bool:
	var cost = get_upgrade_cost(machine_type, from_level)
	if cost < 0:
		return false
	return money >= cost

func purchase_upgrade(machine_type: String, machine_id: int, current_money: int) -> bool:
	var current_level = get_upgrade_level(machine_id)
	var cost = get_upgrade_cost(machine_type, current_level)
	if cost < 0:
		upgrade_failed.emit(machine_type, "Already at max level")
		return false
	if current_money < cost:
		upgrade_failed.emit(machine_type, "Not enough money")
		return false
	var new_level = current_level + 1
	player_upgrades[machine_id] = new_level
	upgrade_purchased.emit(machine_type, new_level)
	return true

func get_speed_multiplier(machine_type: String, level: int) -> float:
	var levels: Array = _get_levels_for_type(machine_type)
	if level >= 0 and level < levels.size():
		return float(levels[level].get("speed_multiplier", 1.0))
	return 1.0

func get_quality_bonus(machine_type: String, level: int) -> float:
	var levels: Array = _get_levels_for_type(machine_type)
	if level >= 0 and level < levels.size():
		return float(levels[level].get("quality_bonus", 0.0))
	return 0.0

func get_belt_speed_multiplier(level: int) -> float:
	var levels: Array = _get_levels_for_type("conveyor")
	if level >= 0 and level < levels.size():
		return float(levels[level].get("belt_speed_multiplier", 1.0))
	return 1.0

func get_all_upgrade_costs(machine_type: String) -> Array[int]:
	var costs: Array[int] = []
	var levels: Array = _get_levels_for_type(machine_type)
	for i in range(1, levels.size()):
		costs.append(int(levels[i].get("cost", 0)))
	return costs

func get_machine_cost(machine_type: String) -> int:
	if machine_configs.has(machine_type):
		return int(machine_configs[machine_type].get("cost", 100))
	return 100

func reset_upgrades() -> void:
	player_upgrades.clear()
