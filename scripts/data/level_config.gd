class_name LevelConfig
extends Resource

@export var level_id: int = 0
@export var level_name: String = ""
@export var grid_width: int = 8
@export var grid_height: int = 6
@export var starting_money: int = 500
@export var required_orders: int = 2
@export var time_limit: float = 180.0
@export var available_machines: PackedStringArray = []
@export var tutorial_enabled: bool = false
@export var reputation_start: int = 100
@export var reputation_penalty: int = 15
@export var reward_multiplier: float = 1.0
@export var star_thresholds: Dictionary = {"bronze": 0.5, "silver": 0.75, "gold": 1.0}

static func load_from_dict(data: Dictionary) -> LevelConfig:
	var config := LevelConfig.new()
	config.level_id = int(data.get("id", data.get("level_id", 0)))
	config.level_name = str(data.get("name", data.get("level_name", "")))
	config.grid_width = int(data.get("grid_width", 8))
	config.grid_height = int(data.get("grid_height", 6))
	config.starting_money = int(data.get("starting_money", 500))
	config.required_orders = int(data.get("required_orders", 2))
	config.time_limit = float(data.get("time_limit", 180.0))
	var machines: PackedStringArray = []
	var raw_machines = data.get("available_machines", [])
	if raw_machines is Array:
		for machine in raw_machines:
			machines.append(str(machine))
	config.available_machines = machines
	config.tutorial_enabled = bool(data.get("tutorial_enabled", false))
	config.reputation_start = int(data.get("reputation_start", 100))
	config.reputation_penalty = int(data.get("reputation_penalty_per_failed_order", data.get("reputation_penalty", 15)))
	config.reward_multiplier = float(data.get("reward_multiplier", 1.0))
	var thresholds: Dictionary = {}
	var raw_thresholds = data.get("star_thresholds", {})
	if raw_thresholds is Dictionary:
		for key in raw_thresholds:
			thresholds[key] = float(raw_thresholds[key])
	config.star_thresholds = thresholds
	return config

static func load_all_levels() -> Array[LevelConfig]:
	var levels: Array[LevelConfig] = []
	var file := FileAccess.open("res://configs/levels.json", FileAccess.READ)
	if file == null:
		return levels
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	file.close()
	if err != OK:
		return levels
	var data = json.data
	var levels_array = data
	if data is Dictionary and data.has("levels"):
		levels_array = data["levels"]
	if levels_array is Array:
		for entry in levels_array:
			if entry is Dictionary:
				levels.append(LevelConfig.load_from_dict(entry))
	return levels

static func get_level_by_id(level_id: int) -> LevelConfig:
	var all_levels := load_all_levels()
	for level in all_levels:
		if level.level_id == level_id:
			return level
	return null

func get_star_rating(completion_rate: float) -> int:
	if completion_rate >= star_thresholds.get("gold", 1.0):
		return 3
	if completion_rate >= star_thresholds.get("silver", 0.75):
		return 2
	if completion_rate >= star_thresholds.get("bronze", 0.5):
		return 1
	return 0
