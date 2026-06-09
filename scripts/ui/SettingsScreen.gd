extends Control

signal closed()

var overlay: ColorRect
var panel: PanelContainer
var rebinding_action: String = ""

func _ready():
	_build_ui()

func _build_ui():
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.6)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	overlay.modulate.a = 0
	var ft: Tween = create_tween()
	ft.tween_property(overlay, "modulate:a", 1.0, 0.2)
	var sc: ScrollContainer = ScrollContainer.new()
	sc.set_anchors_preset(Control.PRESET_FULL_RECT)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(sc)
	var center: CenterContainer = CenterContainer.new()
	center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.add_child(center)
	panel = PanelContainer.new()
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.12, 0.15, 0.25)
	sb.corner_radius_top_left = 14
	sb.corner_radius_top_right = 14
	sb.corner_radius_bottom_left = 14
	sb.corner_radius_bottom_right = 14
	sb.content_margin_left = 32
	sb.content_margin_right = 32
	sb.content_margin_top = 22
	sb.content_margin_bottom = 22
	panel.add_theme_stylebox_override("panel", sb)
	center.add_child(panel)
	var mv: VBoxContainer = VBoxContainer.new()
	mv.add_theme_constant_override("separation", 18)
	mv.custom_minimum_size = Vector2(620, 0)
	panel.add_child(mv)
	var title: Label = Label.new()
	title.text = "⚙️ 游戏设置"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 34)
	title.modulate = Color(1, 0.9, 0.55)
	mv.add_child(title)
	_add_section(mv, "🔊 音频")
	_add_slider(mv, "主音量", "master_volume", 0.0, 1.0, 0.8)
	_add_slider(mv, "音效音量", "sfx_volume", 0.0, 1.0, 0.7)
	_add_slider(mv, "背景音乐音量", "bgm_volume", 0.0, 1.0, 0.5)
	_add_section(mv, "🖥️ 画面")
	_add_checkbox(mv, "全屏显示", "fullscreen", false)
	_add_checkbox(mv, "垂直同步 (VSync)", "vsync", true)
	var fps_options: Array = [60, 120, 144, 240, 0]
	var fps_labels: Array = ["60 FPS", "120 FPS", "144 FPS", "240 FPS", "无上限"]
	_add_option(mv, "帧率上限", "max_fps", 60, fps_options, fps_labels, _on_fps_changed)
	_add_checkbox(mv, "显示性能统计", "show_performance", false, _on_perf_toggled)
	_add_section(mv, "⌨️ 按键设置（点击按钮重新绑定）")
	var input_bindings: Array = [
		["move_up", "上移 (W/↑)"],
		["move_down", "下移 (S/↓)"],
		["move_left", "左移 (A/←)"],
		["move_right", "右移 (D/→)"],
		["confirm", "确认 (空格/回车)"],
		["cancel", "取消 (Esc)"],
		["end_turn", "结束回合 (E)"],
		["pause", "暂停 (Esc)"],
		["skill_1", "技能1 (1)"],
		["skill_2", "技能2 (2)"],
		["skill_3", "技能3 (3)"]
	]
	for bind in input_bindings:
		_add_binding_row(mv, bind[0], bind[1])
	var spacer: Control = Control.new()
	spacer.custom_minimum_size = Vector2(0, 10)
	mv.add_child(spacer)
	var btn_h: HBoxContainer = HBoxContainer.new()
	btn_h.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_h.add_theme_constant_override("separation", 18)
	mv.add_child(btn_h)
	var reset: StyledButton = StyledButton.new("🔄 恢复默认按键", Color(0.45, 0.3, 0.55), Color(0.6, 0.45, 0.7))
	reset.custom_minimum_size = Vector2(220, 48)
	reset.pressed.connect(_on_reset_bindings)
	btn_h.add_child(reset)
	var close_btn: StyledButton = StyledButton.new("✓ 关闭设置", Color(0.2, 0.5, 0.35), Color(0.3, 0.65, 0.45))
	close_btn.custom_minimum_size = Vector2(220, 48)
	close_btn.pressed.connect(_on_close)
	btn_h.add_child(close_btn)

func _add_section(parent: VBoxContainer, text: String):
	var h: HBoxContainer = HBoxContainer.new()
	h.add_theme_constant_override("margin_top", 4)
	parent.add_child(h)
	var t: Label = Label.new()
	t.text = text
	t.add_theme_font_size_override("font_size", 18)
	t.modulate = Color(0.7, 0.85, 1.0)
	h.add_child(t)
	var line: ColorRect = ColorRect.new()
	line.color = Color(0.25, 0.3, 0.45)
	line.custom_minimum_size = Vector2(0, 2)
	line.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	line.size_flags_stretch_ratio = 1.0
	h.add_child(line)

