extends Control

var _levels_grid: GridContainer
var _back_button: Button
var _title_label: Label
var _level_cards: Array = []

func _ready() -> void:
	_build_ui()
	_build_level_cards()
	AudioManager.play_bgm("menu")
	DebugLog.log_info("关卡选择界面加载")

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.1, 0.16)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var main_vbox := VBoxContainer.new()
	main_vbox.anchor_left = 0.05
	main_vbox.anchor_top = 0.05
	main_vbox.anchor_right = 0.95
	main_vbox.anchor_bottom = 0.95
	main_vbox.add_theme_constant_override("separation", 20)
	add_child(main_vbox)

	var header := HBoxContainer.new()
	main_vbox.add_child(header)

	_back_button = Button.new()
	_back_button.text = "← 返回菜单"
	_back_button.custom_minimum_size = Vector2(140, 44)
	_back_button.pressed.connect(_on_back)
	header.add_child(_back_button)

	var spacer := Control.new()
	spacer.size_flags_horizontal = 3
	header.add_child(spacer)

	_title_label = Label.new()
	_title_label.text = "🗺️  选择关卡"
	_title_label.add_theme_font_size_override("font_size", 32)
	_title_label.add_theme_color_override("font_color", Color(0.9, 0.95, 1.0))
	main_vbox.add_child(_title_label)

	var subtitle := Label.new()
	subtitle.text = "完成关卡可解锁下一关 · 挑战更高满意度获得更好成绩"
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.add_theme_color_override("font_color", Color(0.65, 0.72, 0.85))
	main_vbox.add_child(subtitle)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = 3
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	main_vbox.add_child(scroll)

	_levels_grid = GridContainer.new()
	_levels_grid.columns = 3
	_levels_grid.size_flags_horizontal = 3
	_levels_grid.add_theme_constant_override("h_separation", 20)
	_levels_grid.add_theme_constant_override("v_separation", 20)
	scroll.add_child(_levels_grid)

func _build_level_cards() -> void:
	var level_ids: Array = GameState.get_level_ids_sorted()
	for lid in level_ids:
		var lvl: Dictionary = GameState.get_level(lid)
		var card := _make_level_card(lid, lvl)
		_levels_grid.add_child(card)
		_level_cards.append(card)

