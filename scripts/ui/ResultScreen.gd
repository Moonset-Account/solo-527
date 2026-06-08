extends Control

var _title_label: Label
var _subtitle_label: Label
var _result_icon: Label
var _stats_grid: GridContainer
var _breakdown_vbox: VBoxContainer
var _next_goal_label: Label
var _reward_label: Label
var _button_retry: Button
var _button_next: Button
var _button_menu: Button

var _victory: bool = false
var _current_level_id: String = ""

func _ready() -> void:
	_victory = GameState.last_battle_victory
	_current_level_id = GameState.current_level_id
	_build_ui()
	_fill_result()
	_connect_signals()
	if _victory:
		AudioManager.play_sfx("task_done")
	else:
		AudioManager.play_sfx("fail")
	DebugLog.log_info("结算界面加载 - 胜利: %s, 关卡: %s" % [_victory, _current_level_id])

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.06, 0.08, 0.14)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var overlay := ColorRect.new()
	if _victory:
		overlay.color = Color(0.15, 0.35, 0.2, 0.25)
	else:
		overlay.color = Color(0.35, 0.15, 0.2, 0.25)
	overlay.anchor_right = 1.0
	overlay.anchor_bottom = 1.0
	add_child(overlay)

	var main_panel := PanelContainer.new()
	main_panel.anchor_left = 0.5
	main_panel.anchor_top = 0.5
	main_panel.anchor_right = 0.5
	main_panel.anchor_bottom = 0.5
	main_panel.offset_left = -420
	main_panel.offset_top = -340
	main_panel.offset_right = 420
	main_panel.offset_bottom = 340
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.14, 0.17, 0.25)
	style.border_width_left = 3
	style.border_width_top = 3
	style.border_width_right = 3
	style.border_width_bottom = 3
	if _victory:
		style.border_color = Color(0.4, 0.85, 0.55)
		style.shadow_color = Color(0.3, 0.8, 0.5, 0.35)
	else:
		style.border_color = Color(0.9, 0.5, 0.55)
		style.shadow_color = Color(0.9, 0.4, 0.5, 0.3)
	style.shadow_size = 12
	style.corner_radius_top_left = 14
	style.corner_radius_top_right = 14
	style.corner_radius_bottom_left = 14
	style.corner_radius_bottom_right = 14
	main_panel.add_theme_stylebox_override("panel", style)
	add_child(main_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 32)
	margin.add_theme_constant_override("margin_right", 32)
	margin.add_theme_constant_override("margin_top", 24)
	margin.add_theme_constant_override("margin_bottom", 24)
	main_panel.add_child(margin)

	var main_vbox := VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 12)
	margin.add_child(main_vbox)

	var result_header := HBoxContainer.new()
	main_vbox.add_child(result_header)

	_result_icon = Label.new()
	_result_icon.text = "🏆" if _victory else "💧"
	_result_icon.add_theme_font_size_override("font_size", 42)
	_result_icon.custom_minimum_size = Vector2(64, 0)
	result_header.add_child(_result_icon)

	var titles_vb := VBoxContainer.new()
	titles_vb.size_flags_horizontal = 3
	result_header.add_child(titles_vb)

	_title_label = Label.new()
	_title_label.text = "活动胜利！" if _victory else "活动结束"
	_title_label.add_theme_font_size_override("font_size", 30)
	if _victory:
		_title_label.add_theme_color_override("font_color", Color(0.55, 1.0, 0.7))
	else:
		_title_label.add_theme_color_override("font_color", Color(1.0, 0.6, 0.65))
	titles_vb.add_child(_title_label)

	_subtitle_label = Label.new()
	_subtitle_label.text = ""
	_subtitle_label.add_theme_font_size_override("font_size", 14)
	_subtitle_label.add_theme_color_override("font_color", Color(0.65, 0.72, 0.85))
	titles_vb.add_child(_subtitle_label)

	var sep := HSeparator.new()
	sep.add_theme_color_override("separator_color", Color(0.3, 0.4, 0.6))
	main_vbox.add_child(sep)

	_stats_grid = GridContainer.new()
	_stats_grid.columns = 2
	_stats_grid.add_theme_constant_override("h_separation", 24)
	_stats_grid.add_theme_constant_override("v_separation", 6)
	main_vbox.add_child(_stats_grid)

	var breakdown_title := Label.new()
	breakdown_title.text = "📊  满意度构成"
	breakdown_title.add_theme_font_size_override("font_size", 14)
	breakdown_title.add_theme_color_override("font_color", Color(0.7, 0.8, 0.95))
	breakdown_title.custom_minimum_size = Vector2(0, 28)
	main_vbox.add_child(breakdown_title)

	var breakdown_scroll := ScrollContainer.new()
	breakdown_scroll.size_flags_vertical = 3
	breakdown_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	breakdown_scroll.custom_minimum_size = Vector2(0, 140)
	main_vbox.add_child(breakdown_scroll)

	_breakdown_vbox = VBoxContainer.new()
	_breakdown_vbox.size_flags_horizontal = 3
	_breakdown_vbox.add_theme_constant_override("separation", 4)
	breakdown_scroll.add_child(_breakdown_vbox)

	_reward_label = Label.new()
	_reward_label.text = ""
	_reward_label.add_theme_font_size_override("font_size", 14)
	_reward_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if _victory:
		_reward_label.add_theme_color_override("font_color", Color(1.0, 0.88, 0.5))
	else:
		_reward_label.add_theme_color_override("font_color", Color(0.9, 0.7, 0.7))
	main_vbox.add_child(_reward_label)

	_next_goal_label = Label.new()
	_next_goal_label.text = ""
	_next_goal_label.add_theme_font_size_override("font_size", 13)
	_next_goal_label.add_theme_color_override("font_color", Color(0.55, 0.75, 1.0))
	_next_goal_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	main_vbox.add_child(_next_goal_label)

	var sep2 := HSeparator.new()
	sep2.add_theme_color_override("separator_color", Color(0.3, 0.4, 0.6))
	main_vbox.add_child(sep2)

	var buttons_row := HBoxContainer.new()
	buttons_row.add_theme_constant_override("separation", 12)
	main_vbox.add_child(buttons_row)

	_button_menu = Button.new()
	_button_menu.text = "🏠 主菜单"
	_button_menu.custom_minimum_size = Vector2(0, 48)
	_button_menu.add_theme_font_size_override("font_size", 14)
	_button_menu.size_flags_horizontal = 3
	buttons_row.add_child(_button_menu)

	_button_retry = Button.new()
	_button_retry.text = "🔄 再次挑战"
	_button_retry.custom_minimum_size = Vector2(0, 48)
	_button_retry.add_theme_font_size_override("font_size", 14)
	_button_retry.size_flags_horizontal = 3
	buttons_row.add_child(_button_retry)

	_button_next = Button.new()
	_button_next.text = "➡️ 下一关"
	_button_next.custom_minimum_size = Vector2(0, 48)
	_button_next.add_theme_font_size_override("font_size", 14)
	_button_next.size_flags_horizontal = 3
	buttons_row.add_child(_button_next)

