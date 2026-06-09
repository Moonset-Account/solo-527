extends Control

signal restart_requested()
signal next_level_requested()
signal back_to_menu_requested()
signal replay_replay_requested()

enum ResultType { SUCCESS, FAILURE }

var result_type: int = ResultType.SUCCESS
var result_data: Dictionary = {}

var bg_panel: Panel
var overlay: ColorRect
var title_label: Label
var grade_label: Label
var grade_color_rect: ColorRect
var score_breakdown: VBoxContainer
var score_items: Array = []
var action_row: HBoxContainer
var retry_btn: Button
var next_btn: Button
var menu_btn: Button
var summary_label: Label
var failure_reasons_container: VBoxContainer
var anim_tween: Tween
var confetti_particles: GPUParticles2D

func _ready() -> void:
	_setup_panel()
	hide()

func _setup_panel() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	z_index = 50
	overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.6)
	overlay.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	overlay.size_flags_vertical = Control.SIZE_EXPAND_FILL
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)
	var center = CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	bg_panel = Panel.new()
	bg_panel.custom_minimum_size = Vector2(560, 500)
	bg_panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	bg_panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var bg_sb = StyleBoxFlat.new()
	bg_sb.bg_color = Color(0.1, 0.1, 0.14, 0.98)
	bg_sb.border_width_left = 2
	bg_sb.border_width_right = 2
	bg_sb.border_width_top = 2
	bg_sb.border_width_bottom = 2
	bg_sb.corner_radius_top_left = 16
	bg_sb.corner_radius_top_right = 16
	bg_sb.corner_radius_bottom_left = 16
	bg_sb.corner_radius_bottom_right = 16
	bg_sb.shadow_color = Color(0, 0, 0, 0.6)
	bg_sb.shadow_size = 20
	bg_sb.shadow_offset = Vector2(0, 8)
	bg_sb.content_margin_left = 28
	bg_sb.content_margin_right = 28
	bg_sb.content_margin_top = 24
	bg_sb.content_margin_bottom = 24
	bg_panel.add_theme_stylebox_override("panel", bg_sb)
	center.add_child(bg_panel)
	var vb = VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_theme_constant_override("separation", 12)
	bg_panel.add_child(vb)
	title_label = Label.new()
	title_label.text = "推理成功！"
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_label.add_theme_font_size_override("font_size", 28)
	title_label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.5, 1))
	title_label.custom_minimum_size.y = 44
	vb.add_child(title_label)
	var grade_hbox = HBoxContainer.new()
	grade_hbox.custom_minimum_size.y = 100
	grade_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	grade_hbox.add_theme_constant_override("separation", 16)
	vb.add_child(grade_hbox)
	grade_color_rect = ColorRect.new()
	grade_color_rect.custom_minimum_size = Vector2(90, 90)
	grade_color_rect.color = Color(1.0, 0.85, 0.2, 1)
	var grade_sb = StyleBoxFlat.new()
	grade_sb.bg_color = Color(1.0, 0.85, 0.2, 1)
	grade_sb.corner_radius_top_left = 16
	grade_sb.corner_radius_top_right = 16
	grade_sb.corner_radius_bottom_left = 16
	grade_sb.corner_radius_bottom_right = 16
	var grade_panel = Panel.new()
	grade_panel.custom_minimum_size = Vector2(90, 90)
	grade_panel.add_theme_stylebox_override("panel", grade_sb)
	grade_hbox.add_child(grade_panel)
	grade_label = Label.new()
	grade_label.text = "S"
	grade_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	grade_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	grade_label.add_theme_font_size_override("font_size", 56)
	grade_label.add_theme_color_override("font_color", Color(0.1, 0.08, 0.02, 1))
	grade_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	grade_panel.add_child(grade_label)
	var score_vb = VBoxContainer.new()
	score_vb.custom_minimum_size = Vector2(300, 90)
	score_hbox = HBoxContainer.new()
	grade_hbox.add_child(score_vb)
	var final_score_label = Label.new()
	final_score_label.text = "最终得分"
	final_score_label.add_theme_font_size_override("font_size", 14)
	final_score_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
	score_vb.add_child(final_score_label)
	var score_num_label = Label.new()
	score_num_label.name = "ScoreNumberLabel"
	score_num_label.text = "0"
	score_num_label.add_theme_font_size_override("font_size", 44)
	score_num_label.add_theme_color_override("font_color", Color(1.0, 0.92, 0.5, 1))
	score_vb.add_child(score_num_label)
	summary_label = Label.new()
	summary_label.name = "SummaryLabel"
	summary_label.text = ""
	summary_label.add_theme_font_size_override("font_size", 12)
	summary_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8, 1))
	summary_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	score_vb.add_child(summary_label)
	var sep = HSeparator.new()
	sep.custom_minimum_size.y = 6
	vb.add_child(sep)
	var breakdown_title = Label.new()
	breakdown_title.text = "【得分明细】"
	breakdown_title.add_theme_font_size_override("font_size", 14)
	breakdown_title.add_theme_color_override("font_color", Color(0.75, 0.75, 0.85, 1))
	breakdown_title.custom_minimum_size.y = 28
	vb.add_child(breakdown_title)
	var breakdown_scroll = ScrollContainer.new()
	breakdown_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	breakdown_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	breakdown_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	breakdown_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_child(breakdown_scroll)
	score_breakdown = VBoxContainer.new()
	score_breakdown.add_theme_constant_override("separation", 4)
	score_breakdown.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	breakdown_scroll.add_child(score_breakdown)
	failure_reasons_container = VBoxContainer.new()
	failure_reasons_container.name = "FailureReasons"
	failure_reasons_container.add_theme_constant_override("separation", 6)
	vb.add_child(failure_reasons_container)
	action_row = HBoxContainer.new()
	action_row.custom_minimum_size.y = 48
	action_row.alignment = BoxContainer.ALIGNMENT_CENTER
	action_row.add_theme_constant_override("separation", 14)
	vb.add_child(action_row)
	menu_btn = Button.new()
	menu_btn.text = "返回主菜单"
	menu_btn.custom_minimum_size = Vector2(140, 44)
	menu_btn.add_theme_font_size_override("font_size", 14)
	_make_button_style(menu_btn, Color(0.3, 0.32, 0.4, 1), Color(0.4, 0.42, 0.5, 1))
	menu_btn.pressed.connect(_on_menu_pressed)
	action_row.add_child(menu_btn)
	retry_btn = Button.new()
	retry_btn.text = "重新挑战"
	retry_btn.custom_minimum_size = Vector2(140, 44)
	retry_btn.add_theme_font_size_override("font_size", 14)
	_make_button_style(retry_btn, Color(0.8, 0.55, 0.2, 1), Color(0.9, 0.65, 0.3, 1))
	retry_btn.pressed.connect(_on_retry_pressed)
	action_row.add_child(retry_btn)
	next_btn = Button.new()
	next_btn.text = "下一关"
	next_btn.custom_minimum_size = Vector2(140, 44)
	next_btn.add_theme_font_size_override("font_size", 14)
	_make_button_style(next_btn, Color(0.2, 0.6, 0.85, 1), Color(0.3, 0.7, 0.95, 1))
	next_btn.pressed.connect(_on_next_pressed)
	action_row.add_child(next_btn)

