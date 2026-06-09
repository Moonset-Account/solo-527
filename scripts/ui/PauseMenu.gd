extends Control

signal resume_requested()
signal restart_requested()
signal settings_requested()
signal quit_requested()

var overlay: ColorRect
var panel: Panel
var title_label: Label
var vb: VBoxContainer
var resume_btn: Button
var restart_btn: Button
var settings_btn: Button
var quit_btn: Button
var anim_tween: Tween

func _ready() -> void:
	_setup_menu()
	hide()

func _setup_menu() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	z_index = 40
	overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.55)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(overlay)
	var center = CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	panel = Panel.new()
	panel.custom_minimum_size = Vector2(400, 360)
	var bg_sb = StyleBoxFlat.new()
	bg_sb.bg_color = Color(0.11, 0.11, 0.16, 0.98)
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
	bg_sb.content_margin_left = 28
	bg_sb.content_margin_right = 28
	bg_sb.content_margin_top = 24
	bg_sb.content_margin_bottom = 24
	panel.add_theme_stylebox_override("panel", bg_sb)
	center.add_child(panel)
	vb = VBoxContainer.new()
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 28
	vb.offset_top = 24
	vb.offset_right = -28
	vb.offset_bottom = -24
	vb.add_theme_constant_override("separation", 14)
	panel.add_child(vb)
	title_label = Label.new()
	title_label.text = "游戏暂停"
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_label.add_theme_font_size_override("font_size", 26)
	title_label.add_theme_color_override("font_color", Color(0.88, 0.88, 0.95, 1))
	title_label.custom_minimum_size.y = 48
	vb.add_child(title_label)
	var sep = HSeparator.new()
	sep.custom_minimum_size.y = 6
	vb.add_child(sep)
	resume_btn = Button.new()
	resume_btn.text = "继续游戏 (Esc)"
	resume_btn.custom_minimum_size.y = 48
	resume_btn.add_theme_font_size_override("font_size", 16)
	_create_button_style(resume_btn, Color(0.2, 0.6, 0.85, 1), Color(0.3, 0.7, 0.95, 1))
	resume_btn.pressed.connect(_on_resume_pressed)
	vb.add_child(resume_btn)
	restart_btn = Button.new()
	restart_btn.text = "重新开始本关"
	restart_btn.custom_minimum_size.y = 44
	restart_btn.add_theme_font_size_override("font_size", 15)
	_create_button_style(restart_btn, Color(0.8, 0.55, 0.2, 1), Color(0.9, 0.65, 0.3, 1))
	restart_btn.pressed.connect(_on_restart_pressed)
	vb.add_child(restart_btn)
	settings_btn = Button.new()
	settings_btn.text = "游戏设置"
	settings_btn.custom_minimum_size.y = 44
	settings_btn.add_theme_font_size_override("font_size", 15)
	_create_button_style(settings_btn, Color(0.35, 0.35, 0.45, 1), Color(0.45, 0.45, 0.55, 1))
	settings_btn.pressed.connect(_on_settings_pressed)
	vb.add_child(settings_btn)
	quit_btn = Button.new()
	quit_btn.text = "返回主菜单"
	quit_btn.custom_minimum_size.y = 44
	quit_btn.add_theme_font_size_override("font_size", 15)
	_create_button_style(quit_btn, Color(0.7, 0.25, 0.25, 1), Color(0.8, 0.35, 0.35, 1))
	quit_btn.pressed.connect(_on_quit_pressed)
	vb.add_child(quit_btn)

func _create_button_style(btn: Button, base: Color, hover: Color) -> void:
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

func show_menu() -> void:
	show()
	_animate_in()
	AudioManager.play_ui_sound("ui_click")

func hide_menu() -> void:
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
	anim_tween.tween_property(overlay, "modulate:a", 0.55, 0.2 * GameManager.animation_speed)
	anim_tween.tween_property(panel, "scale", Vector2.ONE, 0.25 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _animate_out() -> void:
	if anim_tween:
		anim_tween.kill()
	anim_tween = create_tween()
	anim_tween.set_parallel(true)
	anim_tween.tween_property(self, "modulate:a", 0.0, 0.15 * GameManager.animation_speed)
	anim_tween.tween_property(panel, "scale", Vector2(0.9, 0.9), 0.15 * GameManager.animation_speed)
	anim_tween.finished.connect(hide)

func _on_resume_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("resume_requested")

func _on_restart_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("restart_requested")

func _on_settings_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("settings_requested")

func _on_quit_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("quit_requested")

func _input(event: InputEvent) -> void:
	if visible and event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		_on_resume_pressed()
