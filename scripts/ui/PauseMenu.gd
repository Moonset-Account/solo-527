extends Control
## 暂停菜单面板

@onready var resume_button: Button = $Panel/VBoxContainer/ResumeButton
@onready var restart_button: Button = $Panel/VBoxContainer/RestartButton
@onready var settings_button: Button = $Panel/VBoxContainer/SettingsButton
@onready var level_select_button: Button = $Panel/VBoxContainer/LevelSelectButton
@onready var main_menu_button: Button = $Panel/VBoxContainer/MainMenuButton
@onready var title_label: Label = $Panel/VBoxContainer/TitleLabel

func _ready() -> void:
    _setup_buttons()
    if title_label:
        title_label.add_theme_font_size_override("font_size", 48)
        title_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if resume_button:
        resume_button.pressed.connect(_on_resume)
    if restart_button:
        restart_button.pressed.connect(_on_restart)
    if settings_button:
        settings_button.pressed.connect(_on_settings)
    if level_select_button:
        level_select_button.pressed.connect(_on_level_select)
    if main_menu_button:
        main_menu_button.pressed.connect(_on_main_menu)

func _setup_buttons() -> void:
    var buttons: Array = [resume_button, restart_button, settings_button, level_select_button, main_menu_button]
    for btn in buttons:
        if btn:
            var style_normal: StyleBoxFlat = StyleBoxFlat.new()
            style_normal.bg_color = Color(0.85, 0.7, 0.5)
            style_normal.corner_radius_top_left = 12
            style_normal.corner_radius_top_right = 12
            style_normal.corner_radius_bottom_left = 12
            style_normal.corner_radius_bottom_right = 12
            style_normal.content_margin_left = 40
            style_normal.content_margin_right = 40
            style_normal.content_margin_top = 16
            style_normal.content_margin_bottom = 16
            btn.add_theme_stylebox_override("normal", style_normal)
            var style_hover: StyleBoxFlat = style_normal.duplicate()
            style_hover.bg_color = Color(0.95, 0.8, 0.6)
            btn.add_theme_stylebox_override("hover", style_hover)
            var style_pressed: StyleBoxFlat = style_normal.duplicate()
            style_pressed.bg_color = Color(0.7, 0.55, 0.35)
            btn.add_theme_stylebox_override("pressed", style_pressed)
            btn.add_theme_font_size_override("font_size", 32)
            btn.add_theme_color_override("font_color", Color(0.3, 0.15, 0.05))
            btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func open() -> void:
    visible = true
    modulate.a = 0.0
    scale = Vector2(0.85, 0.85)
    var tween: Tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(self, "modulate:a", 1.0, 0.2)
    tween.tween_property(self, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func close() -> void:
    var tween: Tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(self, "modulate:a", 0.0, 0.15)
    tween.tween_property(self, "scale", Vector2(0.85, 0.85), 0.15)
    await tween.finished
    visible = false
    queue_free()

func _on_resume() -> void:
    AudioManager.play_sfx("click")
    GameState.resume_game()
    close()

func _on_restart() -> void:
    AudioManager.play_sfx("click")
    visible = false
    GameState.restart_level()

func _on_settings() -> void:
    AudioManager.play_sfx("click")
    GameState.resume_game()
    GameState.go_to_settings()

func _on_level_select() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_level_select()

func _on_main_menu() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_main_menu()
