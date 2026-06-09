extends Control
## 设置页 - 音量/显示/玩法/输入四类设置，按键提示随输入方式切换

var _prev_scene_path: String = "res://scenes/MainMenu.tscn"
var _hint_bar: HBoxContainer
var _input_mode_lbl: Label

func _ready() -> void:
	var f := FileAccess.open("user://prev_scene.tmp", FileAccess.READ)
	if f:
		_prev_scene_path = f.get_line().strip_edges()
		f.close()
		if FileAccess.file_exists("user://prev_scene.tmp"):
			DirAccess.remove_absolute("user://prev_scene.tmp")
	_build_ui()
	_refresh_hint_bar()
	InputManager.method_changed.connect(func(_m): _refresh_hint_bar(); _update_input_lbl())
	SettingsManager.settings_changed.connect(func(cat, k, v): _refresh_hint_bar())

func _build_ui() -> void:
	for c in get_children(): c.queue_free()
	var bg: ColorRect = ColorRect.new()
	bg.color = Color(0.06, 0.07, 0.09, 1)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)
	var root: MarginContainer = MarginContainer.new()
	root.anchor_right = 1.0
	root.anchor_bottom = 1.0
	root.add_theme_constant_override("margin_left", 64)
	root.add_theme_constant_override("margin_right", 64)
	root.add_theme_constant_override("margin_top", 32)
	root.add_theme_constant_override("margin_bottom", 32)
	add_child(root)
	var vb: VBoxContainer = vb = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 20)
	root.add_child(vb)
	var top: HBoxContainer = HBoxContainer.new()
	var back: Button = Button.new()
	back.text = ("← 返回  [%s]" % InputManager.get_hint("ui_cancel"))
	back.add_theme_font_size_override("font_size", 16)
	back.pressed.connect(_on_back)
	top.add_child(back)
	var title: Label = Label.new()
	title.text = "⚙️ 游戏设置"
	title.add_theme_font_size_override("font_size", 40)
	title.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(title)
	_input_mode_lbl = Label.new()
	_input_mode_lbl.text = ("输入: %s" % InputManager.method_name())
	_input_mode_lbl.add_theme_color_override("font_color", Color(0.55, 0.8, 0.9, 1))
	_input_mode_lbl.add_theme_font_size_override("font_size", 14)
	top.add_child(_input_mode_lbl)
	vb.add_child(top)

	var scroll: ScrollContainer = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vb.add_child(scroll)
	var grid: GridContainer = GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 32)
	grid.add_theme_constant_override("v_separation", 20)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(grid)

	var sections: Array = [
		["🔊 音频设置", _build_audio_section()],
		["🖥️  显示设置", _build_display_section()],
		["🎮 玩法设置", _build_gameplay_section()],
		["🕹️ 输入设置", _build_input_section()],
	]
	for s in sections:
		grid.add_child(_section_title(s[0]))
		grid.add_child(s[1])

	var bottom: HBoxContainer = HBoxContainer.new()
	bottom.alignment = BoxContainer.ALIGNMENT_CENTER
	bottom.add_theme_constant_override("separation", 24)
	var reset: Button = Button.new()
	reset.text = "恢复默认设置"
	reset.custom_minimum_size = Vector2(200, 44)
	reset.add_theme_font_size_override("font_size", 16)
	reset.pressed.connect(_on_reset)
	bottom.add_child(reset)
	var save: Button = Button.new()
	save.text = "保存并返回"
	save.custom_minimum_size = Vector2(200, 44)
	save.add_theme_font_size_override("font_size", 16)
	save.pressed.connect(_on_back)
	bottom.add_child(save)
	vb.add_child(bottom)

	_hint_bar = HBoxContainer.new()
	_hint_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	_hint_bar.add_theme_constant_override("separation", 32)
	vb.add_child(_hint_bar)

func _section_title(text: String) -> Control:
	var lbl: Label = Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", 22)
	lbl.add_theme_color_override("font_color", Color(0.92, 0.82, 0.58, 1))
	lbl.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	return lbl

func _build_audio_section() -> Control:
	var vb: VBoxContainer = vb = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 10)
	vb.add_child(_make_volume_row("主音量 Master", "master_volume"))
	vb.add_child(_make_volume_row("音效 SFX", "sfx_volume"))
	vb.add_child(_make_volume_row("音乐 Music", "music_volume"))
	vb.add_child(_make_volume_row("语音 Voice", "voice_volume"))
	return vb

