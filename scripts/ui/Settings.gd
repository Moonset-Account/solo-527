extends Control
## 设置页面

@onready var back_button: Button = $TopBar/BackButton
@onready var title_label: Label = $TopBar/TitleLabel
@onready var master_slider: HSlider = $Content/VBox/MasterContainer/MasterHBox/MasterSlider
@onready var master_value: Label = $Content/VBox/MasterContainer/MasterHBox/MasterValue
@onready var music_slider: HSlider = $Content/VBox/MusicContainer/MusicHBox/MusicSlider
@onready var music_value: Label = $Content/VBox/MusicContainer/MusicHBox/MusicValue
@onready var sfx_slider: HSlider = $Content/VBox/SfxContainer/SfxHBox/SfxSlider
@onready var sfx_value: Label = $Content/VBox/SfxContainer/SfxHBox/SfxValue
@onready var vibration_switch: CheckBox = $Content/VBox/VibrationContainer/VibrationSwitch
@onready var hints_switch: CheckBox = $Content/VBox/HintsContainer/HintsSwitch
@onready var reset_button: Button = $Content/VBox/ResetButton
@onready var credits_label: Label = $Content/VBox/CreditsLabel

func _ready() -> void:
    _setup_ui()
    _load_settings()
    _connect_signals()

func _setup_ui() -> void:
    if title_label:
        title_label.add_theme_font_size_override("font_size", 48)
        title_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if credits_label:
        credits_label.add_theme_font_size_override("font_size", 22)
        credits_label.add_theme_color_override("font_color", Color(0.5, 0.4, 0.3))
        credits_label.text = "搬家装箱 v1.0.0\nGodot 4.2 开发\n感谢游玩！"
    var labels: Dictionary = {
        "MasterLabel": $Content/VBox/MasterContainer/MasterLabel,
        "MusicLabel": $Content/VBox/MusicContainer/MusicLabel,
        "SfxLabel": $Content/VBox/SfxContainer/SfxLabel,
        "VibrationLabel": $Content/VBox/VibrationContainer/VibrationLabel,
        "HintsLabel": $Content/VBox/HintsContainer/HintsLabel
    }
    for ref in labels.values():
        if ref:
            ref.add_theme_font_size_override("font_size", 30)
            ref.add_theme_color_override("font_color", Color(0.3, 0.2, 0.1))
    if back_button:
        _style_button_small(back_button)
    if reset_button:
        _style_button(reset_button)
        reset_button.add_theme_color_override("font_color", Color(0.8, 0.2, 0.2))
    for slider in [master_slider, music_slider, sfx_slider]:
        if slider:
            slider.min_value = 0.0
            slider.max_value = 1.0
            slider.step = 0.01

