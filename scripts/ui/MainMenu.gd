extends Control

signal start_selected(level_id: String)
signal tutorial_requested()
signal settings_requested()
signal quit_requested()

var vb_main: VBoxContainer
var title_label: Label
var subtitle_label: Label
var buttons_container: VBoxContainer
var start_btn: Button
var continue_btn: Button
var tutorial_btn: Button
var settings_btn: Button
var quit_btn: Button
var profile_info: Label
var version_label: Label
var anim_tween: Tween
var bg_particles: GPUParticles2D

func _ready() -> void:
	_setup_menu()
	_play_intro_animation()

func _setup_menu() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var bg = ColorRect.new()
	bg.color = Color(0.06, 0.06, 0.09, 1)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_create_background_decor(bg)
	var center = CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	vb_main = VBoxContainer.new()
	vb_main.alignment = BoxContainer.ALIGNMENT_CENTER
	vb_main.add_theme_constant_override("separation", 24)
	vb_main.custom_minimum_size = Vector2(600, 500)
	center.add_child(vb_main)
	var title_vb = VBoxContainer.new()
	title_vb.custom_minimum_size.y = 140
	title_vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb_main.add_child(title_vb)
	title_label = Label.new()
	title_label.text = "档案室"
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_label.add_theme_font_size_override("font_size", 64)
	title_label.add_theme_color_override("font_color", Color(0.95, 0.85, 0.65, 1))
	title_label.custom_minimum_size.y = 80
	title_vb.add_child(title_label)
	subtitle_label = Label.new()
	subtitle_label.text = "时 间 线 推 理"
	subtitle_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle_label.add_theme_font_size_override("font_size", 20)
	subtitle_label.add_theme_color_override("font_color", Color(0.55, 0.65, 0.85, 1))
	subtitle_label.custom_minimum_size.y = 36
	title_vb.add_child(subtitle_label)
	var sep = HSeparator.new()
	sep.custom_minimum_size = Vector2(300, 2)
	sep.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	vb_main.add_child(sep)
	buttons_container = VBoxContainer.new()
	buttons_container.alignment = BoxContainer.ALIGNMENT_CENTER
	buttons_container.add_theme_constant_override("separation", 14)
	buttons_container.custom_minimum_size.y = 280
	vb_main.add_child(buttons_container)
	start_btn = _create_menu_button("开始新游戏", "▶", Color(0.2, 0.6, 0.85, 1), Color(0.3, 0.7, 0.95, 1))
	start_btn.pressed.connect(_on_start_pressed)
	buttons_container.add_child(start_btn)
	continue_btn = _create_menu_button("继续游戏", "↻", Color(0.3, 0.55, 0.4, 1), Color(0.4, 0.65, 0.5, 1))
	continue_btn.pressed.connect(_on_continue_pressed)
	continue_btn.disabled = not SaveManager.has_auto_save()
	buttons_container.add_child(continue_btn)
	tutorial_btn = _create_menu_button("游戏教程", "?", Color(0.5, 0.5, 0.35, 1), Color(0.6, 0.6, 0.45, 1))
	tutorial_btn.pressed.connect(_on_tutorial_pressed)
	buttons_container.add_child(tutorial_btn)
	settings_btn = _create_menu_button("设置选项", "⚙", Color(0.4, 0.4, 0.55, 1), Color(0.5, 0.5, 0.65, 1))
	settings_btn.pressed.connect(_on_settings_pressed)
	buttons_container.add_child(settings_btn)
	quit_btn = _create_menu_button("退出游戏", "✕", Color(0.65, 0.3, 0.3, 1), Color(0.75, 0.4, 0.4, 1))
	quit_btn.pressed.connect(_on_quit_pressed)
	buttons_container.add_child(quit_btn)
	var info_bar = HBoxContainer.new()
	info_bar.custom_minimum_size.y = 30
	info_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	vb_main.add_child(info_bar)
	profile_info = Label.new()
	profile_info.text = "档案员: %s  |  总游玩: %.1f 小时" % [
		SaveManager.profile.get("player_name", "档案员"),
		float(SaveManager.profile.get("total_play_time", 0.0)) / 3600.0
	]
	profile_info.add_theme_font_size_override("font_size", 12)
	profile_info.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6, 1))
	info_bar.add_child(profile_info)
	version_label = Label.new()
	version_label.text = " v" + ConfigManager.game_config.get("game", {}).get("version", "1.0.0")
	version_label.add_theme_font_size_override("font_size", 11)
	version_label.add_theme_color_override("font_color", Color(0.35, 0.35, 0.45, 1))
	version_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	version_label.offset_left = -80
	version_label.offset_top = -24
	version_label.offset_right = -12
	version_label.offset_bottom = -8
	add_child(version_label)

