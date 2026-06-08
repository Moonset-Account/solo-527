extends Control

@onready var back_button: Button
@onready var levels_container: GridContainer
@onready var title_label: Label
@onready var info_label: Label
@onready var selected_level_panel: PanelContainer

var _level_ids: Array = []
var _level_buttons: Dictionary = {}
var _selected_level_id: String = ""

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(max(0, n)):
        result += s
    return result
var _current_focus_index: int = 0
var _focusable_buttons: Array = []

func _ready() -> void:
    anchor_right = 1.0
    anchor_bottom = 1.0
    
    if not _is_children_ready():
        _build_ui()
    
    _level_ids = LevelConfig.get_level_ids()
    _level_ids.sort()
    _connect_signals()
    _build_level_grid()
    UIState.set_context(UIState.UIContext.LEVEL_SELECT)
    
    _focusable_buttons = [back_button]
    for level_id in _level_ids:
        if level_id in _level_buttons:
            _focusable_buttons.append(_level_buttons[level_id])
    
    if _level_ids.size() > 0:
        var first_unlocked = ""
        for level_id in _level_ids:
            if SaveManager.is_level_unlocked(level_id):
                first_unlocked = level_id
                break
        if first_unlocked.is_empty():
            first_unlocked = _level_ids[0]
        _select_level(first_unlocked)

func _is_children_ready() -> bool:
    return back_button != null and levels_container != null

func _build_ui() -> void:
    var bg = ColorRect.new()
    bg.color = Color(0.1, 0.2, 0.3)
    bg.anchor_right = 1.0
    bg.anchor_bottom = 1.0
    bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(bg)
    
    title_label = Label.new()
    title_label.text = "🗺️  选择关卡"
    title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    title_label.anchor_left = 0.0
    title_label.anchor_top = 0.0
    title_label.anchor_right = 1.0
    title_label.anchor_bottom = 0.0
    title_label.offset_top = 30
    title_label.offset_bottom = 90
    title_label.add_theme_font_size_override("font_size", 36)
    title_label.modulate = Color(1, 0.95, 0.85)
    add_child(title_label)
    
    back_button = Button.new()
    back_button.text = "← 返回主菜单"
    back_button.custom_minimum_size = Vector2(180, 45)
    back_button.position = Vector2(30, 30)
    add_child(back_button)
    
    var scroll = ScrollContainer.new()
    scroll.anchor_left = 0.1
    scroll.anchor_top = 0.2
    scroll.anchor_right = 0.65
    scroll.anchor_bottom = 0.85
    scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    add_child(scroll)
    
    levels_container = GridContainer.new()
    levels_container.columns = 2
    levels_container.add_theme_constant_override("h_separation", 20)
    levels_container.add_theme_constant_override("v_separation", 20)
    levels_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    scroll.add_child(levels_container)
    
    selected_level_panel = PanelContainer.new()
    selected_level_panel.anchor_left = 0.72
    selected_level_panel.anchor_top = 0.2
    selected_level_panel.anchor_right = 0.98
    selected_level_panel.anchor_bottom = 0.85
    add_child(selected_level_panel)
    
    var info_style = StyleBoxFlat.new()
    info_style.bg_color = Color(0.15, 0.25, 0.35, 0.9)
    info_style.corner_radius_top_left = 12
    info_style.corner_radius_top_right = 12
    info_style.corner_radius_bottom_left = 12
    info_style.corner_radius_bottom_right = 12
    info_style.content_margin_left = 20
    info_style.content_margin_right = 20
    info_style.content_margin_top = 20
    info_style.content_margin_bottom = 20
    selected_level_panel.add_theme_stylebox_override("panel", info_style)
    
    info_label = Label.new()
    info_label.text = "请选择一个关卡"
    info_label.add_theme_font_size_override("font_size", 14)
    info_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    selected_level_panel.add_child(info_label)

func _connect_signals() -> void:
    back_button.pressed.connect(_on_back_pressed)

