extends Control
## SettingsPanel - 设置页面

@onready var sld_master: HSlider = $Panel/VBox/VolumeSection/MasterSlider
@onready var sld_music: HSlider = $Panel/VBox/VolumeSection/MusicSlider
@onready var sld_sfx: HSlider = $Panel/VBox/VolumeSection/SfxSlider
@onready var lbl_master_val: Label = $Panel/VBox/VolumeSection/MasterVal
@onready var lbl_music_val: Label = $Panel/VBox/VolumeSection/MusicVal
@onready var lbl_sfx_val: Label = $Panel/VBox/VolumeSection/SfxVal
@onready var chk_fullscreen: CheckBox = $Panel/VBox/DisplaySection/FullscreenCheck
@onready var chk_showfps: CheckBox = $Panel/VBox/DisplaySection/FpsCheck
@onready var chk_pixel: CheckBox = $Panel/VBox/DisplaySection/PixelCheck
@onready var btn_back: Button = $Panel/VBox/BackButton
@onready var btn_reset: Button = $Panel/VBox/ResetButton
@onready var btn_playtest_info: Button = $Panel/VBox/PlaytestInfo
@onready var lbl_playtest: Label = $Panel/VBox/PlaytestLabel

var _last_scene: String = "MainMenu"

func _ready() -> void:
	_load_settings()
	_connect_signals()
	_update_labels()
	_update_playtest_info()

func receive_scene_data(data: Dictionary) -> void:
	_last_scene = data.get("from", _last_scene)

func _load_settings() -> void:
	var s: Dictionary = SaveSystem.load_settings()
	sld_master.value = s.get("master_volume", 0.8)
	sld_music.value = s.get("music_volume", 0.6)
	sld_sfx.value = s.get("sfx_volume", 0.9)
	AudioManager.set_volume("master", s.get("master_volume", 0.8))
	AudioManager.set_volume("music", s.get("music_volume", 0.6))
	AudioManager.set_volume("sfx", s.get("sfx_volume", 0.9))
	chk_fullscreen.button_pressed = s.get("fullscreen", false)
	chk_showfps.button_pressed = s.get("show_fps", false)
	chk_pixel.button_pressed = s.get("pixel_perfect", true)
	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if s.get("fullscreen") else DisplayServer.WINDOW_MODE_WINDOWED)
	Engine.set_meta("show_fps", s.get("show_fps", false))

func _connect_signals() -> void:
	sld_master.value_changed.connect(_on_master_changed)
	sld_music.value_changed.connect(_on_music_changed)
	sld_sfx.value_changed.connect(_on_sfx_changed)
	chk_fullscreen.toggled.connect(_on_fullscreen_toggled)
	chk_showfps.toggled.connect(_on_showfps_toggled)
	chk_pixel.toggled.connect(_on_pixel_toggled)
	btn_back.pressed.connect(_on_back)
	btn_reset.pressed.connect(_on_reset)
	btn_playtest_info.pressed.connect(_on_playtest_info)
	for b in [btn_back, btn_reset, btn_playtest_info]:
		b.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func _update_labels() -> void:
	lbl_master_val.text = "%d%%" % int(sld_master.value * 100)
	lbl_music_val.text = "%d%%" % int(sld_music.value * 100)
	lbl_sfx_val.text = "%d%%" % int(sld_sfx.value * 100)

func _on_master_changed(val: float) -> void:
	AudioManager.set_volume("master", val)
	_update_labels()
	_save_volumes()
	PlaytestRecorder.record_setting_change("master_volume", AudioManager.master_volume, val)

func _on_music_changed(val: float) -> void:
	AudioManager.set_volume("music", val)
	_update_labels()
	_save_volumes()

func _on_sfx_changed(val: float) -> void:
	AudioManager.set_volume("sfx", val)
	_update_labels()
	_save_volumes()
	AudioManager.play_sfx("coin")

func _save_volumes() -> void:
	var s: Dictionary = SaveSystem.load_settings()
	s["master_volume"] = sld_master.value
	s["music_volume"] = sld_music.value
	s["sfx_volume"] = sld_sfx.value
	SaveSystem.save_settings(s)

func _on_fullscreen_toggled(pressed: bool) -> void:
	AudioManager.play_sfx("click")
	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if pressed else DisplayServer.WINDOW_MODE_WINDOWED)
	_save_bool_setting("fullscreen", pressed)
	PlaytestRecorder.record_setting_change("fullscreen", not pressed, pressed)

func _on_showfps_toggled(pressed: bool) -> void:
	AudioManager.play_sfx("click")
	Engine.set_meta("show_fps", pressed)
	_save_bool_setting("show_fps", pressed)

func _on_pixel_toggled(pressed: bool) -> void:
	AudioManager.play_sfx("click")
	_save_bool_setting("pixel_perfect", pressed)
	var vs := get_viewport()
	if vs:
		vs.snap_2d_transforms_to_pixel = pressed
		vs.snap_2d_vertices_to_pixel = pressed

func _save_bool_setting(key: String, value: bool) -> void:
	var s: Dictionary = SaveSystem.load_settings()
	s[key] = value
	SaveSystem.save_settings(s)

func _on_back() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("back", "Settings")
	SceneManager.change_scene(_last_scene)

func _on_reset() -> void:
	AudioManager.play_sfx("click")
	sld_master.value = 0.8
	sld_music.value = 0.6
	sld_sfx.value = 0.9
	_on_master_changed(0.8)
	_on_music_changed(0.6)
	_on_sfx_changed(0.9)
	_save_volumes()

func _on_playtest_info() -> void:
	AudioManager.play_sfx("click")
	_update_playtest_info()

func _update_playtest_info() -> void:
	var summary: Dictionary = PlaytestRecorder.get_summary()
	var events: Array = PlaytestRecorder.get_events()
	var t: String = ""
	t += "会话ID: %s\n" % summary.get("session_id", "-")
	t += "游戏时长: %d 秒 (暂停 %d 秒)\n" % [summary.get("elapsed_seconds", 0), summary.get("paused_seconds", 0)]
	t += "订单: 完成 %d / 失败 %d (失败率 %d%%)\n" % [
		summary.get("orders_completed", 0), summary.get("orders_failed", 0),
		int(summary.get("failure_rate", 0.0) * 100)
	]
	t += "机器放置: %d 台 | 关键决策: %d 次\n" % [summary.get("machines_placed_count", 0), summary.get("key_decisions_count", 0)]
	t += "当前金币: %d | 等级: %d | 事件记录: %d 条" % [summary.get("money", 0), summary.get("level", 0), summary.get("event_count", 0)]
	lbl_playtest.text = t
	lbl_playtest.modulate = Color(0.85, 0.95, 1.0)
