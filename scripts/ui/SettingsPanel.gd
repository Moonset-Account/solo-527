extends Control

signal settings_applied()
signal settings_cancelled()

var overlay: ColorRect
var panel: Panel
var tab_container: TabContainer
var video_tab: ScrollContainer
var audio_tab: ScrollContainer
var gameplay_tab: ScrollContainer
var input_tab: ScrollContainer
var action_row: HBoxContainer
var apply_btn: Button
var cancel_btn: Button
var reset_btn: Button
var pending_settings: Dictionary = {}
var anim_tween: Tween

func _ready() -> void:
	_setup_panel()
	hide()

func _setup_panel() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	z_index = 45
	overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.65)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)
	var center = CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	panel = Panel.new()
	panel.custom_minimum_size = Vector2(720, 520)
	var bg_sb = StyleBoxFlat.new()
	bg_sb.bg_color = Color(0.1, 0.1, 0.14, 0.98)
	bg_sb.border_color = Color(0.35, 0.35, 0.5, 0.6)
	bg_sb.border_width_left = 2
	bg_sb.border_width_right = 2
	bg_sb.border_width_top = 2
	bg_sb.border_width_bottom = 2
	bg_sb.corner_radius_top_left = 14
	bg_sb.corner_radius_top_right = 14
	bg_sb.corner_radius_bottom_left = 14
	bg_sb.corner_radius_bottom_right = 14
	bg_sb.shadow_color = Color(0, 0, 0, 0.5)
	bg_sb.shadow_size = 12
	bg_sb.content_margin_left = 20
	bg_sb.content_margin_right = 20
	bg_sb.content_margin_top = 16
	bg_sb.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel", bg_sb)
	center.add_child(panel)
	var main_vb = VBoxContainer.new()
	main_vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_vb.offset_left = 20
	main_vb.offset_top = 16
	main_vb.offset_right = -20
	main_vb.offset_bottom = -16
	main_vb.add_theme_constant_override("separation", 10)
	panel.add_child(main_vb)
	var title = Label.new()
	title.text = "⚙ 游戏设置"
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", Color(0.88, 0.88, 0.95, 1))
	title.custom_minimum_size.y = 36
	main_vb.add_child(title)
	tab_container = TabContainer.new()
	tab_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tab_container.add_theme_font_size_override("font_size", 14)
	main_vb.add_child(tab_container)
	_build_video_tab()
	_build_audio_tab()
	_build_gameplay_tab()
	_build_input_tab()
	action_row = HBoxContainer.new()
	action_row.custom_minimum_size.y = 48
	action_row.alignment = BoxContainer.ALIGNMENT_END
	action_row.add_theme_constant_override("separation", 12)
	main_vb.add_child(action_row)
	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	action_row.add_child(spacer)
	reset_btn = Button.new()
	reset_btn.text = "恢复默认"
	reset_btn.custom_minimum_size = Vector2(110, 40)
	reset_btn.add_theme_font_size_override("font_size", 13)
	reset_btn.pressed.connect(_on_reset_pressed)
	action_row.add_child(reset_btn)
	cancel_btn = Button.new()
	cancel_btn.text = "取消"
	cancel_btn.custom_minimum_size = Vector2(100, 40)
	cancel_btn.add_theme_font_size_override("font_size", 13)
	cancel_btn.pressed.connect(_on_cancel_pressed)
	action_row.add_child(cancel_btn)
	apply_btn = Button.new()
	apply_btn.text = "应用"
	apply_btn.custom_minimum_size = Vector2(100, 40)
	apply_btn.add_theme_font_size_override("font_size", 13)
	var apply_sb = StyleBoxFlat.new()
	apply_sb.bg_color = Color(0.2, 0.6, 0.85, 1)
	apply_sb.corner_radius_top_left = 8
	apply_sb.corner_radius_top_right = 8
	apply_sb.corner_radius_bottom_left = 8
	apply_sb.corner_radius_bottom_right = 8
	apply_btn.add_theme_stylebox_override("normal", apply_sb)
	apply_btn.add_theme_color_override("font_color", Color.WHITE)
	apply_btn.pressed.connect(_on_apply_pressed)
	action_row.add_child(apply_btn)

