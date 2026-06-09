extends Control

class_name SettingsPanel

var master_slider: HSlider
var sfx_slider: HSlider
var music_slider: HSlider
var fullscreen_check: CheckButton
var debug_check: CheckButton

func _ready():
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_ui()
	_load_settings()

func _build_ui():
	var dim = ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var panel = Panel.new()
	panel.name = "PanelContainer"
	panel.position = Vector2(380, 100)
	panel.size = Vector2(520, 520)
	panel.modulate = Color(0.08, 0.12, 0.18, 0.98)
	add_child(panel)
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(400, 120)
	vbox.custom_minimum_size = Vector2(480, 480)
	vbox.add_theme_constant_override("separation", 12)
	add_child(vbox)
	var title = Label.new()
	title.name = "TitleLabel"
	title.text = "⚙️ 设置"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	title.modulate = Color(0.85, 0.7, 1.0)
	vbox.add_child(title)
	var scroll = ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(480, 380)
	vbox.add_child(scroll)
	var inner = VBoxContainer.new()
	inner.name = "VBoxContainer"
	inner.custom_minimum_size = Vector2(460, 350)
	inner.add_theme_constant_override("separation", 14)
	scroll.add_child(inner)
	master_slider = _add_volume_row(inner, "主音量", 80, Color(0.5, 0.8, 1.0))
	master_slider.value_changed.connect(_on_master_changed)
	sfx_slider = _add_volume_row(inner, "音效音量", 80, Color(0.8, 1.0, 0.5))
	sfx_slider.value_changed.connect(_on_sfx_changed)
	music_slider = _add_volume_row(inner, "音乐音量", 60, Color(1.0, 0.6, 0.8))
	music_slider.value_changed.connect(_on_music_changed)
	var sep1 = HSeparator.new()
	sep1.modulate = Color(0.3, 0.35, 0.4)
	inner.add_child(sep1)
	fullscreen_check = CheckButton.new()
	fullscreen_check.name = "FullscreenCheck"
	fullscreen_check.text = "  全屏模式"
	fullscreen_check.custom_minimum_size = Vector2(460, 35)
	fullscreen_check.add_theme_font_size_override("font_size", 16)
	fullscreen_check.toggled.connect(_on_fullscreen_toggled)
	inner.add_child(fullscreen_check)
	debug_check = CheckButton.new()
	debug_check.name = "DebugLogCheck"
	debug_check.text = "  显示调试日志 (游戏中按F1切换)"
	debug_check.custom_minimum_size = Vector2(460, 35)
	debug_check.add_theme_font_size_override("font_size", 16)
	debug_check.toggled.connect(_on_debug_toggled)
	inner.add_child(debug_check)
	var sep2 = HSeparator.new()
	sep2.modulate = Color(0.3, 0.35, 0.4)
	inner.add_child(sep2)
	var reset_btn = Button.new()
	reset_btn.name = "ResetSaveButton"
	reset_btn.text = "⚠️  重置所有存档数据"
	reset_btn.custom_minimum_size = Vector2(460, 40)
	reset_btn.add_theme_font_size_override("font_size", 14)
	var rs = StyleBoxFlat.new()
	rs.bg_color = Color(0.8, 0.3, 0.3)
	rs.corner_radius_top_left = 5
	rs.corner_radius_top_right = 5
	rs.corner_radius_bottom_left = 5
	rs.corner_radius_bottom_right = 5
	reset_btn.add_theme_stylebox_override("normal", rs)
	reset_btn.pressed.connect(_on_reset_save)
	inner.add_child(reset_btn)
	var close_btn = Button.new()
	close_btn.name = "CloseButton"
	close_btn.text = "✅ 保存并返回"
	close_btn.custom_minimum_size = Vector2(480, 40)
	close_btn.add_theme_font_size_override("font_size", 15)
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.3, 0.7, 0.45)
	sb.corner_radius_top_left = 5
	sb.corner_radius_top_right = 5
	sb.corner_radius_bottom_left = 5
	sb.corner_radius_bottom_right = 5
	close_btn.add_theme_stylebox_override("normal", sb)
	vbox.add_child(close_btn)
	close_btn.pressed.connect(func():
		AudioManager.play_sfx("ui_click")
		queue_free())

