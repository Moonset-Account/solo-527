extends Control
## 关卡选择界面

@onready var back_button: Button = $TopBar/BackButton
@onready var level_grid: GridContainer = $ScrollContainer/LevelGrid
@onready var title_label: Label = $TopBar/TitleLabel

var _level_buttons: Dictionary = {}

func _ready() -> void:
    _setup_ui()
    _create_level_buttons()
    if back_button:
        back_button.pressed.connect(_on_back_pressed)

func _setup_ui() -> void:
    if title_label:
        title_label.add_theme_font_size_override("font_size", 48)
        title_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if back_button:
        _style_button_small(back_button)
    if level_grid:
        level_grid.columns = 3
        level_grid.add_theme_constant_override("h_separation", 30)
        level_grid.add_theme_constant_override("v_separation", 30)

func _create_level_buttons() -> void:
    var levels: Dictionary = ResourceLoader_.get_all_levels()
    var level_ids: Array = levels.keys()
    level_ids.sort()
    for id in level_ids:
        var level_id: int = int(id)
        var def: Dictionary = levels[id]
        var btn: Button = _create_level_button(level_id, def)
        _level_buttons[level_id] = btn
        level_grid.add_child(btn)

func _create_level_button(level_id: int, def: Dictionary) -> Button:
    var btn: Button = Button.new()
    btn.custom_minimum_size = Vector2(200, 220)
    var unlocked: bool = SaveSystem.is_level_unlocked(level_id)
    var progress: Dictionary = SaveSystem.get_level_progress(level_id)
    var stars: int = int(progress.get("stars", 0))
    var score: int = int(progress.get("score", 0))

    var vbox: VBoxContainer = VBoxContainer.new()
    vbox.alignment = BoxContainer.ALIGNMENT_CENTER
    vbox.add_theme_constant_override("separation", 6)
    btn.add_child(vbox)

    var title: Label = Label.new()
    title.text = "%d" % level_id
    title.add_theme_font_size_override("font_size", 56)
    title.add_theme_color_override("font_color", Color.WHITE if unlocked else Color(0.5, 0.5, 0.5))
    title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    vbox.add_child(title)

    var name_label: Label = Label.new()
    name_label.text = def.get("name", "")
    name_label.add_theme_font_size_override("font_size", 20)
    name_label.add_theme_color_override("font_color", Color.WHITE if unlocked else Color(0.6, 0.6, 0.6))
    name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    name_label.autowrap_mode = TextServer.AUTOWRAP_WORD
    name_label.custom_minimum_size = Vector2(180, 0)
    vbox.add_child(name_label)

    var stars_label: Label = Label.new()
    stars_label.add_theme_font_size_override("font_size", 28)
    stars_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    if unlocked:
        var stars_text: String = ""
        for i in 3:
            stars_text += "⭐" if i < stars else "☆"
        stars_label.text = stars_text
    else:
        stars_label.text = "🔒"
    vbox.add_child(stars_label)

    if score > 0 and unlocked:
        var score_label: Label = Label.new()
        score_label.text = "最高分: %d" % score
        score_label.add_theme_font_size_override("font_size", 16)
        score_label.add_theme_color_override("font_color", Color(1, 0.9, 0.7))
        score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        vbox.add_child(score_label)

    var style_normal: StyleBoxFlat = StyleBoxFlat.new()
    if unlocked:
        style_normal.bg_color = Color(0.7, 0.5, 0.3)
    else:
        style_normal.bg_color = Color(0.5, 0.5, 0.5, 0.6)
    style_normal.corner_radius_top_left = 16
    style_normal.corner_radius_top_right = 16
    style_normal.corner_radius_bottom_left = 16
    style_normal.corner_radius_bottom_right = 16
    style_normal.content_margin_left = 12
    style_normal.content_margin_right = 12
    style_normal.content_margin_top = 16
    style_normal.content_margin_bottom = 16
    btn.add_theme_stylebox_override("normal", style_normal)

    if unlocked:
        var style_hover: StyleBoxFlat = style_normal.duplicate()
        style_hover.bg_color = Color(0.85, 0.65, 0.4)
        btn.add_theme_stylebox_override("hover", style_hover)
        var style_pressed: StyleBoxFlat = style_normal.duplicate()
        style_pressed.bg_color = Color(0.6, 0.4, 0.2)
        btn.add_theme_stylebox_override("pressed", style_pressed)
        btn.disabled = false
    else:
        btn.disabled = true

    btn.pressed.connect(_on_level_pressed.bind(level_id))
    btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if unlocked else Control.CURSOR_FORBIDDEN
    return btn

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

func _on_level_pressed(level_id: int) -> void:
    AudioManager.play_sfx("click")
    GameState.start_level(level_id)
    SceneManager.change_scene("game")

func _on_back_pressed() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_main_menu()
