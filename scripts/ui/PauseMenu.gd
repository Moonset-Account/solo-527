extends CanvasLayer
## 暂停菜单 - 游戏内暂停界面

@onready var resume_btn: Button = $Panel/VBox/ResumeButton
@onready var settings_btn: Button = $Panel/VBox/SettingsButton
@onready var restart_seg_btn: Button = $Panel/VBox/RestartSegButton
@onready var menu_btn: Button = $Panel/VBox/MenuButton
@onready var title_label: Label = $Panel/TitleLabel
@onready var panel: PanelContainer = $Panel

func _ready() -> void:
	_connect_events()
	process_mode = Node.PROCESS_MODE_ALWAYS
	panel.visible = false

func _connect_events() -> void:
	EventBus.game_paused.connect(_on_game_paused)
	EventBus.game_resumed.connect(_on_game_resumed)
	if resume_btn:
		resume_btn.pressed.connect(_on_resume_pressed)
		resume_btn.mouse_entered.connect(_on_btn_mouse_entered)
	if settings_btn:
		settings_btn.pressed.connect(_on_settings_pressed)
		settings_btn.mouse_entered.connect(_on_btn_mouse_entered)
	if restart_seg_btn:
		restart_seg_btn.pressed.connect(_on_restart_seg_pressed)
		restart_seg_btn.mouse_entered.connect(_on_btn_mouse_entered)
	if menu_btn:
		menu_btn.pressed.connect(_on_menu_pressed)
		menu_btn.mouse_entered.connect(_on_btn_mouse_entered)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if GameManager.current_state == GameManager.GameState.PAUSED:
			GameManager.resume_game()

func _on_game_paused() -> void:
	panel.visible = true
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.8, 0.8)
	var tween := create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_QUAD)
	tween.tween_property(panel, "modulate:a", 1.0, 0.2)
	tween.parallel().tween_property(panel, "scale", Vector2(1.0, 1.0), 0.2)

func _on_game_resumed() -> void:
	var tween := create_tween()
	tween.set_ease(Tween.EASE_IN)
	tween.tween_property(panel, "modulate:a", 0.0, 0.15)
	tween.parallel().tween_property(panel, "scale", Vector2(0.85, 0.85), 0.15)
	tween.tween_callback(panel.set_visible.bind(false))

func _on_resume_pressed() -> void:
	EventBus.emit_sfx_play("menu_confirm")
	GameManager.resume_game()

func _on_settings_pressed() -> void:
	EventBus.emit_sfx_play("menu_confirm")
	var settings_scene := load("res://scenes/ui/Settings.tscn")
	var settings_inst := settings_scene.instantiate()
	settings_inst.name = "SettingsOverlay"
	settings_inst.add_to_group("settings_overlay")
	add_child(settings_inst)

func _on_restart_seg_pressed() -> void:
	EventBus.emit_sfx_play("menu_confirm")
	GameManager.resume_game()
	EventBus.emit_segment_reset()
	EventBus.emit_ui_toast("已重置当前段", 1.5)

func _on_menu_pressed() -> void:
	EventBus.emit_sfx_play("menu_cancel")
	GameManager.return_to_menu()

func _on_btn_mouse_entered() -> void:
	EventBus.emit_sfx_play("menu_move")
