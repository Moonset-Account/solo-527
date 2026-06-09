extends Control

signal end_turn_clicked()
signal pause_clicked()
signal skill_used(skill_idx: int)
signal work_clicked()

var top_bar: PanelContainer
var turn_label: Label
var sat_label: Label
var sat_bar: ColorRect
var sat_bg: ColorRect
var task_label: Label
var selected_info: PanelContainer
var skill_buttons_container: HBoxContainer
var end_turn_btn: StyledButton
var pause_btn: StyledButton
var work_btn: StyledButton
var bottom_bar: Control
var toast_container: VBoxContainer
var toasts: Array = []

func _ready():
	_build_ui()
	GameManager.connect("turn_changed", _on_turn_changed)
	GameManager.connect("satisfaction_changed", _on_sat_changed)
	GameManager.connect("character_selected", _on_char_selected)
	GameManager.connect("toast_message", _on_toast)
	GameManager.connect("task_completed", _on_task_done)
	_refresh_all()

func _build_ui():
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_preset(Control.PRESET_FULL_RECT)
	top_bar = PanelContainer.new()
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.08, 0.14, 0.9)
	sb.corner_radius_bottom_left = 10
	sb.corner_radius_bottom_right = 10
	top_bar.add_theme_stylebox_override("panel", sb)
	top_bar.anchor_left = 0
	top_bar.anchor_right = 1
	top_bar.offset_left = 0
	top_bar.offset_right = 0
	top_bar.offset_top = 0
	top_bar.offset_bottom = 56
	top_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(top_bar)
	var top_h: HBoxContainer = HBoxContainer.new()
	top_h.add_theme_constant_override("separation", 32)
	top_h.add_theme_constant_override("margin_left", 20)
	top_h.add_theme_constant_override("margin_right", 20)
	top_h.add_theme_constant_override("margin_top", 10)
	top_h.add_theme_constant_override("margin_bottom", 10)
	top_bar.add_child(top_h)
	var title_lbl: Label = Label.new()
	title_lbl.text = "🎯 社团活动战术棋"
	title_lbl.add_theme_font_size_override("font_size", 20)
	title_lbl.modulate = Color(1, 0.9, 0.5)
	top_h.add_child(title_lbl)
	turn_label = Label.new()
	turn_label.text = "回合 1/10"
	turn_label.add_theme_font_size_override("font_size", 17)
	turn_label.modulate = Color.LIGHT_BLUE
	top_h.add_child(turn_label)
	var sat_container: HBoxContainer = HBoxContainer.new()
	sat_container.add_theme_constant_override("separation", 8)
	top_h.add_child(sat_container)
	var sat_icon: Label = Label.new()
	sat_icon.text = "😊"
	sat_icon.add_theme_font_size_override("font_size", 20)
	sat_container.add_child(sat_icon)
	sat_label = Label.new()
	sat_label.text = "满意度 0/30"
	sat_label.add_theme_font_size_override("font_size", 17)
	sat_label.modulate = Color.WHITE
	sat_container.add_child(sat_label)
	sat_bg = ColorRect.new()
	sat_bg.color = Color(0.2, 0.22, 0.3)
	sat_bg.custom_minimum_size = Vector2(200, 14)
	sat_container.add_child(sat_bg)
	sat_bar = ColorRect.new()
	sat_bar.color = Color(0.4, 0.85, 0.5)
	sat_bar.custom_minimum_size = Vector2(0, 14)
	sat_container.add_child(sat_bar)
	task_label = Label.new()
	task_label.text = "任务 0/2"
	task_label.add_theme_font_size_override("font_size", 17)
	task_label.modulate = Color.WHITE
	top_h.add_child(task_label)
	var spacer: Control = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_h.add_child(spacer)
	pause_btn = StyledButton.new("⏸ 暂停", Color(0.35, 0.35, 0.45), Color(0.5, 0.5, 0.6))
	pause_btn.custom_minimum_size = Vector2(110, 38)
	pause_btn.pressed.connect(_on_pause)
	top_h.add_child(pause_btn)
	selected_info = PanelContainer.new()
	var sb2: StyleBoxFlat = StyleBoxFlat.new()
	sb2.bg_color = Color(0.08, 0.1, 0.2, 0.9)
	sb2.corner_radius_top_left = 10
	sb2.corner_radius_top_right = 10
	sb2.corner_radius_bottom_left = 10
	sb2.corner_radius_bottom_right = 10
	sb2.content_margin_left = 14
	sb2.content_margin_right = 14
	sb2.content_margin_top = 10
	sb2.content_margin_bottom = 10
	selected_info.add_theme_stylebox_override("panel", sb2)
	selected_info.anchor_left = 0
	selected_info.offset_left = 16
	selected_info.anchor_top = 1
	selected_info.offset_top = -180
	selected_info.offset_bottom = -16
	selected_info.size = Vector2(360, 164)
	selected_info.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(selected_info)
	var sel_v: VBoxContainer = VBoxContainer.new()
	sel_v.add_theme_constant_override("separation", 6)
	selected_info.add_child(sel_v)
	var sel_header: HBoxContainer = HBoxContainer.new()
	sel_header.add_theme_constant_override("separation", 10)
	sel_v.add_child(sel_header)
	var sel_emoji: Label = Label.new()
	sel_emoji.name = "emoji"
	sel_emoji.text = "👤"
	sel_emoji.add_theme_font_size_override("font_size", 28)
	sel_header.add_child(sel_emoji)
	var sel_name_v: VBoxContainer = VBoxContainer.new()
	sel_name_v.add_theme_constant_override("separation", 2)
	sel_header.add_child(sel_name_v)
	var sel_name: Label = Label.new()
	sel_name.name = "name"
	sel_name.text = "未选择角色"
	sel_name.add_theme_font_size_override("font_size", 19)
	sel_name.modulate = Color.WHITE
	sel_name_v.add_child(sel_name)
	var sel_title: Label = Label.new()
	sel_title.name = "title"
	sel_title.text = "点击角色选择"
	sel_title.add_theme_font_size_override("font_size", 12)
	sel_title.modulate = Color(0.7, 0.75, 0.9)
	sel_name_v.add_child(sel_title)
	var sel_stats: HBoxContainer = HBoxContainer.new()
	sel_stats.name = "stats_row"
	sel_stats.add_theme_constant_override("separation", 14)
	sel_stats.add_theme_constant_override("margin_top", 4)
	sel_v.add_child(sel_stats)
	var ap_info: HBoxContainer = HBoxContainer.new()
	ap_info.name = "ap_row"
	ap_info.add_theme_constant_override("separation", 8)
	sel_v.add_child(ap_info)
	var ap_bg2: ColorRect = ColorRect.new()
	ap_bg2.color = Color(0.2, 0.22, 0.3)
	ap_bg2.custom_minimum_size = Vector2(220, 10)
	ap_info.add_child(ap_bg2)
	var ap_bar2: ColorRect = ColorRect.new()
	ap_bar2.name = "ap_bar"
	ap_bar2.color = Color(0.4, 0.85, 0.5)
	ap_bar2.custom_minimum_size = Vector2(0, 10)
	ap_info.add_child(ap_bar2)
	var ap_text: Label = Label.new()
	ap_text.name = "ap_text"
	ap_text.text = "AP 0/0"
	ap_text.add_theme_font_size_override("font_size", 12)
	ap_text.modulate = Color(0.8, 0.9, 1.0)
	ap_info.add_child(ap_text)
	var skills_header: Label = Label.new()
	skills_header.text = "技能 (快捷键 1 2 3)"
	skills_header.add_theme_font_size_override("font_size", 12)
	skills_header.modulate = Color(0.7, 0.8, 0.95)
	skills_header.add_theme_constant_override("margin_top", 4)
	sel_v.add_child(skills_header)
	skill_buttons_container = HBoxContainer.new()
	skill_buttons_container.name = "skill_btns"
	skill_buttons_container.add_theme_constant_override("separation", 8)
	sel_v.add_child(skill_buttons_container)
	var right_col: PanelContainer = PanelContainer.new()
	var sb3: StyleBoxFlat = StyleBoxFlat.new()
	sb3.bg_color = Color(0.08, 0.1, 0.2, 0.9)
	sb3.corner_radius_top_left = 10
	sb3.corner_radius_bottom_left = 10
	sb3.content_margin_left = 14
	sb3.content_margin_right = 14
	sb3.content_margin_top = 10
	sb3.content_margin_bottom = 10
	right_col.add_theme_stylebox_override("panel", sb3)
	right_col.anchor_right = 1
	right_col.offset_right = -16
	right_col.anchor_top = 1
	right_col.offset_top = -220
	right_col.offset_bottom = -16
	right_col.size = Vector2(320, 204)
	right_col.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(right_col)
	var right_v: VBoxContainer = VBoxContainer.new()
	right_v.add_theme_constant_override("separation", 10)
	right_col.add_child(right_v)
	var hint_title: Label = Label.new()
	hint_title.text = "💡 操作提示"
	hint_title.add_theme_font_size_override("font_size", 16)
	hint_title.modulate = Color(0.8, 0.9, 1.0)
	right_v.add_child(hint_title)
	var hint_lines: Array = [
		"🎯 点击角色选中，再点蓝色格移动",
		"🔨 站在任务旁，点击【工作】按钮",
		"✨ 按1/2/3使用角色独特技能",
		"⏭ 按E键或按钮结束当前回合",
		"⚠ 满意度过低或回合用尽会失败",
		"🎪 布展 · 📣 宣传 · 🤝 接待"]
	for line in hint_lines:
		var l: Label = Label.new()
		l.text = line
		l.add_theme_font_size_override("font_size", 12)
		l.modulate = Color(0.75, 0.8, 0.92)
		right_v.add_child(l)
	bottom_bar = Control.new()
	bottom_bar.anchor_left = 0
	bottom_bar.anchor_right = 1
	bottom_bar.anchor_top = 1
	bottom_bar.offset_top = -72
	bottom_bar.offset_bottom = -16
	bottom_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bottom_bar)
	var bot_center: CenterContainer = CenterContainer.new()
	bot_center.set_anchors_preset(Control.PRESET_FULL_RECT)
	bottom_bar.add_child(bot_center)
	var bot_h: HBoxContainer = HBoxContainer.new()
	bot_h.add_theme_constant_override("separation", 16)
	bot_center.add_child(bot_h)
	work_btn = StyledButton.new("🔨 工作 (空格)", Color(0.2, 0.55, 0.3), Color(0.35, 0.7, 0.45))
	work_btn.custom_minimum_size = Vector2(240, 52)
	work_btn.pressed.connect(_on_work)
	bot_h.add_child(work_btn)
	end_turn_btn = StyledButton.new("⏭ 结束回合 (E)", Color(0.6, 0.4, 0.15), Color(0.8, 0.55, 0.25))
	end_turn_btn.custom_minimum_size = Vector2(240, 52)
	end_turn_btn.pressed.connect(_on_end_turn)
	bot_h.add_child(end_turn_btn)
	toast_container = VBoxContainer.new()
	toast_container.anchor_left = 0.5
	toast_container.anchor_right = 0.5
	toast_container.offset_left = -280
	toast_container.offset_right = 280
	toast_container.offset_top = 70
	toast_container.size = Vector2(560, 200)
	toast_container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(toast_container)

