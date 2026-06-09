extends Control

signal retry_clicked()
signal next_level()
signal back_to_title()

var overlay: ColorRect
var panel: PanelContainer
var result_data: Dictionary = {}

func _ready():
	AudioManager.play_sfx("success" if result_data.get("victory", false) else "fail")
	_build_ui()

func set_result(data: Dictionary):
	result_data = data

func _build_ui():
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.65)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	overlay.modulate.a = 0
	var ft: Tween = create_tween()
	ft.tween_property(overlay, "modulate:a", 1.0, 0.25)
	var center: CenterContainer = CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	panel = PanelContainer.new()
	var victory: bool = result_data.get("victory", false)
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.1, 0.16, 0.12) if victory else Color(0.18, 0.1, 0.12)
	sb.corner_radius_top_left = 18
	sb.corner_radius_top_right = 18
	sb.corner_radius_bottom_left = 18
	sb.corner_radius_bottom_right = 18
	sb.content_margin_left = 40
	sb.content_margin_right = 40
	sb.content_margin_top = 28
	sb.content_margin_bottom = 28
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(0.4, 0.9, 0.55) if victory else Color(0.95, 0.45, 0.45)
	panel.add_theme_stylebox_override("panel", sb)
	center.add_child(panel)
	panel.scale = Vector2(0.8, 0.8)
	panel.modulate.a = 0
	var tw: Tween = create_tween()
	tw.tween_property(panel, "scale", Vector2.ONE, 0.35).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(panel, "modulate:a", 1.0, 0.3)
	var mv: VBoxContainer = VBoxContainer.new()
	mv.add_theme_constant_override("separation", 14)
	mv.custom_minimum_size = Vector2(520, 0)
	panel.add_child(mv)
	var icon_text: String = "🎉 活动圆满成功！" if victory else "💔 活动失败..."
	var title_color: Color = Color(1, 0.9, 0.3) if victory else Color(1.0, 0.55, 0.55)
	var title_lbl: Label = Label.new()
	title_lbl.text = icon_text
	title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_lbl.add_theme_font_size_override("font_size", 40)
	title_lbl.modulate = title_color
	mv.add_child(title_lbl)
	var reason: Label = Label.new()
	reason.text = result_data.get("reason", "")
	reason.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	reason.add_theme_font_size_override("font_size", 16)
	reason.modulate = Color(0.8, 0.85, 0.95)
	mv.add_child(reason)
	var divider: ColorRect = ColorRect.new()
	divider.color = Color(0.3, 0.35, 0.5)
	divider.custom_minimum_size = Vector2(0, 2)
	divider.add_theme_constant_override("margin_top", 6)
	divider.add_theme_constant_override("margin_bottom", 6)
	mv.add_child(divider)
	var stats_grid: GridContainer = GridContainer.new()
	stats_grid.columns = 2
	stats_grid.add_theme_constant_override("h_separation", 24)
	stats_grid.add_theme_constant_override("v_separation", 8)
	mv.add_child(stats_grid)
	var stat_pairs: Array = [
		["使用回合数", "%d / %d" % [int(result_data.get("turns_used", 0)), int(result_data.get("turns_used", 0) < 1 and 1 or GameManager.max_turns)]],
		["最终满意度", "%+g / %d" % [float(result_data.get("final_satisfaction", 0)), int(result_data.get("target_satisfaction", 1))]],
		["完成任务", "%d / %d (要求 %d)" % [int(result_data.get("tasks_completed", 0)), int(result_data.get("total_tasks", 0)), int(result_data.get("tasks_required", 0))]]
	]
	stat_pairs[0][1] = "%d / %d" % [int(result_data.get("turns_used", 0)), int(GameManager.max_turns if GameManager.max_turns > 0 else result_data.get("turns_used", 1))]
	var turn_limit: int = int(GameManager.level_data.get("win_condition", {}).get("turn_limit", 0))
	if turn_limit > 0:
		stat_pairs[0][1] = "%d / %d" % [int(result_data.get("turns_used", 0)), turn_limit]
	var rating: String = ""
	var rating_color: Color = Color.WHITE
	if victory:
		var sat: float = float(result_data.get("final_satisfaction", 0))
		var target: float = float(result_data.get("target_satisfaction", 1))
		var turns: int = int(result_data.get("turns_used", 1))
		var limit: int = int(GameManager.level_data.get("win_condition", {}).get("turn_limit", 10))
		var ratio: float = sat / max(target, 1.0)
		var turn_ratio: float = 1.0 - float(turns) / float(max(limit, 1))
		var score: float = ratio * 0.6 + turn_ratio * 0.4
		if score >= 1.4:
			rating = "🏆 S级 完美通关！"
			rating_color = Color(1, 0.85, 0.3)
		elif score >= 1.15:
			rating = "⭐ A级 表现优秀"
			rating_color = Color(0.55, 0.9, 1.0)
		elif score >= 0.9:
			rating = "✨ B级 顺利完成"
			rating_color = Color(0.6, 0.95, 0.6)
		else:
			rating = "✓ C级 勉强过关"
			rating_color = Color.WHITE
	else:
		rating = "💡 再接再厉！"
		rating_color = Color(0.95, 0.6, 0.6)
	for sp in stat_pairs:
		var k: Label = Label.new()
		k.text = sp[0] + "："
		k.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		k.add_theme_font_size_override("font_size", 17)
		k.modulate = Color(0.75, 0.8, 0.92)
		stats_grid.add_child(k)
		var v2: Label = Label.new()
		v2.text = str(sp[1])
		v2.add_theme_font_size_override("font_size", 17)
		v2.modulate = Color.WHITE
		stats_grid.add_child(v2)
	var rating_lbl: Label = Label.new()
	rating_lbl.text = "评级：" + rating
	rating_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rating_lbl.add_theme_font_size_override("font_size", 22)
	rating_lbl.modulate = rating_color
	rating_lbl.add_theme_constant_override("margin_top", 8)
	mv.add_child(rating_lbl)
	if SaveSystem.get_completed_levels().size() > 0:
		var progress: Label = Label.new()
		progress.text = "已通关：%d / %d 个关卡" % [SaveSystem.get_completed_levels().size(), ConfigLoader.level_list.get("levels", []).size()]
		progress.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		progress.add_theme_font_size_override("font_size", 13)
		progress.modulate = Color(0.65, 0.7, 0.85)
		mv.add_child(progress)
	var spacer2: Control = Control.new()
	spacer2.custom_minimum_size = Vector2(0, 10)
	mv.add_child(spacer2)
	var btn_h: HBoxContainer = HBoxContainer.new()
	btn_h.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_h.add_theme_constant_override("separation", 16)
	mv.add_child(btn_h)
	var retry: StyledButton = StyledButton.new("🔄 重试关卡", Color(0.55, 0.4, 0.15), Color(0.7, 0.55, 0.25))
	retry.custom_minimum_size = Vector2(190, 52)
	retry.pressed.connect(func _(): AudioManager.play_sfx("click"); _close_and(func _(): emit_signal("retry_clicked")))
	btn_h.add_child(retry)
	var next_btn: StyledButton = null
	var completed_levels: Array = SaveSystem.get_completed_levels()
	var levels: Array = ConfigLoader.level_list.get("levels", [])
	var current_lv_idx: int = -1
	var current_id: String = result_data.get("level_id", "")
	for i in levels.size():
		if levels[i].get("level_id", "") == current_id:
			current_lv_idx = i
			break
	if victory and current_lv_idx >= 0 and current_lv_idx + 1 < levels.size():
		var next_id: String = levels[current_lv_idx + 1].get("level_id", "")
		if ConfigLoader.is_level_unlocked(next_id, completed_levels):
			next_btn = StyledButton.new("▶️ 下一关", Color(0.2, 0.55, 0.3), Color(0.35, 0.7, 0.45))
			next_btn.custom_minimum_size = Vector2(190, 52)
			next_btn.pressed.connect(func _(): AudioManager.play_sfx("click"); _close_and(func _(): emit_signal("next_level")))
			btn_h.add_child(next_btn)
	var back: StyledButton = StyledButton.new("🏠 主菜单", Color(0.3, 0.25, 0.5), Color(0.45, 0.4, 0.65))
	back.custom_minimum_size = Vector2(190, 52)
	back.pressed.connect(func _(): AudioManager.play_sfx("click"); _close_and(func _(): emit_signal("back_to_title")))
	btn_h.add_child(back)

func _close_and(cb: Callable):
	var tw: Tween = create_tween()
	tw.tween_property(panel, "scale", Vector2(0.9, 0.9), 0.18)
	tw.parallel().tween_property(overlay, "modulate:a", 0.0, 0.18)
	tw.tween_callback(queue_free)
	tw.tween_callback(cb)
