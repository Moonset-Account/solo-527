extends Control

var _title_label: Label
var _subtitle_label: Label
var _button_start: Button
var _button_tutorial: Button
var _button_levels: Button
var _button_settings: Button
var _button_quit: Button
var _version_label: Label
var _bg_particles: CPUParticles2D

func _ready() -> void:
	_build_ui()
	_apply_theme()
	_connect_signals()
	AudioManager.play_bgm("menu")
	DebugLog.log_info("主菜单已加载")

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.09, 0.12, 0.22)
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	bg.mouse_filter = 0
	add_child(bg)

	_bg_particles = CPUParticles2D.new()
	_bg_particles.amount = 40
	_bg_particles.lifetime = 5.0
	_bg_particles.preprocess = 2.0
	_bg_particles.speed_scale = 0.4
	_bg_particles.direction = Vector2(0, -1)
	_bg_particles.spread = 30.0
	_bg_particles.gravity = Vector2(0, -5)
	_bg_particles.scale_amount_min = 2.0
	_bg_particles.scale_amount_max = 5.0
	_bg_particles.color = Color(0.5, 0.7, 1.0, 0.4)
	_bg_particles.position = Vector2(640, 720)
	add_child(_bg_particles)

	var main_vbox := VBoxContainer.new()
	main_vbox.anchor_left = 0.5
	main_vbox.anchor_top = 0.5
	main_vbox.anchor_right = 0.5
	main_vbox.anchor_bottom = 0.5
	main_vbox.offset_left = -260
	main_vbox.offset_top = -280
	main_vbox.offset_right = 260
	main_vbox.offset_bottom = 280
	main_vbox.alignment = 1
	add_child(main_vbox)

	var title_spacer_top := Control.new()
	title_spacer_top.custom_minimum_size = Vector2(0, 40)
	main_vbox.add_child(title_spacer_top)

	_title_label = Label.new()
	_title_label.text = "🎪 社团活动战术棋"
	_title_label.horizontal_alignment = 1
	_title_label.add_theme_font_size_override("font_size", 44)
	_title_label.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
	main_vbox.add_child(_title_label)

	_subtitle_label = Label.new()
	_subtitle_label.text = "~ Club Activity Tactics ~"
	_subtitle_label.horizontal_alignment = 1
	_subtitle_label.add_theme_font_size_override("font_size", 18)
	_subtitle_label.add_theme_color_override("font_color", Color(0.6, 0.8, 1.0, 0.9))
	_subtitle_label.custom_minimum_size = Vector2(0, 28)
	main_vbox.add_child(_subtitle_label)

	var subtitle2 := Label.new()
	subtitle2.text = "安排社团成员 · 完成布展宣传接待 · 赢得满意度"
	subtitle2.horizontal_alignment = 1
	subtitle2.add_theme_font_size_override("font_size", 14)
	subtitle2.add_theme_color_override("font_color", Color(0.7, 0.75, 0.85))
	main_vbox.add_child(subtitle2)

	var spacer_mid := Control.new()
	spacer_mid.custom_minimum_size = Vector2(0, 40)
	main_vbox.add_child(spacer_mid)

	var buttons_center := VBoxContainer.new()
	buttons_center.alignment = 1
	buttons_center.size_flags_horizontal = 4
	main_vbox.add_child(buttons_center)

	_button_start = _make_menu_button("▶  开始游戏", Color(0.3, 0.75, 0.5))
	buttons_center.add_child(_button_start)

	_button_tutorial = _make_menu_button("📖  游戏教程", Color(0.35, 0.6, 0.95))
	buttons_center.add_child(_button_tutorial)

	_button_levels = _make_menu_button("🗺️  关卡选择", Color(0.9, 0.7, 0.3))
	buttons_center.add_child(_button_levels)

	_button_settings = _make_menu_button("⚙️  音量设置", Color(0.6, 0.5, 0.85))
	buttons_center.add_child(_button_settings)

	_button_quit = _make_menu_button("❌  退出游戏", Color(0.85, 0.4, 0.45))
	buttons_center.add_child(_button_quit)

	var spacer_bottom := Control.new()
	spacer_bottom.custom_minimum_size = Vector2(0, 20)
	spacer_bottom.size_flags_vertical = 3
	main_vbox.add_child(spacer_bottom)

	var hb_bottom := HBoxContainer.new()
	hb_bottom.size_flags_horizontal = 3
	main_vbox.add_child(hb_bottom)

	var tip_label := Label.new()
	tip_label.text = "💡 提示: Alt+F3 打开调试面板"
	tip_label.add_theme_color_override("font_color", Color(0.6, 0.65, 0.75))
	tip_label.size_flags_horizontal = 3
	hb_bottom.add_child(tip_label)

	_version_label = Label.new()
	_version_label.text = "v1.0.0 · Godot 4.6"
	_version_label.add_theme_color_override("font_color", Color(0.55, 0.6, 0.7))
	_version_label.horizontal_alignment = 2
	_version_label.size_flags_horizontal = 3
	hb_bottom.add_child(_version_label)

