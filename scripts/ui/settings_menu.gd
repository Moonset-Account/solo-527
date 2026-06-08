extends Control
class_name SettingsMenu

signal close_requested

var master_volume_slider: HSlider
var sfx_volume_slider: HSlider
var music_volume_slider: HSlider
var fullscreen_check: CheckBox
var show_vision_cones_check: CheckBox
var show_noise_indicator_check: CheckBox
var language_option: OptionButton

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	size = Vector2(1280, 720)

	var overlay = ColorRect.new()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.color = Color(0, 0, 0, 0.6)
	add_child(overlay)

	var panel = Panel.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.position = Vector2(-200, -250)
	panel.size = Vector2(400, 500)
	var panel_style = StyleBoxFlat.new()
	panel_style.bg_color = Color(0.15, 0.15, 0.2)
	panel_style.border_color = Color(0.3, 0.3, 0.4)
	panel_style.border_width_top = 2
	panel_style.border_width_bottom = 2
	panel_style.border_width_left = 2
	panel_style.border_width_right = 2
	panel_style.corner_radius_top_left = 8
	panel_style.corner_radius_top_right = 8
	panel_style.corner_radius_bottom_left = 8
	panel_style.corner_radius_bottom_right = 8
	panel.add_theme_stylebox_override("panel", panel_style)
	add_child(panel)

	var container = VBoxContainer.new()
	container.set_anchors_preset(Control.PRESET_CENTER)
	container.position = Vector2(-170, -230)
	container.size = Vector2(340, 460)
	container.add_theme_constant_override("separation", 12)

	var title = Label.new()
	title.text = "设置"
	title.add_theme_font_size_override("font_size", 24)
	title.add_theme_color_override("font_color", Color.WHITE)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	container.add_child(title)

	master_volume_slider = _create_slider_row(container, "主音量", 0, 100)
	sfx_volume_slider = _create_slider_row(container, "音效音量", 0, 100)
	music_volume_slider = _create_slider_row(container, "音乐音量", 0, 100)

	fullscreen_check = _create_check_row(container, "全屏")
	show_vision_cones_check = _create_check_row(container, "显示视野锥")
	show_noise_indicator_check = _create_check_row(container, "显示噪音指示器")

	var lang_hbox = HBoxContainer.new()
	var lang_label = Label.new()
	lang_label.text = "语言"
	lang_label.add_theme_color_override("font_color", Color.WHITE)
	lang_label.custom_minimum_size.x = 120
	lang_hbox.add_child(lang_label)
	language_option = OptionButton.new()
	language_option.add_item("中文")
	language_option.add_item("English")
	lang_hbox.add_child(language_option)
	container.add_child(lang_hbox)

	var spacer = Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	container.add_child(spacer)

	var btn_hbox = HBoxContainer.new()
	btn_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_hbox.add_theme_constant_override("separation", 20)

	var apply_btn = Button.new()
	apply_btn.text = "应用"
	apply_btn.custom_minimum_size = Vector2(100, 36)
	apply_btn.pressed.connect(_on_apply)
	btn_hbox.add_child(apply_btn)

	var back_btn = Button.new()
	back_btn.text = "返回"
	back_btn.custom_minimum_size = Vector2(100, 36)
	back_btn.pressed.connect(_on_back)
	btn_hbox.add_child(back_btn)

	container.add_child(btn_hbox)
	add_child(container)

func _create_slider_row(parent: VBoxContainer, label_text: String, min_val: float, max_val: float) -> HSlider:
	var hbox = HBoxContainer.new()
	var label = Label.new()
	label.text = label_text
	label.add_theme_color_override("font_color", Color.WHITE)
	label.custom_minimum_size.x = 120
	hbox.add_child(label)
	var slider = HSlider.new()
	slider.min_value = min_val
	slider.max_value = max_val
	slider.step = 1
	slider.value = 50
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(slider)
	parent.add_child(hbox)
	return slider

func _create_check_row(parent: VBoxContainer, label_text: String) -> CheckBox:
	var hbox = HBoxContainer.new()
	var label = Label.new()
	label.text = label_text
	label.add_theme_color_override("font_color", Color.WHITE)
	label.custom_minimum_size.x = 120
	hbox.add_child(label)
	var check = CheckBox.new()
	hbox.add_child(check)
	parent.add_child(hbox)
	return check

func _on_apply() -> void:
	SettingsManager.set_setting("master_volume", master_volume_slider.value)
	SettingsManager.set_setting("sfx_volume", sfx_volume_slider.value)
	SettingsManager.set_setting("music_volume", music_volume_slider.value)
	SettingsManager.set_setting("fullscreen", fullscreen_check.button_pressed)
	SettingsManager.set_setting("show_vision_cones", show_vision_cones_check.button_pressed)
	SettingsManager.set_setting("show_noise_indicator", show_noise_indicator_check.button_pressed)
	SettingsManager.set_setting("language", language_option.selected)
	SettingsManager.save_settings()

func _on_back() -> void:
	close_requested.emit()