func _add_slider(parent: VBoxContainer, label_text: String, setting_key: String, min_val: float, max_val: float, default_val: float):
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	parent.add_child(row)
	var lbl: Label = Label.new()
	lbl.text = label_text
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.custom_minimum_size = Vector2(180, 0)
	lbl.modulate = Color.WHITE
	row.add_child(lbl)
	var val: float = float(SaveSystem.get_setting(setting_key, default_val))
	var slider: HSlider = HSlider.new()
	slider.min_value = min_val
	slider.max_value = max_val
	slider.step = 0.01
	slider.value = val
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.custom_minimum_size = Vector2(300, 0)
	row.add_child(slider)
	var pct: Label = Label.new()
	pct.text = "%d%%" % int(val * 100)
	pct.custom_minimum_size = Vector2(56, 0)
	pct.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	pct.modulate = Color(0.8, 0.9, 1.0)
	row.add_child(pct)
	slider.value_changed.connect(func(v: float):
		SaveSystem.set_setting(setting_key, v)
		pct.text = "%d%%" % int(v * 100)
	)

func _add_checkbox(parent: VBoxContainer, label_text: String, setting_key: String, default_val: bool, extra_cb: Callable = Callable()):
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	parent.add_child(row)
	var lbl: Label = Label.new()
	lbl.text = label_text
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.custom_minimum_size = Vector2(260, 0)
	lbl.modulate = Color.WHITE
	row.add_child(lbl)
	var chk: CheckButton = CheckButton.new()
	chk.button_pressed = bool(SaveSystem.get_setting(setting_key, default_val))
	row.add_child(chk)
	chk.toggled.connect(func(v: bool):
		SaveSystem.set_setting(setting_key, v)
		AudioManager.play_sfx("click")
		if extra_cb.is_valid():
			extra_cb.call(v)
	)

func _add_option(parent: VBoxContainer, label_text: String, setting_key: String, default_val: int, options: Array, labels: Array, cb: Callable = Callable()):
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	parent.add_child(row)
	var lbl: Label = Label.new()
	lbl.text = label_text
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.custom_minimum_size = Vector2(180, 0)
	lbl.modulate = Color.WHITE
	row.add_child(lbl)
	var opt: OptionButton = OptionButton.new()
	for i in options.size():
		opt.add_item(labels[i], int(options[i]))
	var cur: int = int(SaveSystem.get_setting(setting_key, default_val))
	var sel_idx: int = opt.get_item_index(cur)
	if sel_idx >= 0:
		opt.select(sel_idx)
	opt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(opt)
	opt.item_selected.connect(func(_idx: int):
		var vv: int = opt.get_item_id(opt.selected)
		SaveSystem.set_setting(setting_key, vv)
		if cb.is_valid():
			cb.call(vv)
	)

func _add_binding_row(parent: VBoxContainer, action: String, display: String):
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	parent.add_child(row)
	var lbl: Label = Label.new()
	lbl.text = display
	lbl.add_theme_font_size_override("font_size", 14)
	lbl.custom_minimum_size = Vector2(220, 0)
	lbl.modulate = Color(0.9, 0.95, 1.0)
	row.add_child(lbl)
	var btn: StyledButton = StyledButton.new(InputManager.get_action_display(action), Color(0.2, 0.3, 0.55), Color(0.35, 0.5, 0.75))
	btn.custom_minimum_size = Vector2(180, 36)
	btn.name = "bind_" + action
	btn.pressed.connect(func _b(a=action, bt=btn): _start_rebind(a, bt))
	row.add_child(btn)

func _start_rebind(action: String, btn: StyledButton):
	if rebinding_action != "":
		return
	rebinding_action = action
	btn.set_text("按任意键...")
	btn.modulate = Color(1.0, 0.85, 0.35)

func _unhandled_input(event: InputEvent):
	if rebinding_action == "":
		return
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE:
			_cancel_rebind()
			return
		var kc: int = int(event.physical_keycode)
		if kc != 0:
			InputManager.rebind_action(rebinding_action, kc)
			RefreshBinding(rebinding_action)
			rebinding_action = ""
			get_viewport().set_input_as_handled()

func RefreshBinding(action: String):
	var node = find_child("bind_" + action, true, false)
	if node and node is StyledButton:
		node.set_text(InputManager.get_action_display(action))
		node.modulate = Color.WHITE

func _cancel_rebind():
	if rebinding_action == "":
		return
	RefreshBinding(rebinding_action)
	rebinding_action = ""

func _on_fps_changed(v: int):
	Engine.max_fps = v

func _on_perf_toggled(v: bool):
	PerformanceStats.set_enabled(v)

func _on_reset_bindings():
	InputManager.reset_bindings()
	for action in InputManager.get_default_keys().keys():
		RefreshBinding(action)
	SaveSystem.set_setting("input_bindings", {})
	AudioManager.play_sfx("success")

func _on_close():
	AudioManager.play_sfx("click")
	_cancel_rebind()
	var tw: Tween = create_tween()
	tw.tween_property(overlay, "modulate:a", 0.0, 0.18)
	tw.tween_callback(queue_free)
	tw.tween_callback(func _(): emit_signal("closed"))

func _input(event: InputEvent):
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_ESCAPE and rebinding_action == "":
		_on_close()
		get_viewport().set_input_as_handled()