func _make_menu_button(text: String, accent_color: Color) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(320, 52)
	b.add_theme_font_size_override("font_size", 18)
	b.add_theme_color_override("font_color", Color.WHITE)
	b.add_theme_color_override("font_hover_color", Color.WHITE)
	b.add_theme_color_override("font_pressed_color", Color(0.95, 0.95, 1.0))
	var sb_normal := StyleBoxFlat.new()
	sb_normal.bg_color = Color(accent_color.r * 0.6, accent_color.g * 0.6, accent_color.b * 0.6, 0.9)
	sb_normal.corner_radius_top_left = 10
	sb_normal.corner_radius_top_right = 10
	sb_normal.corner_radius_bottom_left = 10
	sb_normal.corner_radius_bottom_right = 10
	sb_normal.border_width_left = 2
	sb_normal.border_width_top = 2
	sb_normal.border_width_right = 2
	sb_normal.border_width_bottom = 2
	sb_normal.border_color = accent_color
	b.add_theme_stylebox_override("normal", sb_normal)
	var sb_hover := sb_normal.duplicate()
	sb_hover.bg_color = Color(accent_color.r * 0.8, accent_color.g * 0.8, accent_color.b * 0.8, 1.0)
	sb_hover.shadow_color = accent_color
	sb_hover.shadow_size = 6
	b.add_theme_stylebox_override("hover", sb_hover)
	var sb_pressed := sb_normal.duplicate()
	sb_pressed.bg_color = Color(accent_color.r * 0.5, accent_color.g * 0.5, accent_color.b * 0.5, 1.0)
	b.add_theme_stylebox_override("pressed", sb_pressed)
	var sb_disabled := sb_normal.duplicate()
	sb_disabled.bg_color = Color(0.4, 0.4, 0.45, 0.6)
	sb_disabled.border_color = Color(0.5, 0.5, 0.55)
	b.add_theme_stylebox_override("disabled", sb_disabled)
	b.size_flags_horizontal = 4
	b.mouse_entered.connect(func(): AudioManager.play_sfx("select"))
	return b

func _apply_theme() -> void:
	pass

func _connect_signals() -> void:
	_button_start.pressed.connect(_on_start_pressed)
	_button_tutorial.pressed.connect(_on_tutorial_pressed)
	_button_levels.pressed.connect(_on_levels_pressed)
	_button_settings.pressed.connect(_on_settings_pressed)
	_button_quit.pressed.connect(_on_quit_pressed)

func _on_start_pressed() -> void:
	AudioManager.play_sfx("click")
	var last_level := SaveSystem.get_last_level()
	if last_level == "" or not SaveSystem.is_level_unlocked(last_level):
		GameState.goto_battle("level_01_tutorial")
	else:
		GameState.goto_battle(last_level)

func _on_tutorial_pressed() -> void:
	GameState.goto_tutorial()

func _on_levels_pressed() -> void:
	GameState.goto_level_select()

func _on_settings_pressed() -> void:
	GameState.goto_settings()

func _on_quit_pressed() -> void:
	AudioManager.play_sfx("warn")
	get_tree().quit()