func _build_level_grid() -> void:
    for level_id in _level_ids:
        var level_data = LevelConfig.get_level(level_id)
        var progress = SaveManager.get_level_progress(level_id)
        var is_unlocked = SaveManager.is_level_unlocked(level_id)
        
        var card = PanelContainer.new()
        card.custom_minimum_size = Vector2(280, 180)
        levels_container.add_child(card)
        
        var card_style = StyleBoxFlat.new()
        var base_color = Color(0.3, 0.4, 0.5) if is_unlocked else Color(0.2, 0.2, 0.2)
        card_style.bg_color = base_color
        card_style.corner_radius_top_left = 12
        card_style.corner_radius_top_right = 12
        card_style.corner_radius_bottom_left = 12
        card_style.corner_radius_bottom_right = 12
        card_style.content_margin_left = 16
        card_style.content_margin_right = 16
        card_style.content_margin_top = 16
        card_style.content_margin_bottom = 16
        card.add_theme_stylebox_override("panel", card_style)
        
        var vbox = VBoxContainer.new()
        vbox.add_theme_constant_override("separation", 8)
        vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
        card.add_child(vbox)
        
        var name_label = Label.new()
        name_label.text = ("🔒 " if not is_unlocked else "") + level_data.get("name", level_id)
        name_label.add_theme_font_size_override("font_size", 20)
        name_label.modulate = Color.WHITE if is_unlocked else Color(0.5, 0.5, 0.5)
        vbox.add_child(name_label)
        
        var days_label = Label.new()
        days_label.text = "📅 天数: %d" % level_data.get("days", 5)
        days_label.modulate = Color(0.9, 0.9, 0.9)
        vbox.add_child(days_label)
        
        var money_label = Label.new()
        money_label.text = "💰 目标: %d 金币" % level_data.get("target_money", 1000)
        money_label.modulate = Color(0.9, 0.9, 0.9)
        vbox.add_child(money_label)
        
        var stars_str = "⭐" * progress.get("best_stars", 0) + "☆" * (3 - progress.get("best_stars", 0))
        var stars_label = Label.new()
        stars_label.text = stars_str
        stars_label.add_theme_font_size_override("font_size", 18)
        vbox.add_child(stars_label)
        
        if progress.get("best_money", 0) > 0:
            var best_label = Label.new()
            best_label.text = "最佳: %d 金币" % progress["best_money"]
            best_label.modulate = Color(0.8, 0.8, 0.6)
            best_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
            best_label.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
            vbox.add_child(best_label)
        else:
            var spacer = Control.new()
            spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
            vbox.add_child(spacer)
        
        var btn = Button.new()
        btn.text = "▶ 进入" if is_unlocked else "🔒 未解锁"
        btn.disabled = not is_unlocked
        btn.custom_minimum_size = Vector2(0, 40)
        btn.add_theme_font_size_override("font_size", 16)
        btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
        vbox.add_child(btn)
        
        btn.pressed.connect(_on_level_pressed.bind(level_id))
        btn.mouse_entered.connect(func(): _select_level(level_id))
        
        _level_buttons[level_id] = btn

func _select_level(level_id: String) -> void:
    _selected_level_id = level_id
    var level_data = LevelConfig.get_level(level_id)
    var progress = SaveManager.get_level_progress(level_id)
    
    var unlocked_str = "✅ 已解锁" if SaveManager.is_level_unlocked(level_id) else "🔒 未解锁"
    var completed_str = "✅ 已完成" if progress.get("completed", false) else "⏳ 未完成"
    
    var items_str = ""
    for item_id in level_data.get("available_items", []):
        items_str += ItemsDB.get_item_name(item_id) + "、"
    items_str = items_str.trim_suffix("、")
    
    var stars_str = "⭐" * progress.get("best_stars", 0) + "☆" * (3 - progress.get("best_stars", 0))
    
    var prerequisite = level_data.get("prerequisite", "")
    var prereq_str = "无"
    if not prerequisite.is_empty():
        var prereq_data = LevelConfig.get_level(prerequisite)
        prereq_str = prereq_data.get("name", prerequisite)
    
    info_label.text = """
[center][b]%s[/b][/center]

%s
%s

%s

[indent]📅 天数: %d
💰 起始资金: %d 金币
🎯 目标金额: %d 金币
📦 可用商品: %s

[color=yellow]最佳成绩:[/color]
  %s
  最高金额: %d 金币

📋 前置关卡: %s[/indent]

[color=cyan]提示: 达成50%目标获得1星，达成100%获得2星，达成150%获得3星！[/color]
""" % [
        level_data.get("name", level_id),
        unlocked_str,
        completed_str,
        level_data.get("description", ""),
        level_data.get("days", 5),
        level_data.get("start_money", 300),
        level_data.get("target_money", 1000),
        items_str,
        stars_str,
        progress.get("best_money", 0),
        prereq_str
    ]

func _on_back_pressed() -> void:
    AudioManager.play_sfx("click")
    SceneManager.change_scene("Main")

func _on_level_pressed(level_id: String) -> void:
    if not SaveManager.is_level_unlocked(level_id):
        AudioManager.play_sfx("error")
        return
    AudioManager.play_sfx("click")
    GameManager.start_new_game(level_id)
    SceneManager.change_scene("Game")

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel"):
        _on_back_pressed()
    elif event.is_action_pressed("ui_accept") and not _selected_level_id.is_empty():
        _on_level_pressed(_selected_level_id)