func _make_button_style(btn: Button, base: Color, hover: Color) -> void:
	var sb_normal = StyleBoxFlat.new()
	sb_normal.bg_color = base
	sb_normal.corner_radius_top_left = 8
	sb_normal.corner_radius_top_right = 8
	sb_normal.corner_radius_bottom_left = 8
	sb_normal.corner_radius_bottom_right = 8
	btn.add_theme_stylebox_override("normal", sb_normal)
	var sb_hover = sb_normal.duplicate()
	sb_hover.bg_color = hover
	btn.add_theme_stylebox_override("hover", sb_hover)
	var sb_pressed = sb_normal.duplicate()
	sb_pressed.bg_color = base.darkened(0.15)
	btn.add_theme_stylebox_override("pressed", sb_pressed)
	btn.add_theme_color_override("font_color", Color.WHITE)

func show_success(data: Dictionary, has_next_level: bool = false) -> void:
	result_type = ResultType.SUCCESS
	result_data = data.duplicate(true)
	title_label.text = "🎉 推理成功！"
	title_label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.5, 1))
	var grade: String = data.get("grade", "D")
	var grade_color: Color = GameManager.get_grade_color(grade)
	var grade_panel = grade_label.get_parent() as Panel
	if grade_panel:
		var sb = grade_panel.get_theme_stylebox("panel") as StyleBoxFlat
		if sb:
			sb.bg_color = grade_color
	grade_label.text = grade
	var final_score: int = int(data.get("final_score", 0))
	var score_label = bg_panel.get_node_or_null("VBox/GradeHBox/ScoreVBox/ScoreNumberLabel")
	if score_label:
		score_label.text = str(final_score)
	else:
		var gvp: VBoxContainer = bg_panel.get_children()[0] as VBoxContainer
		if gvp and gvp.get_child_count() >= 2:
			var ghb: HBoxContainer = gvp.get_child(1)
			if ghb and ghb.get_child_count() >= 2:
				var svb: VBoxContainer = ghb.get_child(1) as VBoxContainer
				for c in svb.get_children():
					if c.name == "ScoreNumberLabel":
						(c as Label).text = str(final_score)
					elif c.name == "SummaryLabel":
						var summary_parts: Array = []
						if data.get("perfect", false):
							summary_parts.append("🏆 完美通关！")
						if int(data.get("attempts", 1)) == 1:
							summary_parts.append("⭐ 一次成功")
						if int(data.get("hints_used", 0)) == 0:
							summary_parts.append("🔍 零提示")
						var summary_text: String = ""
						for si: int in range(summary_parts.size()):
							summary_text += str(summary_parts[si])
							if si < summary_parts.size() - 1:
								summary_text += "    "
						(c as Label).text = summary_text
	_build_score_breakdown(data)
	failure_reasons_container.visible = false
	next_btn.visible = has_next_level
	show()
	_animate_in()
	_run_score_count_animation(final_score)