func _style_button(btn: Button) -> void:
    var style_normal: StyleBoxFlat = StyleBoxFlat.new()
    style_normal.bg_color = Color(0.9, 0.7, 0.5)
    style_normal.corner_radius_top_left = 12
    style_normal.corner_radius_top_right = 12
    style_normal.corner_radius_bottom_left = 12
    style_normal.corner_radius_bottom_right = 12
    style_normal.content_margin_left = 28
    style_normal.content_margin_right = 28
    style_normal.content_margin_top = 14
    style_normal.content_margin_bottom = 14
    btn.add_theme_stylebox_override("normal", style_normal)
    var style_hover: StyleBoxFlat = style_normal.duplicate()
    style_hover.bg_color = Color(0.95, 0.8, 0.6)
    btn.add_theme_stylebox_override("hover", style_hover)
    btn.add_theme_font_size_override("font_size", 28)
    btn.add_theme_color_override("font_color", Color(0.3, 0.15, 0.05))
    btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _style_button_small(btn: Button) -> void:
    var style_normal: StyleBoxFlat = StyleBoxFlat.new()
    style_normal.bg_color = Color(0.6, 0.5, 0.4)
    style_normal.corner_radius_top_left = 12
    style_normal.corner_radius_top_right = 12
    style_normal.corner_radius_bottom_left = 12
    style_normal.corner_radius_bottom_right = 12
    style_normal.content_margin_left = 20
    style_normal.content_margin_right = 20
    style_normal.content_margin_top = 12
    style_normal.content_margin_bottom = 12
    btn.add_theme_stylebox_override("normal", style_normal)
    var style_hover: StyleBoxFlat = style_normal.duplicate()
    style_hover.bg_color = Color(0.7, 0.6, 0.5)
    btn.add_theme_stylebox_override("hover", style_hover)
    btn.add_theme_font_size_override("font_size", 28)
    btn.add_theme_color_override("font_color", Color.WHITE)
    btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _load_settings() -> void:
    var s: Dictionary = SaveSystem.settings_data
    if master_slider:
        master_slider.value = s.get("master_volume", 0.8)
    if master_value:
        master_value.text = "%d%%" % int(float(master_slider.value) * 100)
    if music_slider:
        music_slider.value = s.get("music_volume", 0.6)
    if music_value:
        music_value.text = "%d%%" % int(float(music_slider.value) * 100)
    if sfx_slider:
        sfx_slider.value = s.get("sfx_volume", 0.8)
    if sfx_value:
        sfx_value.text = "%d%%" % int(float(sfx_slider.value) * 100)
    if vibration_switch:
        vibration_switch.button_pressed = s.get("vibration_enabled", true)
    if hints_switch:
        hints_switch.button_pressed = s.get("show_hints", true)

func _connect_signals() -> void:
    if back_button:
        back_button.pressed.connect(_on_back_pressed)
    if master_slider:
        master_slider.value_changed.connect(_on_master_changed)
    if music_slider:
        music_slider.value_changed.connect(_on_music_changed)
    if sfx_slider:
        sfx_slider.value_changed.connect(_on_sfx_changed)
    if vibration_switch:
        vibration_switch.toggled.connect(_on_vibration_toggled)
    if hints_switch:
        hints_switch.toggled.connect(_on_hints_toggled)
    if reset_button:
        reset_button.pressed.connect(_on_reset_pressed)

func _on_master_changed(value: float) -> void:
    if master_value:
        master_value.text = "%d%%" % int(value * 100)
    AudioManager.set_master_volume(value)

func _on_music_changed(value: float) -> void:
    if music_value:
        music_value.text = "%d%%" % int(value * 100)
    AudioManager.set_music_volume(value)

func _on_sfx_changed(value: float) -> void:
    if sfx_value:
        sfx_value.text = "%d%%" % int(value * 100)
    AudioManager.set_sfx_volume(value)
    AudioManager.play_sfx("click")

func _on_vibration_toggled(pressed: bool) -> void:
    SaveSystem.settings_data["vibration_enabled"] = pressed
    SaveSystem.save_settings()

func _on_hints_toggled(pressed: bool) -> void:
    SaveSystem.settings_data["show_hints"] = pressed
    SaveSystem.save_settings()

func _on_reset_pressed() -> void:
    AudioManager.play_sfx("click")
    UIManager.confirm_dialog(
        "重置存档",
        "确定要重置所有进度吗？\n关卡、分数、成就都将清空！此操作不可撤销。",
        Callable(self, "_confirm_reset")
    )

func _confirm_reset() -> void:
    SaveSystem.reset_all()
    UIManager.show_toast("存档已重置！")

func _on_back_pressed() -> void:
    AudioManager.play_sfx("click")
    var prev: int = GameState.previous_state
    if prev == GameState.GAME_PAUSED or prev == GameState.GAME_PLAYING or prev == GameState.GAME_RESULT:
        GameState.resume_game()
        GameState.change_state(GameState.GAME_PLAYING)
        SceneManager.change_scene("game")
    else:
        GameState.go_to_main_menu()
