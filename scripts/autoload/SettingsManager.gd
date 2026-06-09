extends Node
## 设置管理器 - 游戏设置持久化，音量/显示/输入等

signal settings_changed(category: String, key: String, value)

const SAVE_PATH := "user://settings.cfg"

var settings_data: Dictionary = {
	"audio": {
		"master_volume": 0.8,
		"sfx_volume": 0.8,
		"music_volume": 0.6,
		"voice_volume": 1.0,
	},
	"display": {
		"fullscreen": false,
		"vsync": true,
		"resolution_index": 0,
		"text_scale": 1.0,
		"particle_quality": "high",
	},
	"gameplay": {
		"auto_end_turn": false,
		"card_anim_speed": 1.0,
		"damage_number_speed": 1.0,
		"hints_enabled": true,
	},
	"input": {
		"vibration_enabled": true,
		"deadzone": 0.25,
		"touch_sensitivity": 1.0,
	},
}

var resolutions: Array = [
	Vector2i(1280, 720),
	Vector2i(1920, 1080),
	Vector2i(2560, 1440),
	Vector2i(3840, 2160),
]

func _ready() -> void:
	_load_settings()
	_apply_all_settings()

func get_value(category: String, key: String, default = null):
	if category in settings_data and key in settings_data[category]:
		return settings_data[category][key]
	return default

func set_value(category: String, key: String, value, persist: bool = true) -> void:
	if not category in settings_data:
		settings_data[category] = {}
	settings_data[category][key] = value
	_apply_setting(category, key, value)
	settings_changed.emit(category, key, value)
	if persist:
		save_settings()

func _apply_all_settings() -> void:
	for cat in settings_data.keys():
		for key in settings_data[cat].keys():
			_apply_setting(cat, key, settings_data[cat][key])

func _apply_setting(category: String, key: String, value) -> void:
	match category:
		"audio":
			var bus_idx: int = 0
			match key:
				"master_volume": bus_idx = AudioServer.get_bus_index("Master")
				"sfx_volume": bus_idx = AudioServer.get_bus_index("SFX")
				"music_volume": bus_idx = AudioServer.get_bus_index("Music")
				"voice_volume": bus_idx = AudioServer.get_bus_index("Voice")
			if bus_idx >= 0:
				var vol_linear: float = clamp(float(value), 0.0, 1.0)
				AudioServer.set_bus_volume_db(bus_idx, linear_to_db(vol_linear))
		"display":
			match key:
				"fullscreen":
					DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if value else DisplayServer.WINDOW_MODE_WINDOWED)
				"vsync":
					DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if value else DisplayServer.VSYNC_DISABLED)
				"resolution_index":
					var idx: int = int(clamp(value, 0, resolutions.size() - 1))
					var res: Vector2i = resolutions[idx]
					DisplayServer.window_set_size(res)
				"text_scale":
					pass

func reset_defaults() -> void:
	settings_data = {
		"audio": { "master_volume": 0.8, "sfx_volume": 0.8, "music_volume": 0.6, "voice_volume": 1.0 },
		"display": { "fullscreen": false, "vsync": true, "resolution_index": 0, "text_scale": 1.0, "particle_quality": "high" },
		"gameplay": { "auto_end_turn": false, "card_anim_speed": 1.0, "damage_number_speed": 1.0, "hints_enabled": true },
		"input": { "vibration_enabled": true, "deadzone": 0.25, "touch_sensitivity": 1.0 },
	}
	_apply_all_settings()
	save_settings()

func save_settings() -> void:
	var f: ConfigFile = ConfigFile.new()
	for cat in settings_data.keys():
		for key in settings_data[cat].keys():
			f.set_value(cat, key, settings_data[cat][key])
	f.save(SAVE_PATH)

func _load_settings() -> void:
	var f: ConfigFile = ConfigFile.new()
	if f.load(SAVE_PATH) == OK:
		for cat in settings_data.keys():
			for key in settings_data[cat].keys():
				if f.has_section_key(cat, key):
					settings_data[cat][key] = f.get_value(cat, key, settings_data[cat][key])

func linear_to_db(linear: float) -> float:
	if linear <= 0.0:
		return -80.0
	return 20.0 * log(linear) / log(10.0)
