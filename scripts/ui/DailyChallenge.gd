extends Control
## 每日挑战页面

@onready var back_button: Button = $TopBar/BackButton
@onready var title_label: Label = $TopBar/TitleLabel
@onready var date_label: Label = $ChallengeInfo/VBox/DateLabel
@onready var seed_label: Label = $ChallengeInfo/VBox/SeedLabel
@onready var description_label: Label = $ChallengeInfo/VBox/DescriptionLabel
@onready var best_label: Label = $StatsPanel/BestLabel
@onready var status_label: Label = $StatsPanel/StatusLabel
@onready var items_preview: GridContainer = $ItemsPreviewGrid
@onready var start_button: Button = $BottomArea/StartButton
@onready var leaderboard_button: Button = $BottomArea/LeaderboardButton

var challenge_data: Dictionary = {}

func _ready() -> void:
    _setup_ui()
    _load_challenge()
    if back_button:
        back_button.pressed.connect(_on_back)
    if start_button:
        start_button.pressed.connect(_on_start)
    if leaderboard_button:
        leaderboard_button.pressed.connect(_on_leaderboard)

func _setup_ui() -> void:
    if title_label:
        title_label.add_theme_font_size_override("font_size", 48)
        title_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if date_label:
        date_label.add_theme_font_size_override("font_size", 32)
        date_label.add_theme_color_override("font_color", Color(0.5, 0.35, 0.2))
    if seed_label:
        seed_label.add_theme_font_size_override("font_size", 24)
        seed_label.add_theme_color_override("font_color", Color(0.5, 0.4, 0.3))
    if description_label:
        description_label.add_theme_font_size_override("font_size", 24)
        description_label.add_theme_color_override("font_color", Color(0.4, 0.3, 0.2))
        description_label.autowrap_mode = TextServer.AUTOWRAP_WORD
    if best_label:
        best_label.add_theme_font_size_override("font_size", 28)
        best_label.add_theme_color_override("font_color", Color(0.6, 0.4, 0.15))
    if status_label:
        status_label.add_theme_font_size_override("font_size", 24)
    _style_button_small(back_button)
    for btn in [start_button, leaderboard_button]:
        if btn:
            _style_button(btn)
    if items_preview:
        items_preview.columns = 4
        items_preview.add_theme_constant_override("h_separation", 16)
        items_preview.add_theme_constant_override("v_separation", 16)

func _style_button(btn: Button) -> void:
    var style_normal: StyleBoxFlat = StyleBoxFlat.new()
    style_normal.bg_color = Color(0.9, 0.7, 0.4)
    style_normal.corner_radius_top_left = 14
    style_normal.corner_radius_top_right = 14
    style_normal.corner_radius_bottom_left = 14
    style_normal.corner_radius_bottom_right = 14
    style_normal.content_margin_left = 32
    style_normal.content_margin_right = 32
    style_normal.content_margin_top = 18
    style_normal.content_margin_bottom = 18
    btn.add_theme_stylebox_override("normal", style_normal)
    var style_hover: StyleBoxFlat = style_normal.duplicate()
    style_hover.bg_color = Color(1.0, 0.8, 0.5)
    btn.add_theme_stylebox_override("hover", style_hover)
    btn.add_theme_font_size_override("font_size", 32)
    btn.add_theme_color_override("font_color", Color(0.3, 0.15, 0.05))
    btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _style_button_small(btn: Button) -> void:
    if not btn:
        return
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
    btn.add_theme_font_size_override("font_size", 28)
    btn.add_theme_color_override("font_color", Color.WHITE)
    btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _load_challenge() -> void:
    challenge_data = LeaderboardSystem.generate_daily_challenge()
    if date_label:
        date_label.text = "📅 %s" % Time.get_date_string_from_system()
    if seed_label:
        seed_label.text = "随机种子: #%d" % LeaderboardSystem.get_daily_seed()
    if description_label:
        description_label.text = challenge_data.get("description", "")
    var status: Dictionary = LeaderboardSystem.get_daily_completion_status()
    if best_label:
        best_label.text = "最佳: %d 分" % int(status.get("best_score", 0))
    if status_label:
        if status.get("completed", false):
            status_label.text = "✅ 今日已完成（可重复挑战）"
            status_label.add_theme_color_override("font_color", Color(0.3, 0.6, 0.3))
            if start_button:
                start_button.text = "再次挑战"
        else:
            status_label.text = "⏳ 今日挑战未完成"
            status_label.add_theme_color_override("font_color", Color(0.5, 0.4, 0.2))
    _build_items_preview()

func _build_items_preview() -> void:
    if not items_preview:
        return
    UIManager.clear_container(items_preview)
    var item_ids: Array = challenge_data.get("items", [])
    for id in item_ids:
        var def: Dictionary = ResourceLoader_.get_item_def(id)
        if def.is_empty():
            continue
        var item_panel: PanelContainer = PanelContainer.new()
        var style: StyleBoxFlat = StyleBoxFlat.new()
        var color: Color = def.get("color", Color.WHITE)
        style.bg_color = color
        style.corner_radius_top_left = 8
        style.corner_radius_top_right = 8
        style.corner_radius_bottom_left = 8
        style.corner_radius_bottom_right = 8
        style.content_margin_left = 8
        style.content_margin_right = 8
        style.content_margin_top = 8
        style.content_margin_bottom = 8
        item_panel.add_theme_stylebox_override("panel", style)

        var vbox: VBoxContainer = VBoxContainer.new()
        vbox.alignment = BoxContainer.ALIGNMENT_CENTER
        item_panel.add_child(vbox)

        var icon: Label = Label.new()
        var is_fragile: bool = bool(def.get("fragile", false))
        icon.text = "🏺" if is_fragile else "📦"
        icon.add_theme_font_size_override("font_size", 36)
        icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        vbox.add_child(icon)

        var name: Label = Label.new()
        name.text = def.get("name", "")
        name.add_theme_font_size_override("font_size", 14)
        name.add_theme_color_override("font_color", Color(0.2, 0.1, 0))
        name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        vbox.add_child(name)

        var weight: Label = Label.new()
        weight.text = "%.0fkg" % float(def.get("weight", 0))
        weight.add_theme_font_size_override("font_size", 14)
        weight.add_theme_color_override("font_color", Color(0.3, 0.2, 0.1))
        weight.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        vbox.add_child(weight)

        items_preview.add_child(item_panel)

func _on_back() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_main_menu()

func _on_start() -> void:
    AudioManager.play_sfx("click")
    GameState.start_level(9999, true)
    var level_def: Dictionary = challenge_data.duplicate(true)
    level_def["level_id"] = 9999
    ResourceLoader_.set_level_def(9999, level_def)
    SceneManager.change_scene("game")

func _on_leaderboard() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_leaderboard()
