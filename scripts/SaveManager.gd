extends Node

const SAVE_FILE_PATH := "user://savegame.cfg"
const SESSION_LOG_PATH := "user://play_sessions.json"

var save_data: Dictionary = {}
var level_results: Dictionary = {}
var settings_data: Dictionary = {
	"master_volume": 0.8,
	"music_volume": 0.6,
	"sfx_volume": 0.9,
	"fullscreen": false,
	"vsync": true,
	"language": "zh_CN",
	"show_fps": false,
	"haptics_enabled": true
}
var achievements: Dictionary = {}
var stats: Dictionary = {
	"total_games_played": 0,
	"total_time_played": 0.0,
	"total_items_packed": 0,
	"total_stars_earned": 0,
	"perfect_games": 0,
	"total_mistakes": 0
}

func _ready() -> void:
	_load_save()

func _load_save() -> void:
	var file := FileAccess.open(SAVE_FILE_PATH, FileAccess.READ)
	if file:
		var json_str: String = file.get_as_text()
		file.close()
		var parse_result: JSONParseResult = JSON.parse(json_str)
		if parse_result.error == OK and parse_result.result is Dictionary:
			var data: Dictionary = parse_result.result
			if data.has("level_results"):
				level_results = data["level_results"]
			if data.has("settings"):
				settings_data = settings_data.duplicate()
				settings_data.merge(data["settings"], true)
			if data.has("achievements"):
				achievements = data["achievements"]
			if data.has("stats"):
				stats.merge(data["stats"], true)

func save_game() -> void:
	var data := {
		"level_results": level_results,
		"settings": settings_data,
		"achievements": achievements,
		"stats": stats,
		"save_version": 1,
		"timestamp": Time.get_datetime_string_from_system()
	}
	var file := FileAccess.open(SAVE_FILE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func save_level_result(level_id: int, result: Dictionary) -> void:
	var key: String = str(level_id)
	var existing: Dictionary = {}
	if level_results.has(key):
		existing = level_results[key].duplicate(true)
	var best_score: int = existing.get("best_score", 0)
	var best_stars: int = existing.get("best_stars", 0)
	best_score = max(best_score, result.get("final_score", 0))
	best_stars = max(best_stars, result.get("stars", 0))
	level_results[key] = {
		"best_score": best_score,
		"best_stars": best_stars,
		"last_played": Time.get_datetime_string_from_system(),
		"attempts": existing.get("attempts", 0) + 1,
		"completions": existing.get("completions", 0) + (1 if result.get("success", false) else 0)
	}
	stats["total_games_played"] += 1
	stats["total_items_packed"] += result.get("items_placed", 0)
	stats["total_stars_earned"] = max(stats["total_stars_earned"], result.get("stars", 0) + stats["total_stars_earned"] - best_stars + best_stars)
	stats["total_mistakes"] += result.get("mistakes", 0)
	if result.get("success", false):
		stats["total_time_played"] += result.get("time_elapsed", 0.0)
		if result.get("stars", 0) == 3:
			stats["perfect_games"] += 1
	save_game()

func get_level_result(level_id: int) -> Dictionary:
	var key: String = str(level_id)
	if level_results.has(key):
		return level_results[key].duplicate(true)
	return {}

func get_unlocked_levels(max_levels: int = 20) -> Array:
	var unlocked := [1]
	for i in range(1, max_levels + 1):
		var result: Dictionary = get_level_result(i)
		if result.get("best_stars", 0) >= 1 and not unlocked.has(i + 1):
			unlocked.append(i + 1)
	return unlocked

func is_level_unlocked(level_id: int) -> bool:
	if level_id <= 1:
		return true
	return get_unlocked_levels().has(level_id)

func get_setting(key: String, default_value = null):
	return settings_data.get(key, default_value)

func set_setting(key: String, value) -> void:
	settings_data[key] = value
	save_game()

func add_play_session(session_data: Dictionary) -> void:
	var sessions: Array = []
	var file := FileAccess.open(SESSION_LOG_PATH, FileAccess.READ)
	if file:
		var json_str: String = file.get_as_text()
		file.close()
		var parse_result: JSONParseResult = JSON.parse(json_str)
		if parse_result.error == OK and parse_result.result is Array:
			sessions = parse_result.result
	sessions.append(session_data)
	if sessions.size() > 100:
		sessions = sessions.slice(sessions.size() - 100, sessions.size())
	file = FileAccess.open(SESSION_LOG_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(sessions))
		file.close()

func get_play_sessions(limit: int = 20) -> Array:
	var file := FileAccess.open(SESSION_LOG_PATH, FileAccess.READ)
	if not file:
		return []
	var json_str: String = file.get_as_text()
	file.close()
	var parse_result: JSONParseResult = JSON.parse(json_str)
	if parse_result.error == OK and parse_result.result is Array:
		var arr: Array = parse_result.result
		if limit > 0 and arr.size() > limit:
			return arr.slice(arr.size() - limit, arr.size())
		return arr
	return []

func reset_all_data() -> void:
	level_results.clear()
	achievements.clear()
	stats = {
		"total_games_played": 0,
		"total_time_played": 0.0,
		"total_items_packed": 0,
		"total_stars_earned": 0,
		"perfect_games": 0,
		"total_mistakes": 0
	}
	save_game()