func show_failure(data: Dictionary) -> void:
	result_type = ResultType.FAILURE
	result_data = data.duplicate(true)
	title_label.text = "推理失败"
	title_label.add_theme_color_override("font_color", Color(0.9, 0.35, 0.35, 1))
	grade_label.text = "—"
	var grade_panel = grade_label.get_parent() as Panel
	if grade_panel:
		var sb = grade_panel.get_theme_stylebox("panel") as StyleBoxFlat
		if sb:
			sb.bg_color = Color(0.5, 0.3, 0.3, 1)
	var final_score: int = int(data.get("final_score", 0))
	var gvp: VBoxContainer = bg_panel.get_children()[0] as VBoxContainer
	if gvp and gvp.get_child_count() >= 2:
		var ghb: HBoxContainer = gvp.get_child(1)
		if ghb and ghb.get_child_count() >= 2:
			var svb: VBoxContainer = ghb.get_child(1) as VBoxContainer
			for c in svb.get_children():
				if c.name == "ScoreNumberLabel":
					(c as Label).text = str(final_score)
				elif c.name == "SummaryLabel":
					(c as Label).text = "达到最大尝试次数，请重新挑战。"
	_build_score_breakdown(data)
	_build_failure_reasons(data)
	next_btn.visible = false
	show()
	_animate_in()

func _build_score_breakdown(data: Dictionary) -> void:
	for c in score_breakdown.get_children():
		c.queue_free()
	var sc: Dictionary = ConfigManager.scoring_config
	var items: Array = [
		{"label": "基础分数", "value": int(sc.get("base_score", 0))},
		{"label": "时间线正确 (%d/%d)" % [int(data.get("cards_correct", 0)), int(data.get("cards_total", 0))], "value": int(data.get("cards_correct", 0)) * int(sc.get("per_card_correct", 0))},
		{"label": "标签正确 (%d/%d)" % [int(data.get("tags_correct", 0)), int(data.get("tags_total", 0))], "value": int(data.get("tags_correct", 0)) * int(sc.get("per_tag_correct", 0))},
		{"label": "关联正确 (%d/%d)" % [int(data.get("links_correct", 0)), int(data.get("links_total", 0))], "value": int(data.get("links_correct", 0)) * int(sc.get("per_link_correct", 0))}
	]
	if int(data.get("hints_used", 0)) > 0:
		var hint_penalties: Array = sc.get("hint_penalty", [0, 0, 0, 0])
		var hp = 0
		if int(data.get("hints_used", 0)) < hint_penalties.size():
			hp = int(hint_penalties[int(data.get("hints_used", 0))])
		items.append({"label": "提示惩罚 (级别%d)" % int(data.get("hints_used", 0)), "value": -hp})
	if int(data.get("attempts", 1)) > 1:
		items.append({"label": "重试惩罚 (x%d)" % (int(data.get("attempts", 1)) - 1), "value": -(int(data.get("attempts", 1)) - 1) * int(sc.get("attempt_penalty", 0))})
	if int(data.get("hints_used", 0)) == 0:
		items.append({"label": "零提示奖励", "value": int(sc.get("no_hint_bonus", 0))})
	if int(data.get("attempts", 1)) == 1 and data.get("all_cards_correct", false):
		items.append({"label": "一次成功奖励", "value": int(sc.get("first_try_bonus", 0))})
	if data.get("perfect", false):
		items.append({"label": "完美奖励", "value": int(sc.get("perfect_bonus", 0))})
	for item in items:
		if int(item["value"]) == 0:
			continue
		var row = HBoxContainer.new()
		row.custom_minimum_size.y = 26
		row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		score_breakdown.add_child(row)
		var lbl = Label.new()
		lbl.text = item["label"]
		lbl.add_theme_font_size_override("font_size", 12)
		lbl.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8, 1))
		lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(lbl)
		var val = Label.new()
		var v: int = int(item["value"])
		val.text = ("+" if v > 0 else "") + str(v)
		val.add_theme_font_size_override("font_size", 12)
		val.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		val.add_theme_color_override("font_color", Color(0.5, 0.85, 0.6, 1) if v > 0 else Color(0.9, 0.5, 0.5, 1))
		val.custom_minimum_size.x = 80
		row.add_child(val)