func _fill_result() -> void:
	var lvl: Dictionary = GameState.get_level(_current_level_id)
	var stats: Dictionary = GameState.battle_stats
	var target_sat: int = lvl.get("target_satisfaction", 0)
	var final_sat: int = stats.get("final_satisfaction", 0)

	_subtitle_label.text = "%s · %s" % [lvl.get("name", ""), lvl.get("subtitle", "")]

	_add_stat("🎯 目标满意度", str(target_sat))
	var sat_color_str := "ok" if final_sat >= target_sat else "bad"
	_add_stat_colored("📈 最终满意度", "%d / %d" % [final_sat, target_sat], sat_color_str)
	_add_stat("⏱️ 使用回合", "%d / %d" % [stats.get("turns_used", 0), lvl.get("max_turns", 0)])
	_add_stat("📋 完成任务", "%d / %d" % [stats.get("tasks_completed", 0), stats.get("tasks_total", 0)])
	_add_stat("✨ 使用技能", str(stats.get("skills_used", 0)))
	_add_stat("📜 触发事件", str(stats.get("events_triggered", 0)))
	_add_stat("👥 参与角色", str(stats.get("characters_used", []).size()))

	var rating := _calc_rating(final_sat, target_sat)
	_add_stat_colored("🏅 评价星级", rating, "ok")

	for c in _breakdown_vbox.get_children():
		c.queue_free()
	_add_breakdown_item("起始满意度", lvl.get("starting_satisfaction", 0))
	_add_breakdown_item("已完成任务累计奖励", stats.get("tasks_completed_sat", 0))
	_add_breakdown_item("技能满意度加成", stats.get("skills_sat", 0))
	_add_breakdown_item("剧情事件影响", stats.get("events_sat", 0))
	var turn_penalty_total: int = (lvl.get("turn_satisfaction_penalty", 0) * max(0, stats.get("turns_used", 0) - 1))
	if turn_penalty_total != 0:
		_add_breakdown_item("回合消耗惩罚", -turn_penalty_total)
	_add_breakdown_item("未完成任务惩罚", stats.get("incomplete_penalty", 0), true)

	var rewards: Dictionary = lvl.get("rewards", {})
	if _victory:
		var bonus_story: String = rewards.get("bonus_story", "")
		if bonus_story != "":
			_reward_label.text = "🎁 奖励: " + bonus_story
		if rewards.get("next_unlock", false):
			var next_ids: Array = GameState.get_level_ids_sorted()
			var cur_idx: int = next_ids.find(_current_level_id)
			if cur_idx >= 0 and cur_idx < next_ids.size() - 1:
				var next_lvl: Dictionary = GameState.get_level(next_ids[cur_idx + 1])
				_next_goal_label.text = "🔓 已解锁下一关: " + next_lvl.get("name", "")
				_button_next.disabled = false
			else:
				_button_next.disabled = true
				_next_goal_label.text = "🎉 你已通关所有关卡！"
	else:
		_reward_label.text = "💡 分析: 满意度不足目标，建议重点提升效率或合理使用技能。"
		var diff: int = target_sat - final_sat
		_next_goal_label.text = "🎯 距胜利还差 %d 满意度，建议尝试：\n    • 优先完成高奖励任务\n    • 将角色分配到对应属性任务\n    • 使用全局技能获得额外加成" % diff
		_button_next.disabled = true

