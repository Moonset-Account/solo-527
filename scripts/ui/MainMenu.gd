extends CanvasLayer
## 主菜单 - 游戏入口界面

@onready var start_btn: Button = $VBox/StartButton
@onready var tutorial_btn: Button = $VBox/TutorialButton
@onready var settings_btn: Button = $VBox/SettingsButton
@onready var quit_btn: Button = $VBox/QuitButton
@onready var title_label: Label = $TitleLabel
@onready var subtitle_label: Label = $SubtitleLabel

func _ready() -> void:
	_connect_buttons()
	_animate_title()
	EventBus.emit_music_play("menu")
	SaveManager.load_settings()
	SaveManager.load_settings()

func _connect_buttons() -> void:
	if start_btn:
		start_btn.pressed.connect(_on_start_pressed)
		start_btn.mouse_entered.connect(_on_btn_mouse_entered)
	if tutorial_btn:
		tutorial_btn.pressed.connect(_on_tutorial_pressed)
		tutorial_btn.mouse_entered.connect(_on_btn_mouse_entered)
	if settings_btn:
		settings_btn.pressed.connect(_on_settings_pressed)
		settings_btn.mouse_entered.connect(_on_btn_mouse_entered)
	if quit_btn:
		quit_btn.pressed.connect(_on_quit_pressed)
		quit_btn.mouse_entered.connect(_on_btn_mouse_entered)

func _animate_title() -> void:
	if title_label:
		var tween := create_tween()
		tween.set_loops()
		tween.tween_property(title_label, "modulate:a", 0.85, 1.5)
		tween.tween_property(title_label, "modulate:a", 1.0, 1.5)

func _on_start_pressed() -> void:
	EventBus.emit_sfx_play("menu_confirm")
	GameManager.start_game()

func _on_tutorial_pressed() -> void:
	EventBus.emit_sfx_play("menu_confirm")
	GameManager.start_tutorial()

func _on_settings_pressed() -> void:
	EventBus.emit_sfx_play("menu_confirm")
	GameManager.open_settings_from_menu()
	get_tree().change_scene_to_file("res://scenes/ui/Settings.tscn")

func _on_quit_pressed() -> void:
	EventBus.emit_sfx_play("menu_cancel")
	get_tree().quit()

func _on_btn_mouse_entered() -> void:
	EventBus.emit_sfx_play("menu_move")

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ENTER or event.keycode == KEY_SPACE:
			_on_start_pressed()
