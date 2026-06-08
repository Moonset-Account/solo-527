extends Node

signal score_updated(score: int)

var _current_level_id: String = ""
var score_entries: Array = []
var _max_possible_score: int = 0
var _star_thresholds: PackedFloat32Array = PackedFloat32Array()


func start_scoring(level_id: String) -> void:
	_current_level_id = level_id
	score_entries.clear()
	_max_possible_score = 0
	_star_thresholds = PackedFloat32Array()
	var level_data = LevelManager.get_level_data(level_id)
	if not level_data.is_empty():
		var thresholds = level_data.get("star_thresholds", [])
		if thresholds is Array and thresholds.size() >= 3:
			_star_thresholds = PackedFloat32Array([float(thresholds[0]), float(thresholds[1]), float(thresholds[2])])
	score_updated.emit(0)


func add_score(category: String, points: int) -> void:
	score_entries.append({"category": category, "points": points})
	score_updated.emit(get_current_score())


func get_current_score() -> int:
	var total: int = 0
	for entry in score_entries:
		total += entry.get("points", 0)
	return total


func get_max_possible_score() -> int:
	return _max_possible_score


func set_max_possible_score(value: int) -> void:
	_max_possible_score = value


func calculate_stars() -> int:
	if _star_thresholds.size() >= 3:
		var score = get_current_score()
		if score >= _star_thresholds[2]:
			return 3
		if score >= _star_thresholds[1]:
			return 2
		if score >= _star_thresholds[0]:
			return 1
		return 0
	if _max_possible_score <= 0:
		return 0
	var ratio: float = float(get_current_score()) / float(_max_possible_score)
	if ratio >= 0.9:
		return 3
	if ratio >= 0.6:
		return 2
	if ratio >= 0.3:
		return 1
	return 0


func reset_score() -> void:
	score_entries.clear()
	score_updated.emit(0)


func undo_last_score() -> void:
	if score_entries.is_empty():
		return
	score_entries.pop_back()
	score_updated.emit(get_current_score())
