extends Node
## 存档管理器 - 玩家进度、设置的持久化存储

const SAVE_FILE_PATH := "user://savegame.save"
const SETTINGS_FILE_PATH := "user://settings.save"

var _save_data: Dictionary = {}
var _settings_data: Dictionary = {}

var default_settings: Dictionary = {
	"master_volume": 0.8,
	"sfx_volume": 0.7,
	"music_volume": 0.5,
	"fullscreen": false,
	"vsync": true,
	"language": "zh-CN",
	"crouch_toggle": true,
	"mouse_sensitivity": 1.0,
}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_settings()
	load_save()

func save_all() -> void:
	_save_game()
	_save_settings()

func load_all() -> void:
	load_save()
	load_settings()

func set_save_data(key: String, value: Variant) -> void:
	_save_data[key] = value

func get_save_data(key: String, default_value: Variant = null) -> Variant:
	if _save_data.has(key):
		return _save_data[key]
	return default_value

func has_save_data(key: String) -> bool:
	return _save_data.has(key)

func clear_save_data() -> void:
	_save_data.clear()
	_save_game()
	load_save()
	EventBus.emit_ui_toast("游戏进度已清除", 2.0)

func set_setting(key: String, value: Variant) -> void:
	_settings_data[key] = value
	_apply_setting(key, value)

func get_setting(key: String) -> Variant:
	if _settings_data.has(key):
		return _settings_data[key]
	if default_settings.has(key):
		return default_settings[key]
	return null

func has_setting(key: String) -> bool:
	return _settings_data.has(key) or default_settings.has(key)

func reset_settings_to_defaults() -> void:
	_settings_data = default_settings.duplicate(true)
	for key in default_settings.keys():
		_apply_setting(key, default_settings[key])
	_save_settings()

func load_save() -> void:
	var file := FileAccess.open(SAVE_FILE_PATH, FileAccess.READ)
	if file:
		var data = file.get_var()
		if data is Dictionary:
			_save_data = data
		file.close()
	else:
		_save_data = {}

func load_settings() -> void:
	var file := FileAccess.open(SETTINGS_FILE_PATH, FileAccess.READ)
	if file:
		var data = file.get_var()
		if data is Dictionary:
			_settings_data = data
		file.close()
	else:
		_settings_data = default_settings.duplicate(true)
	_save_settings()
	for key in _settings_data.keys():
		_apply_setting(key, _settings_data[key])

func _save_game() -> void:
	var dir := DirAccess.open("user://")
	if dir == null:
		push_error("无法访问 user:// 目录")
		return
	var file := FileAccess.open(SAVE_FILE_PATH, FileAccess.WRITE)
	if file:
		file.store_var(_save_data)
		file.close()
	else:
		push_error("无法写入存档文件：%s" % SAVE_FILE_PATH)

func _save_settings() -> void:
	var dir := DirAccess.open("user://")
	if dir == null:
		push_error("无法访问 user:// 目录")
		return
	var file := FileAccess.open(SETTINGS_FILE_PATH, FileAccess.WRITE)
	if file:
		file.store_var(_settings_data)
		file.close()
	else:
		push_error("无法写入设置文件：%s" % SETTINGS_FILE_PATH)

func _apply_setting(key: String, value: Variant) -> void:
	match key:
		"master_volume":
			AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(value))
		"sfx_volume":
			if AudioServer.get_bus_index("SFX") != -1:
				AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"), linear_to_db(value))
		"music_volume":
			if AudioServer.get_bus_index("Music") != -1:
				AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), linear_to_db(value))
		"fullscreen":
			if value:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
			else:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		"vsync":
			DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if value else DisplayServer.VSYNC_DISABLED)
		_:
			pass

func linear_to_db(linear: float) -> float:
	if linear <= 0.0:
		return -80.0
	return 20.0 * log(linear) / log(10.0)

func db_to_linear(db_val: float) -> float:
	return pow(10.0, db_val / 20.0)

func get_all_settings() -> Dictionary:
	var result := default_settings.duplicate(true)
	for key in _settings_data.keys():
		result[key] = _settings_data[key]
	return result
