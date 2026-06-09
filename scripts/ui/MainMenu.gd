extends Control
## 主菜单界面

@onready var play_button: Button = $CenterContainer/VBoxContainer/PlayButton
@onready var daily_button: Button = $CenterContainer/VBoxContainer/DailyButton
@onready var level_select_button: Button = $CenterContainer/VBoxContainer/LevelSelectButton
@onready var tutorial_button: Button = $CenterContainer/VBoxContainer2/TutorialButton
@onready var achievements_button: Button = $CenterContainer/VBoxContainer2/AchievementsButton
@onready var settings_button: Button = $CenterContainer/VBoxContainer2/SettingsButton
@onready var version_label: Label = $VersionLabel
@onready var title_label: Label = $TitleContainer/TitleLabel
@onready var subtitle_label: Label = $TitleContainer/SubtitleLabel
@onready var stats_label: Label = $StatsLabel
@onready var bg_particles: GPUParticles2D = $Background/Particles

func _ready() -> void:
    _setup_buttons()
    _setup_ui()
    _update_stats()
    _play_music()
    _setup_bg_animation()

func _setup_buttons() -> void:
    if play_button:
        play_button.pressed.connect(_on_play_pressed)
    if daily_button:
        daily_button.pressed.connect(_on_daily_pressed)
    if level_select_button:
        level_select_button.pressed.connect(_on_level_select_pressed)
    if tutorial_button:
        tutorial_button.pressed.connect(_on_tutorial_pressed)
    if achievements_button:
        achievements_button.pressed.connect(_on_achievements_pressed)
    if settings_button:
        settings_button.pressed.connect(_on_settings_pressed)
    var buttons: Array[Button] = [play_button, daily_button, level_select_button, tutorial_button, achievements_button, settings_button]
    for btn in buttons:
        if btn:
            _style_button(btn)

func _style_button(btn: Button) -> void:
    var style_normal: StyleBoxFlat = StyleBoxFlat.new()
    style_normal.bg_color = Color(0.95, 0.8, 0.5)
    style_normal.corner_radius_top_left = 16
    style_normal.corner_radius_top_right = 16
    style_normal.corner_radius_bottom_left = 16
    style_normal.corner_radius_bottom_right = 16
    style_normal.content_margin_left = 32
    style_normal.content_margin_right = 32
    style_normal.content_margin_top = 20
    style_normal.content_margin_bottom = 20
    btn.add_theme_stylebox_override("normal", style_normal)
    var style_hover: StyleBoxFlat = style_normal.duplicate()
    style_hover.bg_color = Color(1.0, 0.85, 0.55)
    btn.add_theme_stylebox_override("hover", style_hover)
    var style_pressed: StyleBoxFlat = style_normal.duplicate()
    style_pressed.bg_color = Color(0.85, 0.7, 0.4)
    btn.add_theme_stylebox_override("pressed", style_pressed)
    btn.add_theme_font_size_override("font_size", 36)
    btn.add_theme_color_override("font_color", Color(0.2, 0.1, 0.05))
    btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _setup_ui() -> void:
    if title_label:
        title_label.add_theme_font_size_override("font_size", 96)
        title_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if subtitle_label:
        subtitle_label.add_theme_font_size_override("font_size", 32)
        subtitle_label.add_theme_color_override("font_color", Color(0.5, 0.35, 0.2))
    if version_label:
        version_label.add_theme_font_size_override("font_size", 20)
        version_label.add_theme_color_override("font_color", Color(0.5, 0.4, 0.3))
        version_label.text = "v1.0.0"
    if stats_label:
        stats_label.add_theme_font_size_override("font_size", 24)
        stats_label.add_theme_color_override("font_color", Color(0.4, 0.3, 0.2))

func _update_stats() -> void:
    if stats_label:
        var total_stars: int = SaveSystem.get_total_stars()
        var total_score: int = int(SaveSystem.save_data.get("total_score", 0))
        var games: int = int(SaveSystem.save_data.get("games_played", 0))
        stats_label.text = "⭐ %d   总分: %d   游戏: %d" % [total_stars, total_score, games]

func _play_music() -> void:
    AudioManager.play_music("menu_music")

func _setup_bg_animation() -> void:
    if not bg_particles:
        return
    var tween: Tween = create_tween()
    tween.set_loops()
    if title_label:
        tween.tween_property(title_label, "position:y", -5, 2.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
        tween.tween_property(title_label, "position:y", 0, 2.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func _on_play_pressed() -> void:
    AudioManager.play_sfx("click")
    GameState.start_level(1)
    SceneManager.change_scene("game")

func _on_daily_pressed() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_daily_challenge()

func _on_level_select_pressed() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_level_select()

func _on_tutorial_pressed() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_tutorial()

func _on_achievements_pressed() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_achievements()

func _on_settings_pressed() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_settings()