func _add_volume_row(container: VBoxContainer, name: String, default_val: float, color: Color) -> HSlider:
	var row = HBoxContainer.new()
	row.name = "%sRow" % name.replace("音量", "")
	row.custom_minimum_size = Vector2(460, 50)
	row.add_theme_constant_override("separation", 15)
	var lbl = Label.new()
	lbl.text = "%s: %d%%" % [name, int(default_val)]
	lbl.custom_minimum_size = Vector2(160, 40)
	lbl.add_theme_font_size_override("font_size", 15)
	row.add_child(lbl)
	var slider = HSlider.new()
	slider.name = "Slider"
	slider.custom_minimum_size = Vector2(260, 40)
	slider.max_value = 100
	slider.min_value = 0
	slider.step = 1
	slider.value = default_val
	slider.add_theme_color_override("font_color", color)
	row.add_child(slider)
	container.add_child(row)
	return slider

func _load_settings():
	master_slider.value = SaveManager.settings.get("master_volume", 0.8) * 100
	sfx_slider.value = SaveManager.settings.get("sfx_volume", 0.8) * 100
	music_slider.value = SaveManager.settings.get("music_volume", 0.6) * 100
	fullscreen_check.button_pressed = SaveManager.settings.get("fullscreen", false)
	debug_check.button_pressed = SaveManager.settings.get("show_debug_log", true)

func _on_master_changed(value: float):
	AudioManager.set_master_volume(value / 100.0)
	var lbl = master_slider.get_parent().get_node("Label")
	if lbl:
		lbl.text = "主音量: %d%%" % int(value)

func _on_sfx_changed(value: float):
	AudioManager.set_sfx_volume(value / 100.0)
	var lbl = sfx_slider.get_parent().get_node("Label")
	if lbl:
		lbl.text = "音效音量: %d%%" % int(value)

func _on_music_changed(value: float):
	AudioManager.set_music_volume(value / 100.0)
	var lbl = music_slider.get_parent().get_node("Label")
	if lbl:
		lbl.text = "音乐音量: %d%%" % int(value)

func _on_fullscreen_toggled(pressed: bool):
	AudioManager.set_fullscreen(pressed)

func _on_debug_toggled(pressed: bool):
	SaveManager.settings["show_debug_log"] = pressed
	SaveManager.save_settings()
	AudioManager.play_sfx("ui_click")

func _on_reset_save():
	var confirm = ConfirmationDialog.new()
	confirm.title = "⚠️ 确认重置"
	confirm.dialog_text = "确定要重置所有存档数据吗？\n这将清除所有进度、成就和排行榜数据！\n\n此操作不可撤销。"
	confirm.get_ok_button().text = "确认重置"
	confirm.confirmed.connect(func():
		SaveManager.reset_save()
		AudioManager.play_sfx("ui_click")
		_show_message("✅ 存档已重置"))
	add_child(confirm)
	confirm.popup_centered()
	AudioManager.play_sfx("ui_click")

func _show_message(msg: String):
	var popup = Label.new()
	popup.text = msg
	popup.position = Vector2(500, 300)
	popup.custom_minimum_size = Vector2(280, 50)
	popup.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	popup.add_theme_font_size_override("font_size", 18)
	popup.modulate = Color(0.3, 1.0, 0.5, 1)
	popup.z_index = 1000
	add_child(popup)
	var tween = create_tween()
	tween.tween_property(popup, "modulate:a", 1.0, 0.2)
	tween.tween_interval(1.5)
	tween.tween_property(popup, "modulate:a", 0.0, 0.3)
	tween.tween_callback(func(): popup.queue_free())
