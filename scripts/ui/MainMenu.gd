extends Control

var title_label: Label
var start_button: Button
var levels_button: Button
var settings_button: Button
var quit_button: Button
var version_label: Label
var input_mode_label: Label

var _current_focus_index: int = 0
var _menu_buttons: Array = []

func _ready() -> void:
    anchor_right = 1.0
    anchor_bottom = 1.0
    
    if not _is_children_ready():
        _build_ui()
    
    _menu_buttons = [start_button, levels_button, settings_button, quit_button]
    _connect_signals()
    _update_input_mode_label()
    
    EventBus.on_event("input_mode_changed", _on_input_mode_changed)
    UIState.set_context(UIState.UIContext.MAIN_MENU)
    
    if _menu_buttons.size() > 0:
        _menu_buttons[0].grab_focus()

func _is_children_ready() -> bool:
    return title_label != null and start_button != null

func _build_ui() -> void:
    var bg = ColorRect.new()
    bg.color = Color(0.1, 0.25, 0.15)
    bg.anchor_right = 1.0
    bg.anchor_bottom = 1.0
    bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(bg)
    
    var decor_top = ColorRect.new()
    decor_top.color = Color(0.6, 0.4, 0.2, 0.3)
    decor_top.anchor_right = 1.0
    decor_top.offset_bottom = 80
    decor_top.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(decor_top)
    
    title_label = Label.new()
    title_label.text = "🏪 小镇集市经营模拟"
    title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    title_label.anchor_left = 0.5
    title_label.anchor_top = 0.15
    title_label.anchor_right = 0.5
    title_label.anchor_bottom = 0.15
    title_label.offset_left = -300
    title_label.offset_right = 300
    title_label.offset_top = -40
    title_label.offset_bottom = 40
    title_label.add_theme_font_size_override("font_size", 48)
    title_label.modulate = Color(1, 0.95, 0.8)
    add_child(title_label)
    
    var subtitle = Label.new()
    subtitle.text = "采购 · 定价 · 销售 · 升级"
    subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    subtitle.anchor_left = 0.5
    subtitle.anchor_top = 0.25
    subtitle.anchor_right = 0.5
    subtitle.anchor_bottom = 0.25
    subtitle.offset_left = -200
    subtitle.offset_right = 200
    subtitle.offset_top = -15
    subtitle.offset_bottom = 15
    subtitle.add_theme_font_size_override("font_size", 20)
    subtitle.modulate = Color(0.9, 0.85, 0.7)
    add_child(subtitle)
    
    var menu_panel = PanelContainer.new()
    menu_panel.anchor_left = 0.5
    menu_panel.anchor_top = 0.45
    menu_panel.anchor_right = 0.5
    menu_panel.anchor_bottom = 0.45
    menu_panel.offset_left = -180
    menu_panel.offset_right = 180
    menu_panel.offset_top = -50
    menu_panel.offset_bottom = 250
    add_child(menu_panel)
    
    var menu_style = StyleBoxFlat.new()
    menu_style.bg_color = Color(0.2, 0.15, 0.1, 0.8)
    menu_style.corner_radius_top_left = 16
    menu_style.corner_radius_top_right = 16
    menu_style.corner_radius_bottom_left = 16
    menu_style.corner_radius_bottom_right = 16
    menu_style.content_margin_left = 24
    menu_style.content_margin_right = 24
    menu_style.content_margin_top = 20
    menu_style.content_margin_bottom = 20
    menu_panel.add_theme_stylebox_override("panel", menu_style)
    
    var menu_vbox = VBoxContainer.new()
    menu_vbox.add_theme_constant_override("separation", 16)
    menu_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
    menu_panel.add_child(menu_vbox)
    
    start_button = _create_menu_button("🎮  快速开始", Color(0.3, 0.7, 0.4))
    levels_button = _create_menu_button("🗺️  关卡选择", Color(0.3, 0.5, 0.8))
    settings_button = _create_menu_button("⚙️  游戏设置", Color(0.6, 0.5, 0.3))
    quit_button = _create_menu_button("🚪  退出游戏", Color(0.7, 0.3, 0.3))
    
    menu_vbox.add_child(start_button)
    menu_vbox.add_child(levels_button)
    menu_vbox.add_child(settings_button)
    menu_vbox.add_child(quit_button)
    
    version_label = Label.new()
    version_label.text = "v1.0.0"
    version_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    version_label.anchor_left = 1.0
    version_label.anchor_top = 1.0
    version_label.anchor_right = 1.0
    version_label.anchor_bottom = 1.0
    version_label.offset_left = -120
    version_label.offset_right = -20
    version_label.offset_top = -30
    version_label.offset_bottom = -10
    version_label.modulate = Color(0.6, 0.6, 0.6)
    add_child(version_label)
    
    input_mode_label = Label.new()
    input_mode_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
    input_mode_label.anchor_left = 0.0
    input_mode_label.anchor_top = 1.0
    input_mode_label.anchor_right = 0.0
    input_mode_label.anchor_bottom = 1.0
    input_mode_label.offset_left = 20
    input_mode_label.offset_right = 200
    input_mode_label.offset_top = -30
    input_mode_label.offset_bottom = -10
    input_mode_label.modulate = Color(0.6, 0.6, 0.6)
    add_child(input_mode_label)