func _make_level_card(level_id: String, lvl: Dictionary) -> Control:
	var unlocked: bool = SaveSystem.is_level_unlocked(level_id)
	var completed: bool = SaveSystem.is_level_completed(level_id)
	var best_score: int = SaveSystem.get_level_score(level_id)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(300, 360)
	var difficulty_color: Color = _difficulty_color(lvl.get("difficulty", "普通"))
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.18, 0.26) if unlocked else Color(0.1, 0.11, 0.16)
	style.border_width_left = 3
	style.border_width_top = 3
	style.border_width_right = 3
	style.border_width_bottom = 3
	style.border_color = difficulty_color if unlocked else Color(0.3, 0.3, 0.35)
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_left = 12
	style.corner_radius_bottom_right = 12
	if unlocked:
		style.shadow_color = Color(difficulty_color.r, difficulty_color.g, difficulty_color.b, 0.2)
		style.shadow_size = 4
	panel.add_theme_stylebox_override("panel", style)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_right", 18)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_bottom", 16)
	panel.add_child(margin)

	var vb := VBoxContainer.new()
	vb.size_flags_horizontal = 3
	margin.add_child(vb)

	var header_hb := HBoxContainer.new()
	vb.add_child(header_hb)

	var order_label := Label.new()
	order_label.text = "第 %d 关" % lvl.get("order", 1)
	order_label.add_theme_font_size_override("font_size", 13)
	order_label.add_theme_color_override("font_color", difficulty_color)
	header_hb.add_child(order_label)

	var hs := Control.new()
	hs.size_flags_horizontal = 3
	header_hb.add_child(hs)

	var diff_pill := PanelContainer.new()
	var dp_style := StyleBoxFlat.new()
	dp_style.bg_color = Color(difficulty_color.r, difficulty_color.g, difficulty_color.b, 0.25)
	dp_style.corner_radius_top_left = 10
	dp_style.corner_radius_top_right = 10
	dp_style.corner_radius_bottom_left = 10
	dp_style.corner_radius_bottom_right = 10
	diff_pill.add_theme_stylebox_override("panel", dp_style)
	var dm := MarginContainer.new()
	dm.add_theme_constant_override("margin_left", 8)
	dm.add_theme_constant_override("margin_right", 8)
	dm.add_theme_constant_override("margin_top", 2)
	dm.add_theme_constant_override("margin_bottom", 2)
	diff_pill.add_child(dm)
	var dl := Label.new()
	dl.text = lvl.get("difficulty", "普通")
	dl.add_theme_font_size_override("font_size", 12)
	dl.add_theme_color_override("font_color", difficulty_color)
	dm.add_child(dl)
	header_hb.add_child(diff_pill)

	if completed:
		var done_icon := Label.new()
		done_icon.text = "  ⭐"
		done_icon.add_theme_font_size_override("font_size", 16)
		header_hb.add_child(done_icon)

	var subtitle_lbl := Label.new()
	subtitle_lbl.text = lvl.get("subtitle", "")
	subtitle_lbl.add_theme_font_size_override("font_size", 13)
	subtitle_lbl.add_theme_color_override("font_color", Color(0.55, 0.65, 0.8))
	vb.add_child(subtitle_lbl)

	var name_lbl := Label.new()
	name_lbl.text = lvl.get("name", "未命名关卡")
	name_lbl.add_theme_font_size_override("font_size", 20)
	name_lbl.add_theme_color_override("font_color", Color.WHITE if unlocked else Color(0.5, 0.5, 0.55))
	name_lbl.custom_minimum_size = Vector2(0, 56)
	name_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(name_lbl)

	var desc_lbl := Label.new()
	desc_lbl.text = lvl.get("description", "")
	desc_lbl.add_theme_font_size_override("font_size", 12)
	desc_lbl.add_theme_color_override("font_color", Color(0.7, 0.75, 0.85) if unlocked else Color(0.4, 0.4, 0.45))
	desc_lbl.size_flags_vertical = 3
	desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(desc_lbl)

	var stats_hb := HBoxContainer.new()
	stats_hb.custom_minimum_size = Vector2(0, 40)
	vb.add_child(stats_hb)

	var info_grid := GridContainer.new()
	info_grid.columns = 2
	info_grid.size_flags_horizontal = 3
	info_grid.add_theme_constant_override("h_separation", 8)
	stats_hb.add_child(info_grid)

	_info_pair(info_grid, "🎯 目标", str(lvl.get("target_satisfaction", 0)), unlocked)
	_info_pair(info_grid, "⏱️ 回合", str(lvl.get("max_turns", 0)), unlocked)
	_info_pair(info_grid, "👥 角色", str(lvl.get("characters", []).size()), unlocked)
	_info_pair(info_grid, "📋 任务", str(lvl.get("tasks", []).size()), unlocked)

	if best_score > 0:
		var best_label := Label.new()
		best_label.text = "\n🏆 最佳: %d" % best_score
		best_label.add_theme_font_size_override("font_size", 12)
		best_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.35))
		best_label.vertical_alignment = 1
		vb.add_child(best_label)

	var start_btn := Button.new()
	if unlocked:
		start_btn.text = "▶  开始挑战"
		start_btn.disabled = false
		var clicked_id: String = level_id
		start_btn.pressed.connect(func(): _on_start_level(clicked_id))
	else:
		start_btn.text = "🔒  尚未解锁"
		start_btn.disabled = true
	start_btn.custom_minimum_size = Vector2(0, 48)
	start_btn.add_theme_font_size_override("font_size", 15)
	vb.add_child(start_btn)

	return panel

func _info_pair(grid: GridContainer, k: String, v: String, enabled: bool) -> void:
	var k_lbl := Label.new()
	k_lbl.text = k
	k_lbl.add_theme_font_size_override("font_size", 11)
	k_lbl.add_theme_color_override("font_color", Color(0.55, 0.6, 0.7) if enabled else Color(0.4, 0.4, 0.45))
	grid.add_child(k_lbl)
	var v_lbl := Label.new()
	v_lbl.text = v
	v_lbl.add_theme_font_size_override("font_size", 11)
	v_lbl.add_theme_color_override("font_color", Color.WHITE if enabled else Color(0.45, 0.45, 0.5))
	v_lbl.horizontal_alignment = 2
	grid.add_child(v_lbl)

func _difficulty_color(diff: String) -> Color:
	match diff:
		"简单": return Color(0.4, 0.85, 0.55)
		"普通": return Color(0.95, 0.75, 0.35)
		"困难": return Color(0.95, 0.45, 0.5)
		_: return Color(0.7, 0.7, 0.7)

func _on_start_level(level_id: String) -> void:
	AudioManager.play_sfx("success")
	GameState.goto_battle(level_id)

func _on_back() -> void:
	AudioManager.play_sfx("click")
	GameState.goto_main_menu()