func _make_volume_row(label: String, key: String) -> Control:
	var h: HBoxContainer = HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	var lbl: Label = Label.new()
	lbl.text = label
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.custom_minimum_size = Vector2(140, 0)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8, 1))
	h.add_child(lbl)
	var slider: HSlider = HSlider.new()
	slider.min_value = 0.0
	slider.max_value = 1.0
	slider.step = 0.01
	slider.value = float(SettingsManager.get_value("audio", key, 0.8))
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var v_lbl: Label = Label.new()
	v_lbl.text = "%d%%" % int(slider.value * 100)
	v_lbl.custom_minimum_size = Vector2(56, 0)
	v_lbl.add_theme_font_size_override("font_size", 14)
	v_lbl.add_theme_color_override("font_color", Color(0.9, 0.8, 0.4, 1))
	v_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	slider.value_changed.connect(func(v: float):
		v_lbl.text = "%d%%" % int(v * 100)
		SettingsManager.set_value("audio", key, v)
	)
	h.add_child(slider)
	h.add_child(v_lbl)
	return h

func _build_display_section() -> Control:
	var vb: VBoxContainer = vb = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 10)
	vb.add_child(_make_toggle_row("全屏模式", "fullscreen"))
	vb.add_child(_make_toggle_row("垂直同步", "vsync"))
	vb.add_child(_make_resolution_row())
	vb.add_child(_make_scale_row("文字缩放", "text_scale", 0.8, 1.5))
	var quality_options: Array = ["low", "medium", "high"]
	vb.add_child(_make_option_row("粒子质量", "particle_quality", ["低","中","高"], quality_options))
	return vb

func _make_toggle_row(label: String, key: String) -> Control:
	var h: HBoxContainer = HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	var lbl: Label = Label.new()
	lbl.text = label
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.custom_minimum_size = Vector2(140, 0)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8, 1))
	h.add_child(lbl)
	var chk: CheckBox = CheckBox.new()
	chk.button_pressed = bool(SettingsManager.get_value("display", key, false))
	chk.add_theme_font_size_override("font_size", 14)
	chk.toggled.connect(func(v: bool): SettingsManager.set_value("display", key, v))
	h.add_child(chk)
	return h

func _make_resolution_row() -> Control:
	var h: HBoxContainer = HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	var lbl: Label = Label.new()
	lbl.text = "窗口分辨率"
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.custom_minimum_size = Vector2(140, 0)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8, 1))
	h.add_child(lbl)
	var opt: OptionButton = OptionButton.new()
	opt.custom_minimum_size = Vector2(220, 0)
	for i in SettingsManager.resolutions.size():
		var r: Vector2i = SettingsManager.resolutions[i]
		opt.add_item("%d × %d" % [r.x, r.y], i)
	opt.selected = int(SettingsManager.get_value("display", "resolution_index", 0))
	opt.item_selected.connect(func(idx: int): SettingsManager.set_value("display", "resolution_index", idx))
	h.add_child(opt)
	return h

func _make_scale_row(label: String, key: String, mn: float, mx: float) -> Control:
	var h: HBoxContainer = HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	var lbl: Label = Label.new()
	lbl.text = label
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.custom_minimum_size = Vector2(140, 0)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8, 1))
	h.add_child(lbl)
	var slider: HSlider = HSlider.new()
	slider.min_value = mn
	slider.max_value = mx
	slider.step = 0.05
	slider.value = float(SettingsManager.get_value("display", key, 1.0))
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var v_lbl: Label = Label.new()
	v_lbl.text = "%.2fx" % slider.value
	v_lbl.custom_minimum_size = Vector2(56, 0)
	v_lbl.add_theme_font_size_override("font_size", 14)
	v_lbl.add_theme_color_override("font_color", Color(0.9, 0.8, 0.4, 1))
	slider.value_changed.connect(func(v: float):
		v_lbl.text = "%.2fx" % v
		SettingsManager.set_value("display", key, v)
	)
	h.add_child(slider)
	h.add_child(v_lbl)
	return h

func _make_option_row(label: String, key: String, display_names: Array, values: Array) -> Control:
	var h: HBoxContainer = HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	var lbl: Label = Label.new()
	lbl.text = label
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.custom_minimum_size = Vector2(140, 0)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8, 1))
	h.add_child(lbl)
	var opt: OptionButton = OptionButton.new()
	opt.custom_minimum_size = Vector2(180, 0)
	for i in display_names.size():
		opt.add_item(str(display_names[i]), i)
	var cur_v = SettingsManager.get_value("display", key, values[0])
	var idx: int = 0
	for i in values.size():
		if values[i] == cur_v:
			idx = i
			break
	opt.selected = idx
	opt.item_selected.connect(func(i: int): SettingsManager.set_value("display", key, values[i]))
	h.add_child(opt)
	return h

