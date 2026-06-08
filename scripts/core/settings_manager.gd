class_name SettingsManager
extends Node

signal settings_changed

const SETTINGS_PATH: String = "user://settings.json"

var _settings: Dictionary = {}

var _defaults: Dictionary = {
	"master_volume": 1.0,
	"sfx_volume": 1.0,
	"music_volume": 0.8,
	"fullscreen": false,
	"vsync": true,
	"show_vision_cones": true,
	"show_noise_indicator": true,
	"language": "en"
}

func _ready() -> void:
	load_settings()

func load_settings() -> void:
	if FileAccess.file_exists(SETTINGS_PATH):
		var file: FileAccess = FileAccess.open(SETTINGS_PATH, FileAccess.READ)
		if file:
			var json: JSON = JSON.new()
			var err: Error = json.parse(file.get_as_text())
			file.close()
			if err == OK and json.data is Dictionary:
				_settings = _defaults.duplicate()
				_settings.merge(json.data, true)
			else:
				_settings = _defaults.duplicate()
		else:
			_settings = _defaults.duplicate()
	else:
		_settings = _defaults.duplicate()
	_apply_all_settings()

func save_settings() -> void:
	var file: FileAccess = FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_settings, "\t"))
		file.close()

func get_setting(key: String, default: Variant = null) -> Variant:
	if _settings.has(key):
		return _settings[key]
	if _defaults.has(key):
		return _defaults[key]
	return default

func set_setting(key: String, value: Variant) -> void:
	_settings[key] = value
	_apply_setting(key, value)
	settings_changed.emit()
	save_settings()

func _apply_all_settings() -> void:
	for key in _settings:
		_apply_setting(key, _settings[key])

func _apply_setting(key: String, value: Variant) -> void:
	match key:
		"master_volume":
			var idx: int = AudioServer.get_bus_index("Master")
			if idx >= 0:
				AudioServer.set_bus_volume_db(idx, linear_to_db(value))
				AudioServer.set_bus_mute(idx, value <= 0.0)
		"sfx_volume":
			var idx: int = AudioServer.get_bus_index("SFX")
			if idx >= 0:
				AudioServer.set_bus_volume_db(idx, linear_to_db(value))
				AudioServer.set_bus_mute(idx, value <= 0.0)
		"music_volume":
			var idx: int = AudioServer.get_bus_index("Music")
			if idx >= 0:
				AudioServer.set_bus_volume_db(idx, linear_to_db(value))
				AudioServer.set_bus_mute(idx, value <= 0.0)
		"fullscreen":
			if value:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
			else:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		"vsync":
			if value:
				DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED)
			else:
				DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