func _build_failure_reasons(data: Dictionary) -> void:
	for c in failure_reasons_container.get_children():
		c.queue_free()
	var reasons: Array = data.get("failure_reasons", [])
	if reasons.is_empty():
		failure_reasons_container.visible = false
		return
	failure_reasons_container.visible = true
	var title = Label.new()
	title.text = "【失败原因分析】"
	title.add_theme_font_size_override("font_size", 13)
	title.add_theme_color_override("font_color", Color(0.95, 0.65, 0.65, 1))
	title.custom_minimum_size.y = 28
	failure_reasons_container.add_child(title)
	for reason in reasons:
		var row = HBoxContainer.new()
		row.custom_minimum_size.y = 24
		failure_reasons_container.add_child(row)
		var icon = Label.new()
		icon.text = "•"
		icon.custom_minimum_size.x = 20
		icon.add_theme_font_size_override("font_size", 14)
		icon.add_theme_color_override("font_color", Color(0.95, 0.5, 0.5, 1))
		row.add_child(icon)
		var lbl = Label.new()
		lbl.text = str(reason)
		lbl.add_theme_font_size_override("font_size", 12)
		lbl.add_theme_color_override("font_color", Color(0.85, 0.7, 0.7, 1))
		lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(lbl)

func _run_score_count_animation(target_score: int) -> void:
	var gvp: VBoxContainer = bg_panel.get_children()[0] as VBoxContainer
	if not gvp or gvp.get_child_count() < 2:
		return
	var ghb: HBoxContainer = gvp.get_child(1)
	if not ghb or ghb.get_child_count() < 2:
		return
	var svb: VBoxContainer = ghb.get_child(1) as VBoxContainer
	var score_label: Label = null
	for c in svb.get_children():
		if c.name == "ScoreNumberLabel":
			score_label = c as Label
			break
	if not score_label:
		return
	var tw = create_tween()
	var score_prop = { "v": 0 }
	tw.tween_property(score_prop, "v", target_score, 1.2 * GameManager.animation_speed).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_interval(1.0 / 60.0).set_loops(72).as_looped().connect("finished", func(): score_label.text = str(int(score_prop.v)))

func _animate_in() -> void:
	if anim_tween:
		anim_tween.kill()
	modulate.a = 0.0
	bg_panel.scale = Vector2(0.8, 0.8)
	overlay.modulate.a = 0.0
	anim_tween = create_tween()
	anim_tween.set_parallel(true)
	anim_tween.tween_property(self, "modulate:a", 1.0, 0.25 * GameManager.animation_speed)
	anim_tween.tween_property(overlay, "modulate:a", 0.6, 0.3 * GameManager.animation_speed)
	anim_tween.tween_property(bg_panel, "scale", Vector2.ONE, 0.35 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _on_retry_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("restart_requested")

func _on_next_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("next_level_requested")

func _on_menu_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("back_to_menu_requested")