func _build_gameplay_section() -> Control:
	var vb: VBoxContainer = vb = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 10)
	var t1: HBoxContainer = HBoxContainer.new()
	t1.add_theme_constant_override("separation", 12)
	var l1: Label = Label.new()
	l1.text = "自动结束回合"
	l1.add_theme_font_size_override("font_size", 15)
	l1.custom_minimum_size = Vector2(140, 0)
	l1.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8, 1))
	t1.add_child(l1)
	var c1: CheckBox = CheckBox.new()
	c1.button_pressed = bool(SettingsManager.get_value("gameplay", "auto_end_turn", false))
	c1.toggled.connect(func(v): SettingsManager.set_value("gameplay", "auto_end_turn", v))
	t1.add_child(c1)
	vb.add_child(t1)
	vb.add_child(_make_scale_row("卡牌动画速度", "card_anim_speed", 0.5, 2.0))
	vb.add_child(_make_scale_row("数字动画速度", "damage_number_speed", 0.5, 2.0))
	var t2: HBoxContainer = HBoxContainer.new()
	t2.add_theme_constant_override("separation", 12)
	var l2: Label = Label.new()
	l2.text = "显示操作提示"
	l2.add_theme_font_size_override("font_size", 15)
	l2.custom_minimum_size = Vector2(140, 0)
	l2.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8, 1))
	t2.add_child(l2)
	var c2: CheckBox = CheckBox.new()
	c2.button_pressed = bool(SettingsManager.get_value("gameplay", "hints_enabled", true))
	c2.toggled.connect(func(v):
		SettingsManager.set_value("gameplay", "hints_enabled", v)
		_refresh_hint_bar()
	)
	t2.add_child(c2)
	vb.add_child(t2)
	return vb

func _build_input_section() -> Control:
	var vb: VBoxContainer = vb = VBoxContainer.new()
	vb.add_theme_constant_override("separation", 10)
	var t1: HBoxContainer = HBoxContainer.new()
	t1.add_theme_constant_override("separation", 12)
	var l1: Label = Label.new()
	l1.text = "手柄震动"
	l1.add_theme_font_size_override("font_size", 15)
	l1.custom_minimum_size = Vector2(140, 0)
	l1.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8, 1))
	t1.add_child(l1)
	var c1: CheckBox = CheckBox.new()
	c1.button_pressed = bool(SettingsManager.get_value("input", "vibration_enabled", true))
	c1.toggled.connect(func(v): SettingsManager.set_value("input", "vibration_enabled", v))
	t1.add_child(c1)
	vb.add_child(t1)
	vb.add_child(_make_scale_row("摇杆死区", "deadzone", 0.05, 0.6))
	vb.add_child(_make_scale_row("触屏灵敏度", "touch_sensitivity", 0.5, 2.0))
	var info: Label = Label.new()
	info.text = ("💡 当前输入设备: %s\n   按键提示会自动切换" % InputManager.method_name())
	info.add_theme_font_size_override("font_size", 13)
	info.add_theme_color_override("font_color", Color(0.6, 0.8, 0.9, 1))
	vb.add_child(info)
	return vb

func _refresh_hint_bar() -> void:
	for c in _hint_bar.get_children(): c.queue_free()
	if not bool(SettingsManager.get_value("gameplay", "hints_enabled", true)):
		return
	var hints: Array = [
		["ui_accept", "确认"],
		["ui_cancel", "返回"],
		["ui_up", "上一项"],
		["ui_down", "下一项"],
		["ui_left", "减小/关"],
		["ui_right", "增大/开"],
	]
	for h in hints:
		var box: HBoxContainer = HBoxContainer.new()
		box.add_theme_constant_override("separation", 6)
		var k: Label = Label.new()
		k.text = ("[%s]" % InputManager.get_hint(h[0]))
		k.add_theme_color_override("font_color", Color(0.95, 0.8, 0.4, 1))
		k.add_theme_font_size_override("font_size", 14)
		box.add_child(k)
		var d: Label = Label.new()
		d.text = h[1]
		d.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 1))
		d.add_theme_font_size_override("font_size", 14)
		box.add_child(d)
		_hint_bar.add_child(box)

func _update_input_lbl() -> void:
	if _input_mode_lbl:
		_input_mode_lbl.text = ("输入: %s" % InputManager.method_name())

func _on_reset() -> void:
	GameEvents.sfx_requested.emit("ui_cancel", -3.0)
	var d: AcceptDialog = AcceptDialog.new()
	d.title = "恢复默认设置？"
	d.dialog_text = "所有设置项将被恢复到出厂默认值，是否继续？"
	d.confirmed.connect(func():
		SettingsManager.reset_defaults()
		_build_ui()
	)
	add_child(d)
	d.popup_centered()

func _on_back() -> void:
	GameEvents.sfx_requested.emit("ui_accept", -3.0)
	SettingsManager.save_settings()
	SaveManager.save_current()
	get_tree().change_scene_to_file(_prev_scene_path)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_back()
	elif event.is_action_pressed("game_toggle_settings"):
		_on_back()