func _refresh_all():
	_on_turn_changed(GameManager.turn)
	_on_sat_changed(GameManager.satisfaction, 0)
	_on_char_selected(GameManager.selected_character_idx)
	task_label.text = "任务 %d/%d" % [GameManager.completed_tasks, GameManager.required_tasks]

func _on_turn_changed(new_turn: int):
	turn_label.text = "回合 %d/%d" % [new_turn, GameManager.max_turns]
	var col: Color = Color.LIGHT_BLUE
	if new_turn > GameManager.max_turns * 0.7:
		col = Color(1.0, 0.75, 0.3)
	if new_turn > GameManager.max_turns * 0.9:
		col = Color(1.0, 0.4, 0.4)
	turn_label.modulate = col

func _on_sat_changed(new_val: float, _d: float):
	sat_label.text = "满意度 %+g / %d" % [new_val, GameManager.target_satisfaction]
	var span: float = float(GameManager.target_satisfaction) - float(GameManager.min_satisfaction)
	var ratio: float = clamp((float(new_val) - float(GameManager.min_satisfaction)) / span, 0.0, 1.0) if span > 0 else 0.0
	sat_bar.custom_minimum_size = Vector2(200.0 * ratio, 14)
	var c: Color = Color(0.4, 0.85, 0.5)
	if new_val < GameManager.target_satisfaction * 0.5:
		c = Color(1.0, 0.7, 0.3)
	if new_val <= GameManager.min_satisfaction:
		c = Color(1.0, 0.35, 0.35)
	sat_bar.color = c

