extends Control

signal start_clicked()
signal level_select_clicked()
signal settings_clicked()

func _ready():
	_build_ui()

func _build_ui():
	var bg: ColorRect = ColorRect.new()
	bg.color = Color(0.08, 0.1, 0.18)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)
	var deco: ColorRect = ColorRect.new()
	deco.color = Color(0.3, 0.2, 0.6, 0.25)
	deco.set_anchors_preset(Control.PRESET_FULL_RECT)
	deco.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(deco)
	var center: CenterContainer = CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 22)
	center.add_child(vbox)
	var title_box: VBoxContainer = VBoxContainer.new()
	title_box.alignment = BoxContainer.ALIGNMENT_CENTER
	title_box.add_theme_constant_override("separation", 4)
	vbox.add_child(title_box)
	var big_title: Label = Label.new()
	big_title.text = "🎯 社团活动战术棋"
	big_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	big_title.add_theme_font_size_override("font_size", 56)
	big_title.modulate = Color(1, 0.92, 0.5)
	title_box.add_child(big_title)
	var subtitle: Label = Label.new()
	subtitle.text = "回合制策略 · 布置社团活动日"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 20)
	subtitle.modulate = Color(0.8, 0.9, 1.0)
	title_box.add_child(subtitle)
	var spacer: Control = Control.new()
	spacer.custom_minimum_size = Vector2(0, 40)
	vbox.add_child(spacer)
	var btn_start: StyledButton = StyledButton.new("🎮 开始教程关卡", Color(0.2, 0.55, 0.3), Color(0.3, 0.7, 0.4))
	btn_start.custom_minimum_size = Vector2(340, 56)
	btn_start.pressed.connect(_on_start)
	vbox.add_child(btn_start)
	var btn_levels: StyledButton = StyledButton.new("📜 选择关卡", Color(0.2, 0.35, 0.7), Color(0.35, 0.5, 0.85))
	btn_levels.custom_minimum_size = Vector2(340, 52)
	btn_levels.pressed.connect(_on_level_select)
	vbox.add_child(btn_levels)
	var btn_settings: StyledButton = StyledButton.new("⚙️ 设置", Color(0.45, 0.3, 0.6), Color(0.6, 0.45, 0.75))
	btn_settings.custom_minimum_size = Vector2(340, 52)
	btn_settings.pressed.connect(_on_settings)
	vbox.add_child(btn_settings)
	var footer: Label = Label.new()
	footer.text = "WASD/方向键移动  ·  空格/回车确认  ·  Esc取消  ·  E结束回合  ·  1/2/3技能"
	footer.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	footer.add_theme_font_size_override("font_size", 13)
	footer.modulate = Color(0.6, 0.7, 0.85)
	footer.position = Vector2(0, get_viewport_rect().size.y - 36)
	footer.size = Vector2(get_viewport_rect().size.x, 20)
	footer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(footer)

func _on_start():
	emit_signal("start_clicked")

func _on_level_select():
	emit_signal("level_select_clicked")

func _on_settings():
	emit_signal("settings_clicked")
