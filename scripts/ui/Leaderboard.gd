extends Control
## 排行榜页面

@onready var back_button: Button = $TopBar/BackButton
@onready var title_label: Label = $TopBar/TitleLabel
@onready var tab_container: TabContainer = $TabContainer
@onready var level_list_container: VBoxContainer = $TabContainer/LevelTab/Scroll/List
@onready var level_selector: OptionButton = $TabContainer/LevelTab/LevelSelector
@onready var daily_list_container: VBoxContainer = $TabContainer/DailyTab/Scroll2/List
@onready var daily_status: Label = $TabContainer/DailyTab/DailyStatus
@onready var player_best_label: Label = $PlayerBest

func _ready() -> void:
    _setup_ui()
    _setup_level_selector()
    _connect_signals()
    _refresh_level_leaderboard()
    _refresh_daily_leaderboard()

func _setup_ui() -> void:
    if title_label:
        title_label.add_theme_font_size_override("font_size", 48)
        title_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if tab_container:
        tab_container.tab_alignment = BoxContainer.ALIGNMENT_CENTER
        tab_container.add_theme_font_size_override("font_size", 28)
    if player_best_label:
        player_best_label.add_theme_font_size_override("font_size", 26)
        player_best_label.add_theme_color_override("font_color", Color(0.5, 0.35, 0.2))
    if daily_status:
        daily_status.add_theme_font_size_override("font_size", 24)
        daily_status.add_theme_color_override("font_color", Color(0.4, 0.3, 0.2))
    _style_button_small(back_button)

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

func _setup_level_selector() -> void:
    if not level_selector:
        return
    var levels: Dictionary = ResourceLoader_.get_all_levels()
    var ids: Array = levels.keys()
    ids.sort()
    level_selector.clear()
    for id in ids:
        var int_id: int = int(id)
        var def: Dictionary = levels[id]
        level_selector.add_item("第 %d 关: %s" % [int_id, def.get("name", "")], int_id)
    level_selector.add_theme_font_size_override("font_size", 24)

func _connect_signals() -> void:
    if back_button:
        back_button.pressed.connect(_on_back)
    if level_selector:
        level_selector.item_selected.connect(_on_level_selected)

func _refresh_level_leaderboard() -> void:
    if not level_list_container:
        return
    UIManager.clear_container(level_list_container)
    var level_id: int = 1
    if level_selector:
        level_id = level_selector.get_item_id(level_selector.selected)
    var leaderboard: Array = LeaderboardSystem.get_leaderboard(level_id, 10)
    var best: int = LeaderboardSystem.get_player_best(level_id)
    if player_best_label:
        player_best_label.text = "你的最高分: %d" % best
    if leaderboard.is_empty():
        var empty_lbl: Label = Label.new()
        empty_lbl.text = "暂无记录，快来挑战吧！"
        empty_lbl.add_theme_font_size_override("font_size", 28)
        empty_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        empty_lbl.custom_minimum_size = Vector2(0, 200)
        empty_lbl.add_theme_color_override("font_color", Color(0.5, 0.4, 0.3))
        level_list_container.add_child(empty_lbl)
        return
    for i in leaderboard.size():
        var entry: Dictionary = leaderboard[i]
        var item: Control = _create_leaderboard_item(i + 1, entry)
        level_list_container.add_child(item)

func _refresh_daily_leaderboard() -> void:
    if not daily_list_container:
        return
    UIManager.clear_container(daily_list_container)
    var status: Dictionary = LeaderboardSystem.get_daily_completion_status()
    if daily_status:
        if status.get("completed", false):
            daily_status.text = "✅ 今日挑战已完成！最高分: %d" % int(status.get("best_score", 0))
            daily_status.add_theme_color_override("font_color", Color(0.3, 0.6, 0.3))
        else:
            daily_status.text = "📅 今日挑战尚未完成"
    var leaderboard: Array = status.get("global_leaderboard", [])
    if leaderboard.is_empty():
        var empty_lbl: Label = Label.new()
        empty_lbl.text = "今日暂无排行榜记录"
        empty_lbl.add_theme_font_size_override("font_size", 26)
        empty_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        empty_lbl.custom_minimum_size = Vector2(0, 150)
        empty_lbl.add_theme_color_override("font_color", Color(0.5, 0.4, 0.3))
        daily_list_container.add_child(empty_lbl)
        return
    for i in leaderboard.size():
        var entry: Dictionary = leaderboard[i]
        var item: Control = _create_leaderboard_item(i + 1, entry)
        daily_list_container.add_child(item)

func _create_leaderboard_item(rank: int, entry: Dictionary) -> Control:
    var panel: PanelContainer = PanelContainer.new()
    panel.custom_minimum_size = Vector2(0, 80)
    var style: StyleBoxFlat = StyleBoxFlat.new()
    if rank == 1:
        style.bg_color = Color(1.0, 0.9, 0.4, 0.95)
    elif rank == 2:
        style.bg_color = Color(0.9, 0.9, 0.9, 0.95)
    elif rank == 3:
        style.bg_color = Color(0.95, 0.75, 0.5, 0.95)
    else:
        style.bg_color = Color(0.95, 0.9, 0.8, 0.7)
    style.corner_radius_top_left = 10
    style.corner_radius_top_right = 10
    style.corner_radius_bottom_left = 10
    style.corner_radius_bottom_right = 10
    style.content_margin_left = 16
    style.content_margin_right = 16
    style.content_margin_top = 8
    style.content_margin_bottom = 8
    panel.add_theme_stylebox_override("panel", style)

    var hbox: HBoxContainer = HBoxContainer.new()
    hbox.add_theme_constant_override("separation", 16)
    hbox.alignment = BoxContainer.ALIGNMENT_CENTER
    panel.add_child(hbox)

    var rank_lbl: Label = Label.new()
    var rank_text: String = ""
    if rank == 1:
        rank_text = "🥇"
    elif rank == 2:
        rank_text = "🥈"
    elif rank == 3:
        rank_text = "🥉"
    else:
        rank_text = "%d" % rank
    rank_lbl.text = rank_text
    rank_lbl.add_theme_font_size_override("font_size", 32)
    rank_lbl.custom_minimum_size = Vector2(80, 0)
    rank_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    hbox.add_child(rank_lbl)

    var name_lbl: Label = Label.new()
    name_lbl.text = entry.get("name", "玩家")
    name_lbl.add_theme_font_size_override("font_size", 28)
    name_lbl.add_theme_color_override("font_color", Color(0.3, 0.2, 0.1))
    name_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    hbox.add_child(name_lbl)

    var score_lbl: Label = Label.new()
    score_lbl.text = "%d 分" % int(entry.get("score", 0))
    score_lbl.add_theme_font_size_override("font_size", 28)
    score_lbl.add_theme_color_override("font_color", Color(0.6, 0.35, 0.1))
    hbox.add_child(score_lbl)

    return panel

func _on_level_selected(index: int) -> void:
    AudioManager.play_sfx("click")
    _refresh_level_leaderboard()

func _on_back() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_main_menu()
