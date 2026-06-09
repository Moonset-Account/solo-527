extends CanvasLayer
## 游戏HUD - 显示得分、重量、星星等信息

@onready var score_label: Label = $TopBar/ScoreLabel
@onready var stars_label: Label = $TopBar/StarsLabel
@onready var level_name_label: Label = $TopBar/LevelNameLabel
@onready var weight_bar: ProgressBar = $BottomBar/WeightContainer/WeightBar
@onready var weight_label: Label = $BottomBar/WeightContainer/WeightLabel
@onready var items_label: Label = $BottomBar/ItemsContainer/ItemsLabel
@onready var undo_button: Button = $BottomBar/ActionsContainer/UndoButton
@onready var rotate_cw_button: Button = $BottomBar/ActionsContainer/RotateCW
@onready var rotate_ccw_button: Button = $BottomBar/ActionsContainer/RotateCCW
@onready var pause_button: Button = $TopBar/PauseButton
@onready var submit_button: Button = $BottomBar/ActionsContainer/SubmitButton
@onready var warning_label: Label = $WarningLabel
@onready var fragile_count_label: Label = $BottomBar/ItemsContainer/FragileLabel

var warning_timer: float = 0.0

func _ready() -> void:
    _setup_buttons()
    _setup_labels()
    _connect_signals()
    _update_warning_visibility()

func _setup_buttons() -> void:
    var buttons: Dictionary = {
        undo_button: undo_button,
        rotate_cw_button: rotate_cw_button,
        rotate_ccw_button: rotate_ccw_button,
        pause_button: pause_button,
        submit_button: submit_button
    }
    for name in buttons.keys():
        var btn: Button = buttons[name]
        if btn:
            _style_circle_button(btn)
            btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _setup_labels() -> void:
    if score_label:
        score_label.add_theme_font_size_override("font_size", 32)
        score_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if stars_label:
        stars_label.add_theme_font_size_override("font_size", 32)
    if level_name_label:
        level_name_label.add_theme_font_size_override("font_size", 28)
        level_name_label.add_theme_color_override("font_color", Color(0.5, 0.35, 0.2))
    if weight_label:
        weight_label.add_theme_font_size_override("font_size", 24)
        weight_label.add_theme_color_override("font_color", Color(0.3, 0.2, 0.1))
    if items_label:
        items_label.add_theme_font_size_override("font_size", 24)
        items_label.add_theme_color_override("font_color", Color(0.3, 0.2, 0.1))
    if fragile_count_label:
        fragile_count_label.add_theme_font_size_override("font_size", 20)
    if warning_label:
        warning_label.add_theme_font_size_override("font_size", 28)
        warning_label.add_theme_color_override("font_color", Color.RED)
        warning_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

func _connect_signals() -> void:
    if pause_button:
        pause_button.pressed.connect(_on_pause_pressed)
    if undo_button:
        undo_button.pressed.connect(_on_undo_pressed)
    if rotate_cw_button:
        rotate_cw_button.pressed.connect(_on_rotate_cw_pressed)
    if rotate_ccw_button:
        rotate_ccw_button.pressed.connect(_on_rotate_ccw_pressed)
    if submit_button:
        submit_button.pressed.connect(_on_submit_pressed)

func _style_circle_button(btn: Button) -> void:
    var style_normal: StyleBoxFlat = StyleBoxFlat.new()
    style_normal.bg_color = Color(0.85, 0.7, 0.5)
    style_normal.corner_radius_top_left = 32
    style_normal.corner_radius_top_right = 32
    style_normal.corner_radius_bottom_left = 32
    style_normal.corner_radius_bottom_right = 32
    style_normal.content_margin_left = 16
    style_normal.content_margin_right = 16
    style_normal.content_margin_top = 16
    style_normal.content_margin_bottom = 16
    btn.add_theme_stylebox_override("normal", style_normal)
    var style_hover: StyleBoxFlat = style_normal.duplicate()
    style_hover.bg_color = Color(0.95, 0.8, 0.6)
    btn.add_theme_stylebox_override("hover", style_hover)
    var style_pressed: StyleBoxFlat = style_normal.duplicate()
    style_pressed.bg_color = Color(0.7, 0.55, 0.35)
    btn.add_theme_stylebox_override("pressed", style_pressed)
    btn.add_theme_font_size_override("font_size", 28)
    btn.add_theme_color_override("font_color", Color(0.3, 0.15, 0.05))

func set_level_info(level_def: Dictionary) -> void:
    if level_name_label:
        level_name_label.text = level_def.get("name", "关卡")
    _update_score(0, 0)

func update_stats(stats: Dictionary) -> void:
    var cur_weight: float = float(stats.get("current_weight", 0.0))
    var max_weight: float = float(stats.get("max_weight", 1.0))
    var ratio: float = float(stats.get("weight_ratio", 0.0))
    var in_box: int = int(stats.get("items_in_box", 0))
    var total: int = int(stats.get("total_items", 0))
    var broken: int = int(stats.get("broken_count", 0))

    if weight_bar:
        weight_bar.value = min(100.0, ratio * 100.0)
        if ratio > 1.0:
            weight_bar.modulate = Color(1, 0.5, 0.5)
        elif ratio >= 0.8:
            weight_bar.modulate = Color(1, 0.8, 0.5)
        else:
            weight_bar.modulate = Color.WHITE
    if weight_label:
        weight_label.text = "%.1f / %.1f kg" % [cur_weight, max_weight]
    if items_label:
        items_label.text = "📦 %d / %d" % [in_box, total]
    if fragile_count_label:
        fragile_count_label.text = "💥 破损: %d" % broken
        fragile_count_label.modulate = Color.RED if broken > 0 else Color(0.4, 0.3, 0.2)

func _update_score(new_score: int, stars: int) -> void:
    if score_label:
        score_label.text = "分数: %d" % new_score
    if stars_label:
        var stars_text: String = ""
        for i in 3:
            stars_text += "⭐" if i < stars else "☆"
        stars_label.text = stars_text

func update_score(new_score: int, stars: int) -> void:
    _update_score(new_score, stars)

func show_warning(text: String, duration: float = 2.0) -> void:
    if warning_label:
        warning_label.text = text
        warning_label.visible = true
        warning_timer = duration

func _update_warning_visibility() -> void:
    if warning_label and warning_timer <= 0:
        warning_label.visible = false

func _process(delta: float) -> void:
    if warning_timer > 0:
        warning_timer -= delta
        if warning_timer <= 0:
            _update_warning_visibility()

func _get_game_root() -> Node:
    var roots: Array = get_tree().get_nodes_in_group("game_root")
    if roots.size() > 0:
        return roots[0]
    var root: Node = get_tree().root
    for child in root.get_children():
        if child.name == "GameRoot":
            return child
    return null

func _on_pause_pressed() -> void:
    AudioManager.play_sfx("click")
    GameState.pause_game()

func _on_undo_pressed() -> void:
    AudioManager.play_sfx("click")
    var root: Node = _get_game_root()
    if root and root.has_method("try_undo"):
        root.try_undo()

func _on_rotate_cw_pressed() -> void:
    AudioManager.play_sfx("click")
    Input.action_press("rotate_cw")

func _on_rotate_ccw_pressed() -> void:
    AudioManager.play_sfx("click")
    Input.action_press("rotate_ccw")

func _on_submit_pressed() -> void:
    AudioManager.play_sfx("click")
    var root: Node = _get_game_root()
    if root and root.has_method("submit_level"):
        root.submit_level()
