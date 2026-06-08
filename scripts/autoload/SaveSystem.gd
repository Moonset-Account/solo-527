extends Node

const SAVE_PATH := "user://savegame.cfg"
const SAVE_KEY_SETTINGS := "settings"
const SAVE_KEY_PROGRESS := "progress"
const SAVE_KEY_SCORES := "scores"

var _config: ConfigFile = ConfigFile.new()
var _settings_cache: Dictionary = {
	"master_volume": 0.7,
	"bgm_volume": 0.6,
	"sfx_volume": 0.8,
	"fullscreen": false,
	"text_speed": 1.0,
}
var _progress_cache: Dictionary = {
	"unlocked_levels": ["level_01_tutorial"],
	"completed_levels": [],
	"last_level": "",
	"total_play_time": 0,
	"tutorial_seen": false,
}
var _scores_cache: Dictionary = {}

func _ready() -> void:
	_load_data()
	_apply_settings_to_audio()
	DebugLog.log_info("SaveSystem 加载完成, 已解锁 %d 个关卡" % _progress_cache["unlocked_levels"].size())

func _load_data() -> void:
	var err: Error = _config.load(SAVE_PATH)
	if err != OK:
		DebugLog.log_warn("无存档文件，使用默认设置")
		save()
		return
	if _config.has_section(SAVE_KEY_SETTINGS):
		for k in _settings_cache.keys():
			if _config.has_section_key(SAVE_KEY_SETTINGS, k):
				_settings_cache[k] = _config.get_value(SAVE_KEY_SETTINGS, k, _settings_cache[k])
	if _config.has_section(SAVE_KEY_PROGRESS):
		for k in _progress_cache.keys():
			if _config.has_section_key(SAVE_KEY_PROGRESS, k):
				_progress_cache[k] = _config.get_value(SAVE_KEY_PROGRESS, k, _progress_cache[k])
	if _config.has_section(SAVE_KEY_SCORES):
		var keys := _config.get_section_keys(SAVE_KEY_SCORES)
		for k in keys:
			_scores_cache[k] = _config.get_value(SAVE_KEY_SCORES, k, 0)

func save() -> void:
	for k in _settings_cache.keys():
		_config.set_value(SAVE_KEY_SETTINGS, k, _settings_cache[k])
	for k in _progress_cache.keys():
		_config.set_value(SAVE_KEY_PROGRESS, k, _progress_cache[k])
	for k in _scores_cache.keys():
		_config.set_value(SAVE_KEY_SCORES, k, _scores_cache[k])
	var err: Error = _config.save(SAVE_PATH)
	if err != OK:
		DebugLog.log_error("保存失败: %s" % str(err))

func _apply_settings_to_audio() -> void:
	AudioManager.set_master_volume(_settings_cache["master_volume"])
	AudioManager.set_bgm_volume(_settings_cache["bgm_volume"])
	AudioManager.set_sfx_volume(_settings_cache["sfx_volume"])

func get_setting(key: String):
	return _settings_cache.get(key, null)

func set_setting(key: String, value) -> void:
	_settings_cache[key] = value
	save()
	if key in ["master_volume", "bgm_volume", "sfx_volume"]:
		_apply_settings_to_audio()

func get_all_settings() -> Dictionary:
	return _settings_cache.duplicate(true)

func is_level_unlocked(level_id: String) -> bool:
	return level_id in _progress_cache["unlocked_levels"]

func is_level_completed(level_id: String) -> bool:
	return level_id in _progress_cache["completed_levels"]

func unlock_next_level(current_level_id: String) -> void:
	var levels := GameState.get_level_ids_sorted()
	var idx: int = levels.find(current_level_id)
	if idx == -1 or idx >= levels.size() - 1:
		return
	var next_id: String = levels[idx + 1]
	if next_id not in _progress_cache["unlocked_levels"]:
		_progress_cache["unlocked_levels"].append(next_id)
		DebugLog.log_info("已解锁新关卡: %s" % next_id)
	if current_level_id not in _progress_cache["completed_levels"]:
		_progress_cache["completed_levels"].append(current_level_id)
	save()

func set_level_score(level_id: String, score: int) -> void:
	var best: int = _scores_cache.get(level_id, 0)
	if score > best:
		_scores_cache[level_id] = score
		save()

func get_level_score(level_id: String) -> int:
	return _scores_cache.get(level_id, 0)

func set_last_level(level_id: String) -> void:
	_progress_cache["last_level"] = level_id
	save()

func get_last_level() -> String:
	return _progress_cache.get("last_level", "")

func mark_tutorial_seen() -> void:
	_progress_cache["tutorial_seen"] = true
	save()

func is_tutorial_seen() -> bool:
	return _progress_cache.get("tutorial_seen", false)

func get_progress() -> Dictionary:
	return _progress_cache.duplicate(true)

func reset_progress() -> void:
	_progress_cache = {
		"unlocked_levels": ["level_01_tutorial"],
		"completed_levels": [],
		"last_level": "",
		"total_play_time": 0,
		"tutorial_seen": false,
	}
	_scores_cache.clear()
	save()
	DebugLog.log_warn("游戏进度已重置")
