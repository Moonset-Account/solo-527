extends Resource
class_name LevelConfig

@export var level_id: String = ""
@export var level_name: String = ""
@export var box_width: float = 200.0
@export var box_height: float = 300.0
@export var max_weight: float = 100.0
@export var star_thresholds: PackedFloat32Array = PackedFloat32Array([50.0, 75.0, 100.0])
@export var items: Array = []
@export var par_time: float = 60.0
@export var tutorial_hints: PackedStringArray = PackedStringArray()

func get_star_count(score: float) -> int:
	if star_thresholds.size() < 3:
		return 0
	if score >= star_thresholds[2]:
		return 3
	if score >= star_thresholds[1]:
		return 2
	if score >= star_thresholds[0]:
		return 1
	return 0
