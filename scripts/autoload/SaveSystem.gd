extends Node
## SaveSystem - 存档系统
## 负责保存/加载游戏进度、设置等数据到本地文件

signal save_completed(slot: int)
signal load_completed(slot: int)
signal save_error(message: String)

const SAVE_DIR := "user://saves"
const SETTINGS_FILE := "user://settings.cfg"
const PLAYTEST_FILE := "user://playtest.json"

var _current_slot: int = 0

func _ready() -> void:
	_ensure_directories()

func _ensure_directories() -> void:
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		DirAccess.make_dir_absolute(SAVE_DIR)

func save_game(slot: int = 0) -> bool:
	_current_slot = slot
	var data: Dictionary = {
		"version": 1,
		"timestamp": Time.get_unix_time_from_system(),
		"money": GameState.money,
		"level": GameState.level,
		"experience": GameState.experience,
		"current_level_id": GameState.current_level_id,
		"total_orders_completed": GameState.total_orders_completed,
		"total_orders_failed": GameState.total_orders_failed,
		"machines": GameState.machines,
		"conveyors": GameState.conveyors,
		"quality_checks": GameState.quality_checks,
		"active_orders": GameState.active_orders,
		"achievements": AchievementSystem.get_unlocked_achievements(),
		"daily_progress": AchievementSystem.get_daily_progress()
	}
	var json_str: String = JSON.stringify(data)
	var path: String = "%s/slot_%d.json" % [SAVE_DIR, slot]
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		save_error.emit("无法创建存档文件")
		return false
	file.store_string(json_str)
	file.close()
	GameState.last_save_timestamp = Time.get_unix_time_from_system()
	save_completed.emit(slot)
	return true

func load_game(slot: int = 0) -> bool:
	_current_slot = slot
	var path: String = "%s/slot_%d.json" % [SAVE_DIR, slot]
	if not FileAccess.file_exists(path):
		return false
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return false
	var json_str: String = file.get_as_text()
	file.close()
	var result: Variant = JSON.parse_string(json_str)
	if typeof(result) != TYPE_DICTIONARY:
		return false
	var data: Dictionary = result
	GameState.money = data.get("money", 500)
	GameState.level = data.get("level", 1)
	GameState.experience = data.get("experience", 0)
	GameState.current_level_id = data.get("current_level_id", "level_1")
	GameState.total_orders_completed = data.get("total_orders_completed", 0)
	GameState.total_orders_failed = data.get("total_orders_failed", 0)
	GameState.machines = data.get("machines", {})
	GameState.conveyors = data.get("conveyors", {})
	GameState.quality_checks = data.get("quality_checks", {})
	GameState.active_orders = data.get("active_orders", [])
	var last_time: float = data.get("timestamp", GameState.session_start_time)
	var offline_seconds: int = int(Time.get_unix_time_from_system() - last_time)
	if offline_seconds > 60:
		var earnings: Dictionary = GameState.get_offline_earnings(offline_seconds)
		GameState.add_money(earnings.get("money", 0))
		_show_offline_earnings(earnings)
	AchievementSystem.load_achievements(data.get("achievements", []))
	AchievementSystem.load_daily_progress(data.get("daily_progress", {}))
	load_completed.emit(slot)
	GameState.money_changed.emit(GameState.money)
	GameState.level_changed.emit(GameState.level)
	return true

func _show_offline_earnings(earnings: Dictionary) -> void:
	var seconds: int = earnings.get("seconds", 0)
	var hours: int = seconds / 3600
	var minutes: int = (seconds % 3600) / 60
	var time_str: String = ""
	if hours > 0:
		time_str += "%d小时" % hours
	if minutes > 0:
		time_str += "%d分钟" % minutes
	if time_str.is_empty():
		time_str = "%d秒" % seconds
	print("[离线收益] 挂机 %s, 获得金币: %d, 模拟订单: %d" % [time_str, earnings.get("money", 0), earnings.get("orders", 0)])

func has_save(slot: int = 0) -> bool:
	return FileAccess.file_exists("%s/slot_%d.json" % [SAVE_DIR, slot])

func delete_save(slot: int = 0) -> bool:
	var path: String = "%s/slot_%d.json" % [SAVE_DIR, slot]
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)
		return true
	return false

func save_settings(settings: Dictionary) -> bool:
	var cfg := ConfigFile.new()
	for key in settings.keys():
		cfg.set_value("settings", key, settings[key])
	return cfg.save(SETTINGS_FILE) == OK

func load_settings() -> Dictionary:
	var cfg := ConfigFile.new()
	var settings: Dictionary = {
		"master_volume": 0.8,
		"music_volume": 0.6,
		"sfx_volume": 0.9,
		"fullscreen": false,
		"pixel_perfect": true,
		"show_fps": false,
		"language": "zh-CN"
	}
	var err: Error = cfg.load(SETTINGS_FILE)
	if err != OK:
		return settings
	for key in settings.keys():
		if cfg.has_section_key("settings", key):
			settings[key] = cfg.get_value("settings", key, settings[key])
	return settings

func save_playtest_data(playtest_data: Dictionary) -> bool:
	var json_str: String = JSON.stringify(playtest_data, "\t")
	var file := FileAccess.open(PLAYTEST_FILE, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(json_str)
	file.close()
	return true

func get_current_slot() -> int:
	return _current_slot
