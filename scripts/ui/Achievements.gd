extends Control
## 成就页面

@onready var back_button: Button = $TopBar/BackButton
@onready var title_label: Label = $TopBar/TitleLabel
@onready var stats_label: Label = $StatsLabel
@onready var list_container: VBoxContainer = $ScrollContainer/ListContainer

func _ready() -> void:
    _setup_ui()
    _populate_achievements()
    if back_button:
        back_button.pressed.connect(_on_back)
    AchievementSystem.achievement_unlocked.connect(_on_achievement_unlocked)

func _setup_ui() -> void:
    if title_label:
        title_label.add_theme_font_size_override("font_size", 48)
        title_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if stats_label:
        stats_label.add_theme_font_size_override("font_size", 28)
        stats_label.add_theme_color_override("font_color", Color(0.5, 0.35, 0.2))
    _style_button_small(back_button)
    _update_stats()

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

func _update_stats() -> void:
    var achievements: Dictionary = AchievementSystem.get_all_achievements()
    var unlocked: int = 0
    for a in achievements.values():
        if a.get("unlocked", false):
            unlocked += 1
    if stats_label:
        stats_label.text = "🏆 已解锁: %d / %d" % [unlocked, achievements.size()]

func _populate_achievements() -> void:
    if not list_container:
        return
    list_container.clear_children()
    var achievements: Dictionary = AchievementSystem.get_all_achievements()
    var ach_ids: Array = achievements.keys()
    for id in ach_ids:
        var data: Dictionary = achievements[id]
        var item: PanelContainer = _create_achievement_item(id, data)
        list_container.add_child(item)

func _create_achievement_item(ach_id: String, data: Dictionary) -> PanelContainer:
    var panel: PanelContainer = PanelContainer.new()
    panel.custom_minimum_size = Vector2(0, 120)
    var unlocked: bool = data.get("unlocked", false)
    var style: StyleBoxFlat = StyleBoxFlat.new()
    if unlocked:
        style.bg_color = Color(1.0, 0.9, 0.65, 0.95)
    else:
        style.bg_color = Color(0.55, 0.55, 0.55, 0.5)
    style.corner_radius_top_left = 14
    style.corner_radius_top_right = 14
    style.corner_radius_bottom_left = 14
    style.corner_radius_bottom_right = 14
    style.content_margin_left = 20
    style.content_margin_right = 20
    style.content_margin_top = 12
    style.content_margin_bottom = 12
    panel.add_theme_stylebox_override("panel", style)

    var hbox: HBoxContainer = HBoxContainer.new()
    hbox.add_theme_constant_override("separation", 20)
    hbox.alignment = BoxContainer.ALIGNMENT_BEGIN
    panel.add_child(hbox)

    var icon_lbl: Label = Label.new()
    icon_lbl.text = data.get("icon", "🏆")
    icon_lbl.add_theme_font_size_override("font_size", 64)
    if not unlocked:
        icon_lbl.modulate = Color(0.7, 0.7, 0.7, 0.6)
    icon_lbl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
    hbox.add_child(icon_lbl)

    var vbox: VBoxContainer = VBoxContainer.new()
    vbox.add_theme_constant_override("separation", 4)
    vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    vbox.alignment = BoxContainer.ALIGNMENT_CENTER
    hbox.add_child(vbox)

    var name_lbl: Label = Label.new()
    name_lbl.text = data.get("name", "未知成就")
    name_lbl.add_theme_font_size_override("font_size", 32)
    if unlocked:
        name_lbl.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    else:
        name_lbl.add_theme_color_override("font_color", Color(0.3, 0.3, 0.3))
    vbox.add_child(name_lbl)

    var desc_lbl: Label = Label.new()
    desc_lbl.text = data.get("description", "")
    desc_lbl.add_theme_font_size_override("font_size", 22)
    if unlocked:
        desc_lbl.add_theme_color_override("font_color", Color(0.5, 0.35, 0.2))
    else:
        desc_lbl.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4))
    desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
    desc_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    vbox.add_child(desc_lbl)

    if unlocked and data.has("unlock_date"):
        var date_lbl: Label = Label.new()
        date_lbl.text = "解锁日期: %s" % data["unlock_date"]
        date_lbl.add_theme_font_size_override("font_size", 18)
        date_lbl.add_theme_color_override("font_color", Color(0.4, 0.35, 0.25))
        vbox.add_child(date_lbl)

    return panel

func _on_achievement_unlocked(id: String, data: Dictionary) -> void:
    _update_stats()
    _populate_achievements()

func _on_back() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_main_menu()