func _calc_rating(final_sat: int, target_sat: int) -> String:
	if target_sat <= 0:
		return "★☆☆"
	var ratio: float = float(final_sat) / float(target_sat)
	if ratio >= 1.5:
		return "★★★ (完美!)"
	elif ratio >= 1.2:
		return "★★★"
	elif ratio >= 1.0:
		return "★★☆"
	elif ratio >= 0.8:
		return "★☆☆"
	else:
		return "☆☆☆"

func _add_stat(label: String, value: String) -> void:
	_add_stat_colored(label, value, "normal")

func _add_stat_colored(label: String, value: String, color_kind: String) -> void:
	var k := Label.new()
	k.text = label
	k.add_theme_font_size_override("font_size", 14)
	k.add_theme_color_override("font_color", Color(0.65, 0.72, 0.85))
	_stats_grid.add_child(k)
	var v := Label.new()
	v.text = value
	v.horizontal_alignment = 2
	v.add_theme_font_size_override("font_size", 15)
	match color_kind:
		"ok": v.add_theme_color_override("font_color", Color(0.55, 1.0, 0.7))
		"bad": v.add_theme_color_override("font_color", Color(1.0, 0.55, 0.6))
		_: v.add_theme_color_override("font_color", Color.WHITE)
	_stats_grid.add_child(v)

func _add_breakdown_item(label: String, value: int, _force: bool = false) -> void:
	if value == 0 and not _force:
		return
	var hb := HBoxContainer.new()
	hb.size_flags_horizontal = 3
	var k := Label.new()
	k.text = "  · " + label
	k.add_theme_font_size_override("font_size", 13)
	k.add_theme_color_override("font_color", Color(0.72, 0.78, 0.9))
	k.size_flags_horizontal = 3
	hb.add_child(k)
	var v := Label.new()
	var sign: String = "+" if value >= 0 else ""
	v.text = "%s%d" % [sign, value]
	v.horizontal_alignment = 2
	v.add_theme_font_size_override("font_size", 13)
	if value > 0:
		v.add_theme_color_override("font_color", Color(0.55, 1.0, 0.7))
	elif value < 0:
		v.add_theme_color_override("font_color", Color(1.0, 0.55, 0.6))
	else:
		v.add_theme_color_override("font_color", Color(0.7, 0.7, 0.75))
	hb.add_child(v)
	_breakdown_vbox.add_child(hb)

func _connect_signals() -> void:
	_button_menu.pressed.connect(func():
		AudioManager.play_sfx("click")
		GameState.goto_main_menu()
	)
	_button_retry.pressed.connect(func():
		AudioManager.play_sfx("click")
		GameState.goto_battle(_current_level_id)
	)
	_button_next.pressed.connect(_on_next)

func _on_next() -> void:
	AudioManager.play_sfx("success")
	var next_ids: Array = GameState.get_level_ids_sorted()
	var cur_idx: int = next_ids.find(_current_level_id)
	if cur_idx >= 0 and cur_idx < next_ids.size() - 1:
		GameState.goto_battle(next_ids[cur_idx + 1])
	else:
		GameState.goto_main_menu()