func _create_background_decor(parent: Node) -> void:
	var decor_count = 40
	for i in range(decor_count):
		var line = ColorRect.new()
		line.color = Color(0.18, 0.22, 0.3, randf_range(0.05, 0.18))
		line.custom_minimum_size = Vector2(randf_range(40, 220), randf_range(1, 2))
		line.position = Vector2(randf_range(0, 1280), randf_range(0, 720))
		line.rotation = randf_range(-0.6, 0.6)
		add_child(line)
	var dust_count = 60
	for i in range(dust_count):
		var dot = ColorRect.new()
		dot.color = Color(0.9, 0.85, 0.7, randf_range(0.05, 0.2))
		var sz = randf_range(1.5, 4)
		dot.custom_minimum_size = Vector2(sz, sz)
		dot.position = Vector2(randf_range(0, 1280), randf_range(0, 720))
		add_child(dot)

func _create_menu_button(text: String, icon: String, base_color: Color, hover_color: Color) -> Button:
	var btn = Button.new()
	btn.text = "  %s   %s  " % [icon, text]
	btn.custom_minimum_size = Vector2(320, 54)
	btn.add_theme_font_size_override("font_size", 18)
	btn.add_theme_color_override("font_color", Color.WHITE)
	var sb_normal = StyleBoxFlat.new()
	sb_normal.bg_color = base_color
	sb_normal.corner_radius_top_left = 10
	sb_normal.corner_radius_top_right = 10
	sb_normal.corner_radius_bottom_left = 10
	sb_normal.corner_radius_bottom_right = 10
	sb_normal.shadow_color = Color(0, 0, 0, 0.3)
	sb_normal.shadow_size = 6
	sb_normal.shadow_offset = Vector2(0, 3)
	sb_normal.content_margin_left = 20
	sb_normal.content_margin_right = 20
	btn.add_theme_stylebox_override("normal", sb_normal)
	var sb_hover = sb_normal.duplicate()
	sb_hover.bg_color = hover_color
	sb_hover.shadow_size = 10
	sb_hover.shadow_offset = Vector2(0, 5)
	btn.add_theme_stylebox_override("hover", sb_hover)
	var sb_pressed = sb_normal.duplicate()
	sb_pressed.bg_color = base_color.darkened(0.15)
	sb_pressed.shadow_size = 3
	sb_pressed.shadow_offset = Vector2(0, 1)
	btn.add_theme_stylebox_override("pressed", sb_pressed)
	var sb_disabled = sb_normal.duplicate()
	sb_disabled.bg_color = Color(0.2, 0.2, 0.25, 0.6)
	sb_disabled.shadow_size = 0
	btn.add_theme_stylebox_override("disabled", sb_disabled)
	btn.mouse_entered.connect(func(): AudioManager.play_ui_sound("ui_hover"))
	return btn

func _play_intro_animation() -> void:
	title_label.modulate.a = 0.0
	subtitle_label.modulate.a = 0.0
	var btn_children: Array = buttons_container.get_children()
	for btn: Control in btn_children:
		btn.modulate.a = 0.0
		btn.position.y = 20
	anim_tween = create_tween()
	anim_tween.tween_property(title_label, "modulate:a", 1.0, 0.8 * GameManager.animation_speed)
	anim_tween.tween_interval(0.2)
	anim_tween.tween_property(subtitle_label, "modulate:a", 1.0, 0.6 * GameManager.animation_speed)
	anim_tween.tween_interval(0.3)
	for btn: Control in btn_children:
		var t2: Tween = create_tween()
		t2.tween_property(btn, "modulate:a", 1.0, 0.3 * GameManager.animation_speed)
		t2.parallel().tween_property(btn, "position:y", 0.0, 0.35 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		anim_tween.tween_interval(0.1)

func _on_start_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("start_selected", "tutorial")

func _on_continue_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	var save_data: Dictionary = SaveManager.load_auto_save()
	var level_id: String = str(save_data.get("level_id", "tutorial"))
	if not level_id.is_empty():
		emit_signal("start_selected", "__continue__")

func _on_tutorial_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("tutorial_requested")

func _on_settings_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("settings_requested")

func _on_quit_pressed() -> void:
	AudioManager.play_ui_sound("ui_click")
	emit_signal("quit_requested")
