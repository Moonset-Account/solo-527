class_name AchievementSystem
extends Node

signal achievement_unlocked(achievement_id, achievement_data)

var achievement_configs: Array = []
var unlocked_achievements: PackedStringArray = []
var progress_tracking: Dictionary = {}

func _ready() -> void:
	var file_path = "res://configs/achievements.json"
	if not FileAccess.file_exists(file_path):
		return
	var file = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return
	var json = JSON.new()
	var err = json.parse(file.get_as_text())
	file.close()
	if err != OK:
		return
	var data = json.data
	if data is Dictionary and data.has("achievements"):
		achievement_configs = data["achievements"]
	elif data is Array:
		achievement_configs = data

func check_achievements(stats: Dictionary) -> void:
	for achievement in achievement_configs:
		if not achievement is Dictionary:
			continue
		var id = achievement.get("id", "")
		if is_unlocked(id):
			continue
		var condition_type: String = str(achievement.get("condition_type", ""))
		var condition_value = achievement.get("condition_value", 0)
		if check_condition(condition_type, condition_value, stats):
			unlock_achievement(id)
		else:
			progress_tracking[id] = {
				"current": _get_stat_for_condition(condition_type, stats),
				"target": condition_value
			}

func check_condition(condition_type: String, condition_value: Variant, current_stats: Dictionary) -> bool:
	match condition_type:
		"orders_completed":
			return current_stats.get("orders_completed", 0) >= condition_value
		"total_money_earned":
			return current_stats.get("total_earnings", 0) >= condition_value
		"level_completed":
			return current_stats.get("last_completed_level", 0) >= condition_value
		"level_no_failed_orders":
			return current_stats.get("no_failed_orders", false) == true
		"order_completed_in_half_time":
			return current_stats.get("half_time_orders", 0) >= condition_value
		"perfect_quality_in_level":
			return current_stats.get("perfect_quality", false) == true
		"machine_max_upgraded":
			return current_stats.get("max_upgraded_machines", 0) >= condition_value
		"conveyors_placed_single_level":
			return current_stats.get("conveyors_placed", 0) >= condition_value
		"bottlenecks_fixed":
			return current_stats.get("bottlenecks_fixed", 0) >= condition_value
		"offline_earnings_collected":
			return current_stats.get("offline_earnings_collected", 0) >= condition_value
		"gold_star_earned":
			return current_stats.get("gold_stars", 0) >= condition_value
		_:
			return false

func _get_stat_for_condition(condition_type: String, stats: Dictionary) -> Variant:
	match condition_type:
		"orders_completed":
			return stats.get("orders_completed", 0)
		"total_money_earned":
			return stats.get("total_earnings", 0)
		"level_completed":
			return stats.get("last_completed_level", 0)
		"conveyors_placed_single_level":
			return stats.get("conveyors_placed", 0)
		"bottlenecks_fixed":
			return stats.get("bottlenecks_fixed", 0)
		_:
			return 0

func unlock_achievement(id: String) -> void:
	if is_unlocked(id):
		return
	unlocked_achievements.append(id)
	var achievement_data = _get_achievement_data(id)
	achievement_unlocked.emit(id, achievement_data)
	var reward: int = int(achievement_data.get("reward_money", 0))
	if reward > 0 and GameManager:
		GameManager.add_money(reward)

func _get_achievement_data(id: String) -> Dictionary:
	for achievement in achievement_configs:
		if achievement is Dictionary and achievement.get("id", "") == id:
			return achievement
	return {}

func is_unlocked(id: String) -> bool:
	return id in unlocked_achievements

func get_unlocked() -> Array:
	var result: Array = []
	for id in unlocked_achievements:
		result.append(_get_achievement_data(id))
	return result

func get_all_achievements() -> Array:
	return achievement_configs.duplicate(true)

func get_progress(id: String) -> Dictionary:
	if is_unlocked(id):
		return {"current": 1.0, "target": 1.0, "complete": true}
	if progress_tracking.has(id):
		var data = progress_tracking[id]
		return {
			"current": data.get("current", 0),
			"target": data.get("target", 1),
			"complete": false
		}
	return {"current": 0, "target": 0, "complete": false}

func reset() -> void:
	unlocked_achievements.clear()
	progress_tracking.clear()
