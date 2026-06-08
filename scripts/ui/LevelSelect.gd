extends Control
## 关卡选择场景 - 章节与关卡浏览与选择

var selected_level_id: String = ""
var chapter_nodes: Dictionary = {}

@onready var back_button: Button = $TopBar/BackButton
@onready var deck_view_button: Button = $TopBar/DeckViewButton
@onready var chapters_container: VBoxContainer = $ScrollContainer/ChaptersContainer
@onready var start_button: Button = $BottomBar/StartButton
@onready var deck_size_label: Label = $BottomBar/DeckSizeLabel
@onready var level_info_panel: Control = $LevelInfoPanel
@onready var level_info_name: Label = $LevelInfoPanel/InfoVBox/LevelNameLabel
@onready var level_info_desc: Label = $LevelInfoPanel/InfoVBox/DescLabel
@onready var level_info_stats: VBoxContainer = $LevelInfoPanel/InfoVBox/StatsBox
@onready var deck_preview_container: HBoxContainer = $LevelInfoPanel/InfoVBox/DeckPreviewBox

func _ready() -> void:
	anchor_right = 1.0
	anchor_bottom = 1.0
	_connect_buttons()
	_build_chapter_list()
	_refresh_deck_info()
	level_info_panel.visible = false
	start_button.disabled = true

func _connect_buttons() -> void:
	if back_button:
		back_button.pressed.connect(_on_back_pressed)
	if deck_view_button:
		deck_view_button.pressed.connect(_on_deck_view_pressed)
	if start_button:
		start_button.pressed.connect(_on_start_pressed)

func _build_chapter_list() -> void:
	if not chapters_container:
		return
	for child in chapters_container.get_children():
		child.queue_free()
	chapter_nodes.clear()
	
	var chapters: Dictionary = LevelRegistry.get_all_chapters()
	var chapter_ids: Array = []
	for cid in chapters.keys():
		chapter_ids.append(cid)
	chapter_ids.sort()
	
	for cid in chapter_ids:
		var chapter: Dictionary = chapters[cid]
		var unlocked: bool = LevelRegistry.is_chapter_unlocked(cid)
		var ch_section: VBoxContainer = _create_chapter_section(chapter, unlocked)
		chapters_container.add_child(ch_section)

func _create_chapter_section(chapter: Dictionary, unlocked: bool) -> VBoxContainer:
	var section: VBoxContainer = VBoxContainer.new()
	section.add_theme_constant_override("separation", 12)
	var sep: HSeparator = HSeparator.new()
	section.add_child(sep)
	
	var header: PanelContainer = PanelContainer.new()
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.25, 0.18, 0.1, 0.9) if unlocked else Color(0.2, 0.2, 0.2, 0.7)
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	header.add_theme_stylebox_override("panel", sb)
	var hb: HBoxContainer = HBoxContainer.new()
	var margin: MarginContainer = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_top", 10)
	margin.add_theme_constant_override("margin_bottom", 10)
	margin.add_child(hb)
	header.add_child(margin)
	
	var ch_name: Label = Label.new()
	ch_name.text = ("🔒  " if not unlocked else "📜  ") + chapter.get("name", "")
	ch_name.add_theme_font_size_override("font_size", 20)
	ch_name.add_theme_color_override("font_color", Color(1, 0.88, 0.5) if unlocked else Color(0.6, 0.6, 0.6))
	ch_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hb.add_child(ch_name)
	
	var ch_desc: Label = Label.new()
	ch_desc.text = chapter.get("description", "")
	ch_desc.add_theme_font_size_override("font_size", 13)
	ch_desc.add_theme_color_override("font_color", Color(0.8, 0.75, 0.65))
	ch_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hb.add_child(ch_desc)
	section.add_child(header)
	
	var levels_grid: GridContainer = GridContainer.new()
	levels_grid.columns = 2
	levels_grid.add_theme_constant_override("h_separation", 16)
	levels_grid.add_theme_constant_override("v_separation", 16)
	levels_grid.add_theme_constant_override("horizontal_spacing", 16)
	levels_grid.add_theme_constant_override("vertical_spacing", 16)
	
	var levels: Array = LevelRegistry.get_levels_for_chapter(chapter.id)
	for lvl in levels:
		var lvl_btn: Button = _create_level_button(lvl, unlocked)
		levels_grid.add_child(lvl_btn)
		chapter_nodes[lvl.id] = lvl_btn
	section.add_child(levels_grid)
	
	if not unlocked:
		var hint: Label = Label.new()
		hint.text = "完成前一章节后解锁"
		hint.add_theme_font_size_override("font_size", 12)
		hint.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		section.add_child(hint)
	return section

