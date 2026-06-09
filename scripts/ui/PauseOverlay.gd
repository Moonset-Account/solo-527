extends CanvasLayer
## PauseOverlay - 暂停菜单

@onready var btn_resume: Button = $Overlay/Panel/VBox/ButtonResume
@onready var btn_settings: Button = $Overlay/Panel/VBox/ButtonSettings
@onready var btn_save: Button = $Overlay/Panel/VBox/ButtonSave
@onready var btn_menu: Button = $Overlay/Panel/VBox/ButtonMenu
@onready var btn_restart: Button = $Overlay/Panel/VBox/ButtonRestart
@onready var lbl_pause_title: Label = $Overlay/Panel/VBox/Title

func initialize() -> void:
	_connect_buttons()
	visible = false

func _connect_buttons() -> void:
	btn_resume.pressed.connect(_on_resume)
	btn_settings.pressed.connect(_on_settings)
	btn_save.pressed.connect(_on_save)
	btn_menu.pressed.connect(_on_menu)
	btn_restart.pressed.connect(_on_restart)
	for b in [btn_resume, btn_settings, btn_save, btn_menu, btn_restart]:
		b.mouse_entered.connect(func(): AudioManager.play_sfx("button_hover"))

func _on_resume() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("resume", "PauseOverlay")
	if get_tree().current_scene and get_tree().current_scene.has_method("toggle_pause"):
		get_tree().current_scene.toggle_pause()

func _on_settings() -> void:
	AudioManager.play_sfx("click")
	SceneManager.change_scene("Settings")

func _on_save() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("save", "PauseOverlay")
	if SaveSystem.save_game():
		_show_toast("存档成功")
	else:
		_show_toast("存档失败")

func _on_menu() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("menu", "PauseOverlay")
	GameState.is_paused = false
	if get_tree().current_scene and get_tree().current_scene.has_method("exit_to_menu"):
		get_tree().current_scene.exit_to_menu()

func _on_restart() -> void:
	AudioManager.play_sfx("click")
	PlaytestRecorder.record_ui_click("restart", "PauseOverlay")
	GameState.is_paused = false
	if get_tree().current_scene and get_tree().current_scene.has_method("retry_level"):
		get_tree().current_scene.retry_level()

func _show_toast(text: String) -> void:
	var toast := Label.new()
	toast.text = text
	toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.offset_left = 500
	toast.offset_right = 780
	toast.offset_top = 400
	toast.offset_bottom = 440
	toast.modulate = Color(0.1, 0.9, 0.3, 1.0)
	toast.z_index = 100
	toast.add_theme_font_size_override("font_size", 20)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0.85)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	var pc := PanelContainer.new()
	pc.offset_left = 480
	pc.offset_right = 800
	pc.offset_top = 380
	pc.offset_bottom = 460
	pc.z_index = 100
	pc.add_theme_stylebox_override("panel", style)
	pc.add_child(toast)
	add_child(pc)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(pc, "modulate:a", 1.0, 0.15)
	tween.tween_interval(1.0)
	tween.tween_property(pc, "modulate:a", 0.0, 0.4)
	tween.finished.connect(func():
		if is_instance_valid(pc):
			pc.queue_free()
	)