func _build_video_tab() -> void:
	video_tab = ScrollContainer.new()
	video_tab.name = "  显示  "
	video_tab.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	tab_container.add_child(video_tab)
	var vb = VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_theme_constant_override("separation", 10)
	video_tab.add_child(vb)
	_add_section_title(vb, "分辨率与窗口")
	var vsync_row = _create_checkbox_row(vb, "启用垂直同步", SaveManager.get_setting("video.vsync", true),
		func(pressed): pending_settings["video.vsync"] = pressed)
	var fullscreen_row = _create_checkbox_row(vb, "全屏模式", SaveManager.get_setting("video.fullscreen", false),
		func(pressed): pending_settings["video.fullscreen"] = pressed)
	_add_section_title(vb, "帧率")
	var fps_options = [30, 60, 120, 144, 0]
	var fps_labels = ["30 FPS", "60 FPS", "120 FPS", "144 FPS", "无限制"]
	var fps_idx = 1
	var cur_fps = SaveManager.get_setting("video.frame_rate_limit", 60)
	for i in range(fps_options.size()):
		if fps_options[i] == cur_fps:
			fps_idx = i
			break
	var fps_row = _create_option_row(vb, "帧率限制", fps_labels, fps_idx,
		func(idx): pending_settings["video.frame_rate_limit"] = fps_options[idx])

func _build_audio_tab() -> void:
	audio_tab = ScrollContainer.new()
	audio_tab.name = "  音频  "
	audio_tab.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	tab_container.add_child(audio_tab)
	var vb = VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_theme_constant_override("separation", 8)
	audio_tab.add_child(vb)
	_add_section_title(vb, "音量")
	_create_hslider_row(vb, "主音量", -40.0, 10.0, SaveManager.get_setting("audio.master_volume", 0.0), "%.0f dB",
		func(val):
			pending_settings["audio.master_volume"] = val
			AudioManager.set_bus_volume("Master", val)
	)
	_create_hslider_row(vb, "音乐音量", -40.0, 10.0, SaveManager.get_setting("audio.music_volume", -5.0), "%.0f dB",
		func(val):
			pending_settings["audio.music_volume"] = val
			AudioManager.set_bus_volume("Music", val)
	)
	_create_hslider_row(vb, "音效音量", -40.0, 10.0, SaveManager.get_setting("audio.sfx_volume", -3.0), "%.0f dB",
		func(val):
			pending_settings["audio.sfx_volume"] = val
			AudioManager.set_bus_volume("SFX", val)
	)
	_create_hslider_row(vb, "界面音量", -40.0, 10.0, SaveManager.get_setting("audio.ui_volume", -2.0), "%.0f dB",
		func(val):
			pending_settings["audio.ui_volume"] = val
			AudioManager.set_bus_volume("UI", val)
	)

func _build_gameplay_tab() -> void:
	gameplay_tab = ScrollContainer.new()
	gameplay_tab.name = "  游戏  "
	gameplay_tab.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	tab_container.add_child(gameplay_tab)
	var vb = VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_theme_constant_override("separation", 8)
	gameplay_tab.add_child(vb)
	_add_section_title(vb, "通用")
	_create_checkbox_row(vb, "自动存档", SaveManager.get_setting("gameplay.auto_save", true),
		func(pressed): pending_settings["gameplay.auto_save"] = pressed)
	_create_checkbox_row(vb, "提交前确认", SaveManager.get_setting("gameplay.confirm_on_submit", true),
		func(pressed): pending_settings["gameplay.confirm_on_submit"] = pressed)
	_create_checkbox_row(vb, "启用提示", SaveManager.get_setting("gameplay.hint_enabled", true),
		func(pressed): pending_settings["gameplay.hint_enabled"] = pressed)
	_create_checkbox_row(vb, "显示性能统计", SaveManager.get_setting("gameplay.show_performance_stats", false),
		func(pressed): pending_settings["gameplay.show_performance_stats"] = pressed)
	_add_section_title(vb, "动画")
	_create_hslider_row(vb, "动画速度", 0.25, 2.0, SaveManager.get_setting("gameplay.animation_speed", 1.0), "%.2fx",
		func(val): pending_settings["gameplay.animation_speed"] = val)

