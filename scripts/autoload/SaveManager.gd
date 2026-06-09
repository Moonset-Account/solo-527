extends Node

const SAVE_FILE = "user://savegame.dat"
const SETTINGS_FILE = "user://settings.dat"

var save_data = {
	"unlocked_levels": 1,
	"level_progress": {},
	"total_scans": 0,
	"total_fixes": 0,
	"total_time": 0.0,
	"best_times": {},
	"achievements": {},
	"leaderboard": [],
	"daily_challenge_date": "",
	"daily_challenge_best": 0
}

var settings = {
	"master_volume": 0.8,
	"sfx_volume": 0.8,
	"music_volume": 0.6,
	"fullscreen": false,
	"show_debug_log": true,
	"noise_indicator": true
}

func _ready():
	load_settings()
	load_save()

func save_game():
	var file = FileAccess.open(SAVE_FILE, FileAccess.WRITE)
	if file:
		var data_str = JSON.stringify(save_data)
		file.store_string(data_str)
		file.close()
		DebugLog.success("游戏存档已保存")
	else:
		DebugLog.error("保存游戏失败: %s" % FileAccess.get_open_error())

func load_save():
	if FileAccess.file_exists(SAVE_FILE):
		var file = FileAccess.open(SAVE_FILE, FileAccess.READ)
		if file:
			var parse_result = JSON.parse_string(file.get_as_text())
			file.close()
			if parse_result != null:
				save_data = save_data.duplicate(true)
				for key in parse_result.keys():
					save_data[key] = parse_result[key]
				DebugLog.info("游戏存档已加载")
				return
	DebugLog.info("未找到存档，使用默认存档")

func save_settings():
	var file = FileAccess.open(SETTINGS_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(settings))
		file.close()
		DebugLog.success("设置已保存")

func load_settings():
	if FileAccess.file_exists(SETTINGS_FILE):
		var file = FileAccess.open(SETTINGS_FILE, FileAccess.READ)
		if file:
			var parse_result = JSON.parse_string(file.get_as_text())
			file.close()
			if parse_result != null:
				for key in parse_result.keys():
					settings[key] = parse_result[key]
				DebugLog.info("设置已加载")
				return
	DebugLog.info("未找到设置，使用默认设置")

func unlock_level(level_id: int):
	if level_id > save_data["unlocked_levels"]:
		save_data["unlocked_levels"] = level_id
		save_game()
		DebugLog.success("解锁关卡 %d" % level_id)

func is_level_unlocked(level_id: int) -> bool:
	return level_id <= save_data["unlocked_levels"]

func set_level_progress(level_id: int, completed: bool, time: float, stars: int = 0):
	var level_key = str(level_id)
	if not save_data["level_progress"].has(level_key):
		save_data["level_progress"][level_key] = {}
	save_data["level_progress"][level_key]["completed"] = completed
	save_data["level_progress"][level_key]["stars"] = max(save_data["level_progress"][level_key].get("stars", 0), stars)
	if not save_data["best_times"].has(level_key) or time < save_data["best_times"][level_key]:
		save_data["best_times"][level_key] = time
	save_game()

func get_level_progress(level_id: int) -> Dictionary:
	var level_key = str(level_id)
	return save_data["level_progress"].get(level_key, {"completed": false, "stars": 0})

func get_best_time(level_id: int) -> float:
	var level_key = str(level_id)
	return save_data["best_times"].get(level_key, 0.0)

func increment_stat(stat: String, amount: int = 1):
	if save_data.has(stat):
		save_data[stat] += amount
		save_game()

func add_total_time(time: float):
	save_data["total_time"] += time
	save_game()

func add_leaderboard_entry(name: String, score: int, level: int):
	var entry = {
		"name": name,
		"score": score,
		"level": level,
		"date": Time.get_date_string_from_system()
	}
	save_data["leaderboard"].append(entry)
	save_data["leaderboard"].sort_custom(func(a, b): return a["score"] > b["score"])
	if save_data["leaderboard"].size() > 20:
		save_data["leaderboard"].resize(20)
	save_game()

func get_leaderboard() -> Array:
	return save_data["leaderboard"].duplicate()

func check_daily_challenge():
	var today = Time.get_date_string_from_system()
	if save_data["daily_challenge_date"] != today:
		save_data["daily_challenge_date"] = today
		save_data["daily_challenge_best"] = 0
		save_game()
	return save_data["daily_challenge_best"]

func set_daily_challenge_score(score: int):
	if score > save_data["daily_challenge_best"]:
		save_data["daily_challenge_best"] = score
		save_game()

func reset_save():
	save_data = {
		"unlocked_levels": 1,
		"level_progress": {},
		"total_scans": 0,
		"total_fixes": 0,
		"total_time": 0.0,
		"best_times": {},
		"achievements": {},
		"leaderboard": [],
		"daily_challenge_date": "",
		"daily_challenge_best": 0
	}
	save_game()
	DebugLog.warning("存档已重置")
