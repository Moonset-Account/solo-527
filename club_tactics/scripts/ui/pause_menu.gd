class_name PauseMenu
extends Control

signal resume_requested()

var _resume_button: Button = null
var _settings_button: Button = null
var _restart_button: Button = null
var _quit_button: Button = null
var _overlay: ColorRect = null
var _settings_panel: PanelContainer = null
var _settings_visible: bool = false
var _master_label: Label = null
var _bgm_label: Label = null
var _sfx_label: Label = null
var _master_slider: HSlider = null
var _bgm_slider: HSlider = null
var _sfx_slider: HSlider = null
var _settings_back: Button = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_overlay = ColorRect.new()
	_overlay.color = Color(0, 0, 0, 0.6)
	_overlay.size = Vector2(1280, 720)
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_overlay)

	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.position = Vector2(490, 200)
	vbox.add_theme_constant_override("separation", 16)
	add_child(vbox)

	_resume_button = Button.new()
	_resume_button.text = "继续游戏"
	_resume_button.custom_minimum_size = Vector2(300, 50)
	_resume_button.process_mode = Node.PROCESS_MODE_ALWAYS
	vbox.add_child(_resume_button)

	_settings_button = Button.new()
	_settings_button.text = "设置"
	_settings_button.custom_minimum_size = Vector2(300, 50)
	_settings_button.process_mode = Node.PROCESS_MODE_ALWAYS
	vbox.add_child(_settings_button)

	_restart_button = Button.new()
	_restart_button.text = "重新开始"
	_restart_button.custom_minimum_size = Vector2(300, 50)
	_restart_button.process_mode = Node.PROCESS_MODE_ALWAYS
	vbox.add_child(_restart_button)

	_quit_button = Button.new()
	_quit_button.text = "返回主菜单"
	_quit_button.custom_minimum_size = Vector2(300, 50)
	_quit_button.process_mode = Node.PROCESS_MODE_ALWAYS
	vbox.add_child(_quit_button)

	_resume_button.pressed.connect(_on_resume)
	_settings_button.pressed.connect(_on_settings)
	_restart_button.pressed.connect(_on_restart)
	_quit_button.pressed.connect(_on_quit)

	_build_settings_panel()

	visible = false

func _build_settings_panel() -> void:
	_settings_panel = PanelContainer.new()
	_settings_panel.position = Vector2(340, 120)
	_settings_panel.size = Vector2(600, 480)
	_settings_panel.visible = false
	_settings_panel.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(_settings_panel)

	var inner: VBoxContainer = VBoxContainer.new()
	inner.add_theme_constant_override("separation", 12)
	_settings_panel.add_child(inner)

	var title: Label = Label.new()
	title.text = "设置"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	inner.add_child(title)

	_master_label = Label.new()
	_master_label.text = "主音量: 100%"
	inner.add_child(_master_label)
	_master_slider = HSlider.new()
	_master_slider.min_value = 0.0
	_master_slider.max_value = 100.0
	_master_slider.value = 100.0
	_master_slider.custom_minimum_size = Vector2(500, 30)
	_master_slider.value_changed.connect(_on_master_changed)
	inner.add_child(_master_slider)

	_bgm_label = Label.new()
	_bgm_label.text = "背景音乐: 70%"
	inner.add_child(_bgm_label)
	_bgm_slider = HSlider.new()
	_bgm_slider.min_value = 0.0
	_bgm_slider.max_value = 100.0
	_bgm_slider.value = 70.0
	_bgm_slider.custom_minimum_size = Vector2(500, 30)
	_bgm_slider.value_changed.connect(_on_bgm_changed)
	inner.add_child(_bgm_slider)

	_sfx_label = Label.new()
	_sfx_label.text = "音效: 100%"
	inner.add_child(_sfx_label)
	_sfx_slider = HSlider.new()
	_sfx_slider.min_value = 0.0
	_sfx_slider.max_value = 100.0
	_sfx_slider.value = 100.0
	_sfx_slider.custom_minimum_size = Vector2(500, 30)
	_sfx_slider.value_changed.connect(_on_sfx_changed)
	inner.add_child(_sfx_slider)

	_settings_back = Button.new()
	_settings_back.text = "返回暂停菜单"
	_settings_back.custom_minimum_size = Vector2(200, 45)
	_settings_back.process_mode = Node.PROCESS_MODE_ALWAYS
	_settings_back.pressed.connect(_on_settings_back)
	inner.add_child(_settings_back)

func show_pause() -> void:
	visible = true
	_settings_visible = false
	_settings_panel.visible = false
	GameManager.change_state(GameManager.GameState.PAUSED)
	get_tree().paused = true

func hide_pause() -> void:
	visible = false
	_settings_panel.visible = false
	_settings_visible = false
	GameManager.change_state(GameManager.GameState.PLAYING)
	get_tree().paused = false
	resume_requested.emit()

func _on_resume() -> void:
	hide_pause()

func _on_settings() -> void:
	_settings_visible = true
	_settings_panel.visible = true

func _on_settings_back() -> void:
	_settings_visible = false
	_settings_panel.visible = false

func _on_restart() -> void:
	get_tree().paused = false
	GameManager.reset_run()
	SceneManager.change_scene("res://scenes/game.tscn")

func _on_quit() -> void:
	get_tree().paused = false
	GameManager.reset_run()
	SceneManager.change_scene("res://scenes/main_menu.tscn")

func _on_master_changed(value: float) -> void:
	_master_label.text = "主音量: %d%%" % int(value)
	AudioManager.set_master_volume(value / 100.0)

func _on_bgm_changed(value: float) -> void:
	_bgm_label.text = "背景音乐: %d%%" % int(value)
	AudioManager.set_bgm_volume(value / 100.0)

func _on_sfx_changed(value: float) -> void:
	_sfx_label.text = "音效: %d%%" % int(value)
	AudioManager.set_sfx_volume(value / 100.0)

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		if _settings_visible:
			_on_settings_back()
		elif visible:
			hide_pause()
		elif GameManager.current_state == GameManager.GameState.PLAYING:
			show_pause()