func _build_input_tab() -> void:
	input_tab = ScrollContainer.new()
	input_tab.name = "  操作  "
	input_tab.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	tab_container.add_child(input_tab)
	var vb = VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_theme_constant_override("separation", 6)
	input_tab.add_child(vb)
	_add_section_title(vb, "按键绑定")
	var actions = ["ui_accept", "ui_cancel", "game_pause", "game_hint", "game_submit"]
	var action_names = {
		"ui_accept": "确认/选择",
		"ui_cancel": "取消/关闭",
		"game_pause": "暂停游戏",
		"game_hint": "请求提示",
		"game_submit": "提交答案"
	}
	for act in actions:
		var hbox = HBoxContainer.new()
		hbox.custom_minimum_size.y = 36
		hbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		vb.add_child(hbox)
		var lbl = Label.new()
		lbl.text = action_names.get(act, act)
		lbl.custom_minimum_size.x = 160
		lbl.add_theme_font_size_override("font_size", 13)
		lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.88, 1))
		hbox.add_child(lbl)
		var key_btn = Button.new()
		key_btn.text = InputManager.get_action_display(act)
		key_btn.custom_minimum_size.y = 32
		key_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		key_btn.add_theme_font_size_override("font_size", 13)
		key_btn.pressed.connect(func():
			key_btn.text = "按下任意键..."
			InputManager.start_rebinding(act, Callable(self, "_on_key_rebound").bind(act, key_btn)))
		hbox.add_child(key_btn)
		var reset = Button.new()
		reset.text = "重置"
		reset.custom_minimum_size = Vector2(60, 32)
		reset.add_theme_font_size_override("font_size", 11)
		reset.pressed.connect(func():
			InputManager.reset_action_to_default(act)
			key_btn.text = InputManager.get_action_display(act))
		hbox.add_child(reset)
	var tip = Label.new()
	tip.text = "\n提示：点击按键按钮，然后按下想要设置的键位。"
	tip.add_theme_font_size_override("font_size", 11)
	tip.add_theme_color_override("font_color", Color(0.55, 0.55, 0.65, 1))
	tip.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(tip)

func _on_key_rebound(mapping: Dictionary, display: String, action: String, btn: Button) -> void:
	InputManager.set_action_mapping(action, [mapping])
	btn.text = display
	AudioManager.play_ui_sound("ui_click")
	EventBus.emit_signal("feedback_shown", "按键已更新：%s = %s" % [action, display], "success", 1.5)

func _add_section_title(parent: VBoxContainer, text: String) -> void:
	var lbl = RichTextLabel.new()
	lbl.bbcode_enabled = true
	lbl.text = "[b]%s[/b]" % text
	lbl.add_theme_font_size_override("normal_font_size", 14)
	lbl.add_theme_color_override("default_color", Color(0.75, 0.75, 0.85, 1))
	lbl.custom_minimum_size.y = 28
	lbl.fit_content = true
	parent.add_child(lbl)

func _create_checkbox_row(parent: VBoxContainer, label: String, default_val: bool, callback: Callable) -> HBoxContainer:
	var hbox = HBoxContainer.new()
	hbox.custom_minimum_size.y = 34
	hbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(hbox)
	var lbl = Label.new()
	lbl.text = label
	lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	lbl.add_theme_font_size_override("font_size", 13)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.88, 1))
	hbox.add_child(lbl)
	var cb = CheckBox.new()
	cb.button_pressed = default_val
	cb.custom_minimum_size = Vector2(40, 24)
	cb.toggled.connect(callback)
	hbox.add_child(cb)
	return hbox

func _create_option_row(parent: VBoxContainer, label: String, options: Array, default_idx: int, callback: Callable) -> HBoxContainer:
	var hbox = HBoxContainer.new()
	hbox.custom_minimum_size.y = 36
	hbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(hbox)
	var lbl = Label.new()
	lbl.text = label
	lbl.custom_minimum_size.x = 140
	lbl.add_theme_font_size_override("font_size", 13)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.88, 1))
	hbox.add_child(lbl)
	var opt = OptionButton.new()
	opt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	opt.custom_minimum_size.y = 32
	for o in options:
		opt.add_item(str(o))
	opt.select(default_idx)
	opt.item_selected.connect(callback)
	hbox.add_child(opt)
	return hbox