func _create_level_button(level_data: Dictionary, chapter_unlocked: bool) -> Button:
	var btn: Button = Button.new()
	btn.custom_minimum_size = Vector2(280, 80)
	var lvl_id: String = level_data.id
	var level_unlocked: bool = chapter_unlocked and LevelRegistry.is_level_unlocked(lvl_id)
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	var diff_colors: Dictionary = {
		"easy": Color(0.2, 0.45, 0.25, 0.9),
		"normal": Color(0.4, 0.35, 0.15, 0.9),
		"hard": Color(0.45, 0.2, 0.2, 0.9)
	}
	sb.bg_color = diff_colors.get(level_data.get("difficulty", "normal"), diff_colors.normal)
	if not level_unlocked:
		sb.bg_color = Color(0.25, 0.25, 0.25, 0.8)
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	btn.add_theme_stylebox_override("normal", sb.duplicate())
	var sb_hover = sb.duplicate()
	sb_hover.bg_color = Color(sb.bg_color.r * 1.2, sb.bg_color.g * 1.2, sb.bg_color.b * 1.2, 0.95)
	btn.add_theme_stylebox_override("hover", sb_hover)
	var sb_pressed = sb.duplicate()
	sb_pressed.bg_color = Color(sb.bg_color.r * 0.8, sb.bg_color.g * 0.8, sb.bg_color.b * 0.8, 1.0)
	btn.add_theme_stylebox_override("pressed", sb_pressed)
	var sb_disabled = sb.duplicate()
	sb_disabled.bg_color = Color(0.2, 0.2, 0.2, 0.6)
	btn.add_theme_stylebox_override("disabled", sb_disabled)
	
	var vb: VBoxContainer = VBoxContainer.new()
	var name: Label = Label.new()
	name.text = ("🔒 " if not level_unlocked else "") + level_data.get("name", "")
	name.add_theme_font_size_override("font_size", 14)
	name.add_theme_color_override("font_color", Color.WHITE)
	var info: Label = Label.new()
	var diff_text: Dictionary = {"easy": "★ 简单", "normal": "★★ 普通", "hard": "★★★ 困难"}
	info.text = "%s | %d回合 | 展品%d件" % [
		diff_text.get(level_data.get("difficulty", "normal"), ""),
		level_data.get("max_turns", 10),
		level_data.get("exhibits", []).size()
	]
	info.add_theme_font_size_override("font_size", 11)
	info.add_theme_color_override("font_color", Color(0.85, 0.85, 0.85))
	vb.add_child(name)
	vb.add_child(info)
	btn.add_child(vb)
	btn.disabled = not level_unlocked
	if level_unlocked:
		btn.pressed.connect(_on_level_pressed.bind(lvl_id))
	return btn

func _on_level_pressed(level_id: String) -> void:
	AudioManager.play_ui_click()
	selected_level_id = level_id
	var level: Dictionary = LevelRegistry.get_level(level_id)
	for lid in chapter_nodes:
		if chapter_nodes[lid] is Button:
			chapter_nodes[lid].modulate = Color.WHITE if lid != level_id else Color(1, 1, 0.6)
	_show_level_info(level)
	start_button.disabled = false

func _show_level_info(level: Dictionary) -> void:
	level_info_panel.visible = true
	if level_info_name:
		level_info_name.text = level.get("name", "")
	if level_info_desc:
		level_info_desc.text = level.get("description", "")
	for child in level_info_stats.get_children():
		child.queue_free()
	var stats: Array = [
		["回合上限", str(level.get("max_turns", 10))],
		["每回合预算", str(level.get("budget_per_turn", 3))],
		["初始工具", str(level.get("starting_tools", 0))],
		["初始专家", str(level.get("starting_experts", 0))],
		["展品数量", str(level.get("exhibits", []).size())],
		["需完成", "%d件 / 允许失败%d件" % [level.get("required_exhibits", 3), level.get("allowed_failures", 0)]]
	]
	for s in stats:
		var hb: HBoxContainer = HBoxContainer.new()
		var k: Label = Label.new()
		k.text = s[0] + ":"
		k.custom_minimum_size = Vector2(100, 0)
		k.add_theme_font_size_override("font_size", 13)
		var v: Label = Label.new()
		v.text = s[1]
		v.add_theme_font_size_override("font_size", 13)
		v.add_theme_color_override("font_color", Color(1, 0.9, 0.6))
		hb.add_child(k)
		hb.add_child(v)
		level_info_stats.add_child(hb)

func _refresh_deck_info() -> void:
	if deck_size_label:
		deck_size_label.text = "当前卡组: %d 张卡" % GameManager.player_deck.size()

func _on_back_pressed() -> void:
	AudioManager.play_ui_click()
	GameManager.return_to_menu()
	_transition_to_scene("res://scenes/MainMenu.tscn")

func _on_deck_view_pressed() -> void:
	AudioManager.play_ui_click()
	EventBus.publish("ui_toast", ["卡组预览: %d张卡" % GameManager.player_deck.size(), "info", 2.0])

func _on_start_pressed() -> void:
	if selected_level_id.is_empty():
		return
	AudioManager.play_ui_click()
	SaveSystem.record_stat("total_games_played", 1)
	_transition_to_battle(selected_level_id)

func _transition_to_battle(level_id: String) -> void:
	EventBus.publish("scene_changing", ["BattleScene"])
	GameManager.set("pending_level", level_id)
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
	t.tween_property(self, "modulate:a", 0.0, 0.35)
	t.tween_callback(func():
		get_tree().change_scene_to_file("res://scenes/BattleScene.tscn")
	)

func _transition_to_scene(path: String) -> void:
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
	t.tween_property(self, "modulate:a", 0.0, 0.35)
	t.tween_callback(func():
		get_tree().change_scene_to_file(path)
	)
