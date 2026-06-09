extends Control

class_name MainMenu

var start_btn: Button
var levels_btn: Button
var tutorial_btn: Button
var settings_btn: Button
var achievements_btn: Button
var daily_btn: Button
var quit_btn: Button
var title_label: Label
var version_label: Label

func _ready():
	_connect_buttons()
	title_label.text = "🤖 仓库潜行机器人" if title_label else ""
	version_label.text = "v1.0 Demo | Godot 4.x | 2026" if version_label else ""
	GameManager.state_changed.connect(_on_state_changed)

func _connect_buttons():
	if start_btn: start_btn.pressed.connect(_on_start_pressed)
	if levels_btn: levels_btn.pressed.connect(_on_levels_pressed)
	if tutorial_btn: tutorial_btn.pressed.connect(_on_tutorial_pressed)
	if settings_btn: settings_btn.pressed.connect(_on_settings_pressed)
	if achievements_btn: achievements_btn.pressed.connect(_on_achievements_pressed)
	if daily_btn: daily_btn.pressed.connect(_on_daily_pressed)
	if quit_btn: quit_btn.pressed.connect(_on_quit_pressed)

func _on_start_pressed():
	DebugLog.info("开始新游戏 - 关卡1")
	AudioManager.play_sfx("ui_click")
	var bootstrap = get_tree().get_first_node_in_group("main_bootstrap")
	if bootstrap and bootstrap.has_method("build_game_level"):
		bootstrap.build_game_level(1)

func _on_levels_pressed():
	var level_select = preload("res://scenes/ui/LevelSelect.tscn").instantiate()
	add_child(level_select)
	AudioManager.play_sfx("ui_click")

func _on_tutorial_pressed():
	var tutorial = preload("res://scenes/ui/Tutorial.tscn").instantiate()
	add_child(tutorial)
	AudioManager.play_sfx("ui_click")

func _on_settings_pressed():
	var settings = preload("res://scenes/ui/SettingsPanel.tscn").instantiate()
	add_child(settings)
	AudioManager.play_sfx("ui_click")

func _on_achievements_pressed():
	var ach = preload("res://scenes/ui/AchievementsPanel.tscn").instantiate()
	add_child(ach)
	AudioManager.play_sfx("ui_click")

func _on_daily_pressed():
	show_daily_challenge()
	AudioManager.play_sfx("ui_click")

func _on_quit_pressed():
	DebugLog.info("退出游戏")
	get_tree().quit()

func _on_state_changed(new_state, old_state):
	if new_state == GameManager.GameState.MENU:
		visible = true

func show_daily_challenge():
	var dim = ColorRect.new()
	dim.color = Color(0, 0, 0, 0.5)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var dialog = Panel.new()
	dialog.size = Vector2(500, 420)
	dialog.position = (get_viewport_rect().size - dialog.size) / 2
	dialog.modulate = Color(0.1, 0.14, 0.2, 0.98)
	add_child(dialog)
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(30, 30)
	vbox.custom_minimum_size = Vector2(440, 360)
	vbox.add_theme_constant_override("separation", 14)
	add_child(vbox)
	var title = Label.new()
	title.text = "🎯 每日挑战"
	title.add_theme_font_size_override("font_size", 26)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.modulate = Color(0.6, 0.9, 1.0)
	vbox.add_child(title)
	var best = SaveManager.check_daily_challenge()
	var info = Label.new()
	info.text = """
今日目标:
  ● 完成【关卡2 - B区货仓】
  ● 被发现不超过1次
  ● 用时少于90秒

奖励: 分数翻倍加成 + 特殊成就

今日最佳分数: %d 分
""" % best
	info.autowrap_mode = TextServer.AUTOWRAP_WORD
	info.add_theme_font_size_override("font_size", 14)
	info.custom_minimum_size = Vector2(440, 180)
	vbox.add_child(info)
	var start_btn_daily = Button.new()
	start_btn_daily.text = "🚀 开始挑战"
	start_btn_daily.custom_minimum_size = Vector2(440, 42)
	start_btn_daily.add_theme_font_size_override("font_size", 15)
	var sb1 = StyleBoxFlat.new()
	sb1.bg_color = Color(0.3, 0.7, 0.45)
	sb1.corner_radius_top_left = 6
	sb1.corner_radius_top_right = 6
	sb1.corner_radius_bottom_left = 6
	sb1.corner_radius_bottom_right = 6
	start_btn_daily.add_theme_stylebox_override("normal", sb1)
	start_btn_daily.pressed.connect(func():
		dim.queue_free()
		dialog.queue_free()
		vbox.queue_free()
		var bootstrap = get_tree().get_first_node_in_group("main_bootstrap")
		if bootstrap and bootstrap.has_method("build_game_level"):
			bootstrap.build_game_level(2)
	)
	vbox.add_child(start_btn_daily)
	var close_btn = Button.new()
	close_btn.text = "返回"
	close_btn.custom_minimum_size = Vector2(440, 42)
	close_btn.add_theme_font_size_override("font_size", 15)
	var sb2 = StyleBoxFlat.new()
	sb2.bg_color = Color(0.5, 0.5, 0.6)
	sb2.corner_radius_top_left = 6
	sb2.corner_radius_top_right = 6
	sb2.corner_radius_bottom_left = 6
	sb2.corner_radius_bottom_right = 6
	close_btn.add_theme_stylebox_override("normal", sb2)
	close_btn.pressed.connect(func():
		dim.queue_free()
		dialog.queue_free()
		vbox.queue_free())
	vbox.add_child(close_btn)