func _create_hslider_row(parent: VBoxContainer, label: String, min_val: float, max_val: float, default_val: float, format_str: String, callback: Callable) -> HBoxContainer:
	var hbox = HBoxContainer.new()
	hbox.custom_minimum_size.y = 40
	hbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(hbox)
	var lbl = Label.new()
	lbl.text = label
	lbl.custom_minimum_size.x = 140
	lbl.add_theme_font_size_override("font_size", 13)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.8, 0.88, 1))
	hbox.add_child(lbl)
	var slider = HSlider.new()
	slider.min_value = min_val
	slider.max_value = max_val
	slider.step = 1.0
	slider.value = default_val
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.custom_minimum_size.y = 30
	hbox.add_child(slider)
	var val_lbl = Label.new()
	val_lbl.text = format_str % default_val
	val_lbl.custom_minimum_size.x = 70
	val_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	val_lbl.add_theme_font_size_override("font_size", 12)
	val_lbl.add_theme_color_override("font_color", Color(0.7, 0.85, 1.0, 1))
	hbox.add_child(val_lbl)
	slider.value_changed.connect(func(v):
		val_lbl.text = format_str % v
		callback.call(v))
	return hbox

func show_panel() -> void:
	pending_settings = {}
	show()
	_animate_in()
	AudioManager.play_ui_sound("ui_click")

func hide_panel() -> void:
	_animate_out()

func _animate_in() -> void:
	if anim_tween:
		anim_tween.kill()
	modulate.a = 0.0
	panel.scale = Vector2(0.9, 0.9)
	overlay.modulate.a = 0.0
	anim_tween = create_tween()
	anim_tween.set_parallel(true)
	anim_tween.tween_property(self, "modulate:a", 1.0, 0.15 * GameManager.animation_speed)
	anim_tween.tween_property(overlay, "modulate:a", 0.65, 0.2 * GameManager.animation_speed)
	anim_tween.tween_property(panel, "scale", Vector2.ONE, 0.25 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _animate_out() -> void:
	if anim_tween:
		anim_tween.kill()
	anim_tween = create_tween()
	anim_tween.set_parallel(true)
	anim_tween.tween_property(self, "modulate:a", 0.0, 0.15 * GameManager.animation_speed)
	anim_tween.tween_property(panel, "scale", Vector2(0.9, 0.9), 0.15 * GameManager.animation_speed)
	anim_tween.finished.connect(hide)

func _on_apply_pressed() -> void:
	for key in pending_settings.keys():
		SaveManager.set_setting(key, pending_settings[key])
		if key.begins_with("video"):
			SaveManager.apply_settings_to_engine()
		if key == "gameplay.animation_speed":
			GameManager.set_animation_speed(float(pending_settings[key]))
		if key == "gameplay.show_performance_stats":
			EventBus.emit_signal("settings_changed", "performance_hud")
	AudioManager.reload_volume_settings()
	AudioManager.play_ui_sound("ui_click")
	EventBus.emit_signal("settings_changed", "all")
	EventBus.emit_signal("feedback_shown", "设置已应用", "success", 1.5)
	emit_signal("settings_applied")
	_animate_out()

func _on_cancel_pressed() -> void:
	AudioManager.reload_volume_settings()
	AudioManager.play_ui_sound("ui_click")
	emit_signal("settings_cancelled")
	_animate_out()

func _on_reset_pressed() -> void:
	var defaults = SaveManager.get_default_settings()
	SaveManager.set_setting("video", defaults["video"])
	SaveManager.set_setting("audio", defaults["audio"])
	SaveManager.set_setting("gameplay", defaults["gameplay"])
	InputManager.reset_all_to_default()
	SaveManager.apply_settings_to_engine()
	AudioManager.reload_volume_settings()
	EventBus.emit_signal("feedback_shown", "已恢复默认设置", "info", 2.0)
	emit_signal("settings_applied")
	_animate_out()
	AudioManager.play_ui_sound("ui_click")

func _input(event: InputEvent) -> void:
	if visible and event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		_on_cancel_pressed()