func _create_menu_button(text: String, color: Color) -> Button:
    var btn = Button.new()
    btn.text = text
    btn.custom_minimum_size = Vector2(300, 50)
    btn.add_theme_font_size_override("font_size", 20)
    
    var normal_style = StyleBoxFlat.new()
    normal_style.bg_color = color
    normal_style.corner_radius_top_left = 8
    normal_style.corner_radius_top_right = 8
    normal_style.corner_radius_bottom_left = 8
    normal_style.corner_radius_bottom_right = 8
    normal_style.content_margin_left = 20
    normal_style.content_margin_right = 20
    normal_style.content_margin_top = 10
    normal_style.content_margin_bottom = 10
    btn.add_theme_stylebox_override("normal", normal_style)
    
    var hover_style = normal_style.duplicate()
    hover_style.bg_color = color.lightened(0.2)
    btn.add_theme_stylebox_override("hover", hover_style)
    
    var pressed_style = normal_style.duplicate()
    pressed_style.bg_color = color.darkened(0.2)
    btn.add_theme_stylebox_override("pressed", pressed_style)
    
    var focus_style = normal_style.duplicate()
    focus_style.border_color = Color.WHITE
    focus_style.border_width_left = 2
    focus_style.border_width_right = 2
    focus_style.border_width_top = 2
    focus_style.border_width_bottom = 2
    btn.add_theme_stylebox_override("focus", focus_style)
    
    return btn

func _connect_signals() -> void:
    start_button.pressed.connect(_on_start_pressed)
    levels_button.pressed.connect(_on_levels_pressed)
    settings_button.pressed.connect(_on_settings_pressed)
    quit_button.pressed.connect(_on_quit_pressed)

func _on_start_pressed() -> void:
    AudioManager.play_sfx("click")
    var unlocked_levels: Array = []
    for level_id in LevelConfig.get_level_ids():
        if SaveManager.is_level_unlocked(level_id):
            unlocked_levels.append(level_id)
    var target_level = "level_1"
    if unlocked_levels.size() > 0:
        target_level = unlocked_levels[unlocked_levels.size() - 1]
    GameManager.start_new_game(target_level)
    SceneManager.change_scene("Game")

func _on_levels_pressed() -> void:
    AudioManager.play_sfx("click")
    SceneManager.change_scene("LevelSelect")

func _on_settings_pressed() -> void:
    AudioManager.play_sfx("click")
    _open_settings_dialog()

func _on_quit_pressed() -> void:
    AudioManager.play_sfx("click")
    get_tree().quit()

func _open_settings_dialog() -> void:
    var settings_dialog = GameAssets.load_scene("res://scenes/ui/SettingsDialog.tscn")
    if settings_dialog != null:
        var dialog = settings_dialog.instantiate()
        dialog.name = "SettingsDialog"
        dialog.popup_centered()
        add_child(dialog)
        UIState.open_dialog(dialog)

func _on_input_mode_changed(_mode) -> void:
    _update_input_mode_label()

func _update_input_mode_label() -> void:
    if input_mode_label:
        input_mode_label.text = "输入方式: " + InputMapper.get_input_mode_name()

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_up"):
        _navigate_menu(-1)
    elif event.is_action_pressed("ui_down"):
        _navigate_menu(1)

func _navigate_menu(direction: int) -> void:
    if _menu_buttons.size() == 0:
        return
    _current_focus_index = (_current_focus_index + direction + _menu_buttons.size()) % _menu_buttons.size()
    _menu_buttons[_current_focus_index].grab_focus()
    AudioManager.play_sfx("click")
