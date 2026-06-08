extends Control

@onready var music_slider: HSlider = $Panel/VBoxContainer/MusicSlider
@onready var sfx_slider: HSlider = $Panel/VBoxContainer/SfxSlider
@onready var debug_toggle: CheckButton = $Panel/VBoxContainer/DebugToggle
@onready var close_button: Button = $Panel/VBoxContainer/CloseButton

func _ready() -> void:
	music_slider.value = _db_to_slider(AudioManager.get_music_volume())
	sfx_slider.value = _db_to_slider(AudioManager.get_sfx_volume())
	debug_toggle.button_pressed = DebugLogger.log_level == DebugLogger.LogLevel.DEBUG

	music_slider.value_changed.connect(_on_music_vol_changed)
	sfx_slider.value_changed.connect(_on_sfx_vol_changed)
	debug_toggle.toggled.connect(_on_debug_toggled)
	close_button.pressed.connect(_on_close)

	var debug_log_display = VBoxContainer.new()
	debug_log_display.name = "DebugLogDisplay"
	debug_log_display.set_anchors_preset(Control.PRESET_FULL_RECT)
	debug_log_display.offset_top = 200.0
	var log_title = Label.new()
	log_title.text = "调试日志"
	debug_log_display.add_child(log_title)
	var log_label = Label.new()
	log_label.name = "LogLabel"
	log_label.text = ""
	log_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	debug_log_display.add_child(log_label)
	add_child(debug_log_display)

func _slider_to_db(value: float) -> float:
	return (value / 100.0) * 40.0 - 40.0

func _db_to_slider(db: float) -> float:
	return ((db + 40.0) / 40.0) * 100.0

func _on_music_vol_changed(value: float) -> void:
	var db = _slider_to_db(value)
	AudioManager.set_music_volume(db)

func _on_sfx_vol_changed(value: float) -> void:
	var db = _slider_to_db(value)
	AudioManager.set_sfx_volume(db)

func _on_debug_toggled(pressed: bool) -> void:
	if pressed:
		DebugLogger.set_log_level(DebugLogger.LogLevel.DEBUG)
	else:
		DebugLogger.set_log_level(DebugLogger.LogLevel.INFO)

func _on_close() -> void:
	queue_free()
