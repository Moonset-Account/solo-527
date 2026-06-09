extends Control

signal level_selected(level_id: String)
signal back_clicked()

func _ready():
	_build_ui()

func _build_ui():
	var bg: ColorRect = ColorRect.new()
	bg.color = Color(0.1, 0.13, 0.22)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)
	var v_main: VBoxContainer = VBoxContainer.new()
	v_main.set_anchors_preset(Control.PRESET_FULL_RECT)
	v_main.add_theme_constant_override("separation", 18)
	v_main.add_theme_constant_override("margin_top", 32)
	v_main.add_theme_constant_override("margin_left", 48)
	v_main.add_theme_constant_override("margin_right", 48)
	v_main.add_theme_constant_override("margin_bottom", 32)
	add_child(v_main)
	var title: Label = Label.new()
	title.text = "📜 关卡选择"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 42)
	title.modulate = Color(1, 0.92, 0.55)
	v_main.add_child(title)
	var scroll: ScrollContainer = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v_main.add_child(scroll)
	var grid: GridContainer = GridContainer.new()
	grid.columns = 2
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 24)
	grid.add_theme_constant_override("v_separation", 24)
	scroll.add_child(grid)
	var completed_levels: Array = SaveSystem.get_completed_levels()
	var levels: Array = ConfigLoader.level_list.get("levels", [])
	for lv in levels:
		var unlocked: bool = ConfigLoader.is_level_unlocked(lv.get("level_id", ""), completed_levels)
		var completed: bool = lv.get("level_id", "") in completed_levels
		var card: PanelContainer = PanelContainer.new()
		var sb: StyleBoxFlat = StyleBoxFlat.new()
		sb.bg_color = Color(0.16, 0.2, 0.32)
		sb.corner_radius_top_left = 12
		sb.corner_radius_top_right = 12
		sb.corner_radius_bottom_left = 12
		sb.corner_radius_bottom_right = 12
		sb.content_margin_left = 18
		sb.content_margin_right = 18
		sb.content_margin_top = 16
		sb.content_margin_bottom = 16
		card.add_theme_stylebox_override("panel", sb)
		card.custom_minimum_size = Vector2(300, 140)
		card.mouse_filter = Control.MOUSE_FILTER_STOP if unlocked else Control.MOUSE_FILTER_IGNORE
		if unlocked:
			card.gui_input.connect(func(event: InputEvent, c=card, lid=lv.get("level_id","")):
				if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
					AudioManager.play_sfx("click")
					emit_signal("level_selected", lid)
			)
		grid.add_child(card)
		var cv: VBoxContainer = VBoxContainer.new()
		cv.add_theme_constant_override("separation", 8)
		card.add_child(cv)
		var h1: HBoxContainer = HBoxContainer.new()
		h1.add_theme_constant_override("separation", 10)
		cv.add_child(h1)
		var stars: Label = Label.new()
		var d: int = lv.get("difficulty", 1)
		stars.text = "★" * d + "☆" * (3 - d)
		stars.add_theme_font_size_override("font_size", 20)
		stars.modulate = Color(1, 0.85, 0.3)
		h1.add_child(stars)
		var diff_label: Label = Label.new()
		var names: Array = ["", "简单", "普通", "困难"]
		diff_label.text = "[%s]" % names[clamp(d, 1, 3)]
		diff_label.add_theme_font_size_override("font_size", 14)
		diff_label.modulate = Color(0.8, 0.85, 1.0)
		h1.add_child(diff_label)
		var spacer: Control = Control.new()
		spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h1.add_child(spacer)
		if completed:
			var done_lbl: Label = Label.new()
			done_lbl.text = "✓ 已通关"
			done_lbl.add_theme_font_size_override("font_size", 14)
			done_lbl.modulate = Color(0.4, 0.9, 0.5)
			h1.add_child(done_lbl)
		elif not unlocked:
			var lock_lbl: Label = Label.new()
			lock_lbl.text = "🔒 未解锁"
			lock_lbl.add_theme_font_size_override("font_size", 14)
			lock_lbl.modulate = Color(0.7, 0.4, 0.4)
			h1.add_child(lock_lbl)
		var lv_title: Label = Label.new()
		lv_title.text = lv.get("name", "关卡")
		lv_title.add_theme_font_size_override("font_size", 22)
		lv_title.modulate = Color.WHITE if unlocked else Color(0.5, 0.55, 0.65)
		cv.add_child(lv_title)
		var desc: Label = Label.new()
		desc.text = lv.get("description", "")
		desc.add_theme_font_size_override("font_size", 13)
		desc.modulate = Color(0.7, 0.75, 0.85) if unlocked else Color(0.4, 0.45, 0.55)
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD
		desc.size_flags_vertical = Control.SIZE_EXPAND_FILL
		cv.add_child(desc)
	var back_row: HBoxContainer = HBoxContainer.new()
	back_row.alignment = BoxContainer.ALIGNMENT_CENTER
	v_main.add_child(back_row)
	var back: StyledButton = StyledButton.new("← 返回主菜单", Color(0.35, 0.25, 0.4), Color(0.5, 0.4, 0.55))
	back.custom_minimum_size = Vector2(220, 48)
	back.pressed.connect(func _():
		AudioManager.play_sfx("click")
		emit_signal("back_clicked")
	)
	back_row.add_child(back)