func _on_char_selected(idx: int):
	for c in skill_buttons_container.get_children():
		c.queue_free()
	if idx < 0:
		_set_selected_info_empty()
		return
	var ch: Dictionary = GameManager.characters[idx]
	if ch.is_empty():
		_set_selected_info_empty()
		return
	var sel: VBoxContainer = selected_info.get_child(0)
	if not sel:
		return
	var head: HBoxContainer = sel.get_child(0)
	if head and head.get_node_or_null("emoji"):
		(head.get_node("emoji") as Label).text = str(ch.get("portrait_emoji", "👤"))
	var name_v: VBoxContainer = head.get_child(1) if head else null
	if name_v:
		(name_v.get_child(0) as Label).text = str(ch.get("name", "角色"))
		(name_v.get_child(0) as Label).modulate = Color(ch.get("color", "#ffffff"))
		(name_v.get_child(1) as Label).text = str(ch.get("title", ""))
	var stats_row: HBoxContainer = sel.get_node_or_null("stats_row") as HBoxContainer
	if stats_row:
		for c in stats_row.get_children():
			c.queue_free()
		var st: Dictionary = ch.get("stats", {})
		var specs: Array = [["🎪", "booth", Color(0.95, 0.65, 0.25)], ["📣", "promo", Color(0.4, 0.65, 0.95)], ["🤝", "reception", Color(0.35, 0.8, 0.55)]]
		for sp in specs:
			var val: float = GameManager.get_effective_stat(idx, sp[1])
			var hl: HBoxContainer = HBoxContainer.new()
			hl.add_theme_constant_override("separation", 4)
			var hi: Label = Label.new()
			hi.text = sp[0]
			hi.add_theme_font_size_override("font_size", 14)
			hl.add_child(hi)
			var ht: Label = Label.new()
			ht.text = "%.0f" % val
			ht.add_theme_font_size_override("font_size", 14)
			ht.modulate = sp[2]
			hl.add_child(ht)
			stats_row.add_child(hl)
	var ap_row: HBoxContainer = sel.get_node_or_null("ap_row") as HBoxContainer
	if ap_row:
		var max_ap: int = int(ch.get("max_ap", 3))
		var cur_ap: int = int(ch.get("ap", 0))
		var r2: float = float(cur_ap) / float(max_ap) if max_ap > 0 else 0.0
		(ap_row.get_node("ap_bar") as ColorRect).custom_minimum_size = Vector2(220.0 * r2, 10)
		(ap_row.get_node("ap_text") as Label).text = "AP %d/%d   移动:%d" % [cur_ap, max_ap, int(ch.get("move_range", 3))]
	var skills: Array = ch.get("skills", [])
	for i in skills.size():
		var sk: Dictionary = skills[i]
		var skill_name: String = str(sk.get("name", ""))
		var skill_desc: String = str(sk.get("description", ""))
		var skill_range: int = int(sk.get("range", 0))
		var skill_cd: int = int(sk.get("cooldown", 0))
		var skill_ap: int = int(sk.get("ap_cost", 1))
		var skill_id: String = str(sk.get("id", ""))
		var cds: Dictionary = ch.get("skill_cooldowns", {})
		var cd: int = int(cds.get(skill_id, 0))
		var affordable: bool = int(ch.get("ap", 0)) >= skill_ap and cd == 0
		var btn: StyledButton = StyledButton.new("%d:%s(AP%d)" % [i + 1, skill_name, skill_ap], Color(0.25, 0.35, 0.6) if affordable else Color(0.3, 0.3, 0.35), Color(0.4, 0.55, 0.85) if affordable else Color(0.35, 0.35, 0.4))
		btn.custom_minimum_size = Vector2(106, 40)
		btn.disabled = not affordable
		if cd > 0:
			btn.set_text("%d:%s(CD%d)" % [i + 1, skill_name.substr(0, 3), cd])
		var sk_idx_val: int = i
		var sk_copy_d: Dictionary = sk.duplicate(true)
		btn.pressed.connect(func (si=sk_idx_val, sd=sk_copy_d): _on_skill_clicked(si, sd))
		btn.tooltip_text = "%s\n%s\n范围:%d 冷却:%d" % [skill_name, skill_desc, skill_range, skill_cd]
		skill_buttons_container.add_child(btn)

func _set_selected_info_empty():
	if selected_info.get_child_count() == 0:
		return
	var sel: VBoxContainer = selected_info.get_child(0)
	if not sel:
		return
	var head: HBoxContainer = sel.get_child(0)
	if head:
		(head.get_node("emoji") as Label).text = "👤"
		var name_v: VBoxContainer = head.get_child(1) if head else null
		if name_v:
			(name_v.get_child(0) as Label).text = "未选择角色"
			(name_v.get_child(0) as Label).modulate = Color.WHITE
			(name_v.get_child(1) as Label).text = "点击角色进行选择"
	var ap_row: HBoxContainer = sel.get_node_or_null("ap_row") as HBoxContainer
	if ap_row:
		(ap_row.get_node("ap_bar") as ColorRect).custom_minimum_size = Vector2(0, 10)
		(ap_row.get_node("ap_text") as Label).text = "AP 0/0"

func _on_task_done(_td: Dictionary):
	task_label.text = "任务 %d/%d" % [GameManager.completed_tasks, GameManager.required_tasks]

func _on_toast(msg: String, col: Color):
	AudioManager.play_sfx("toast")
	var t: PanelContainer = PanelContainer.new()
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.05, 0.07, 0.12, 0.95)
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = col
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	t.add_theme_stylebox_override("panel", sb)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	toast_container.add_child(t)
	var lbl: Label = Label.new()
	lbl.text = msg
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.modulate = col
	t.add_child(lbl)
	toasts.append(t)
	var tw: Tween = create_tween()
	t.modulate.a = 0.0
	tw.tween_property(t, "modulate:a", 1.0, 0.15)
	tw.tween_interval(2.5)
	tw.tween_property(t, "modulate:a", 0.0, 0.35)
	tw.tween_callback(t.queue_free)
	tw.tween_callback(func ():
		var idx: int = toasts.find(t)
		if idx >= 0:
			toasts.remove_at(idx)
	)

func _on_end_turn():
	AudioManager.play_sfx("end_turn")
	emit_signal("end_turn_clicked")

func _on_pause():
	emit_signal("pause_clicked")

func _on_skill_clicked(idx: int, _sk: Dictionary):
	emit_signal("skill_used", idx)

func _on_work():
	emit_signal("work_clicked")

func set_work_enabled(en: bool, reason: String = ""):
	work_btn.disabled = not en
	if not en and reason != "":
		work_btn.set_text("🔨 " + reason)
	else:
		work_btn.set_text("🔨 工作 (空格)")
