extends Node2D

class_name MainBootstrap

var _current_scene_root: Node = null
var _level_manager: Node2D = null
var _player: CharacterBody2D = null
var _hud: CanvasLayer = null

func _ready():
	add_to_group("main_bootstrap")
	DisplayServer.window_set_title("仓库潜行机器人 - Stealth Warehouse Bot")
	_build_audio_buses()
	_build_main_menu()
	DebugLog.success("游戏启动完成！按ESC暂停，WASD移动，空格扫描，E交互")

func _build_audio_buses():
	var idx = AudioServer.get_bus_count()
	if idx < 3:
		AudioServer.add_bus()
		AudioServer.set_bus_name(idx, "SFX")
		AudioServer.add_bus()
		AudioServer.set_bus_name(idx + 1, "Music")
	DebugLog.debug("音频总线初始化完成: %d 条" % AudioServer.get_bus_count())

func _build_main_menu():
	_clear_scene_root()
	var menu = Control.new()
	menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	var menu_script = preload("res://scripts/ui/MainMenu.gd")
	menu.set_script(menu_script)
	_build_main_menu_ui(menu)
	_current_scene_root = menu
	add_child(menu)
	GameManager.return_to_menu()

func _build_main_menu_ui(menu: Control):
	var bg = ColorRect.new()
	bg.color = Color(0.04, 0.07, 0.11)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	menu.add_child(bg)
	var title = Label.new()
	title.text = "🤖 仓库潜行机器人"
	title.add_theme_font_size_override("font_size", 52)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.position = Vector2(0, 80)
	title.custom_minimum_size = Vector2(1280, 70)
	menu.add_child(title)
	var subtitle = Label.new()
	subtitle.text = "Stealth Warehouse Bot - 潜入、扫描、修复"
	subtitle.add_theme_font_size_override("font_size", 18)
	subtitle.modulate = Color(0.6, 0.8, 1.0)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.position = Vector2(0, 150)
	subtitle.custom_minimum_size = Vector2(1280, 30)
	menu.add_child(subtitle)
	var center_panel = Panel.new()
	center_panel.position = Vector2(440, 220)
	center_panel.size = Vector2(400, 440)
	center_panel.modulate = Color(0.1, 0.15, 0.22, 0.95)
	menu.add_child(center_panel)
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(460, 250)
	vbox.custom_minimum_size = Vector2(360, 380)
	vbox.add_theme_constant_override("separation", 14)
	menu.add_child(vbox)
	var ach_count = AchievementManager.get_unlocked_count()
	var btn_defs = [
		["start_btn", "🚀 开始游戏 (关卡1)", Color(0.3, 0.7, 0.4)],
		["levels_btn", "📋 关卡选择", Color(0.25, 0.55, 0.85)],
		["tutorial_btn", "📖 游戏教程", Color(0.8, 0.6, 0.25)],
		["settings_btn", "⚙️ 设置", Color(0.6, 0.45, 0.85)],
		["achievements_btn", "🏆 成就 (%d/10)" % ach_count, Color(0.9, 0.55, 0.2)],
		["daily_btn", "🎯 每日挑战", Color(0.2, 0.7, 0.7)],
		["quit_btn", "❌ 退出游戏", Color(0.85, 0.35, 0.35)]
	]
	for def in btn_defs:
		var btn = Button.new()
		btn.name = def[0]
		btn.text = def[1]
		btn.custom_minimum_size = Vector2(360, 45)
		btn.add_theme_font_size_override("font_size", 16)
		var style = StyleBoxFlat.new()
		style.bg_color = def[2]
		style.corner_radius_top_left = 6
		style.corner_radius_top_right = 6
		style.corner_radius_bottom_left = 6
		style.corner_radius_bottom_right = 6
		style.border_width_left = 2
		style.border_width_top = 2
		style.border_width_right = 2
		style.border_width_bottom = 2
		style.border_color = Color(1, 1, 1, 0.15)
		btn.add_theme_stylebox_override("normal", style)
		vbox.add_child(btn)
		menu.set(def[0], btn)
	var version = Label.new()
	version.text = "v1.0 Demo | Godot 4.x | 2026"
	version.add_theme_font_size_override("font_size", 12)
	version.modulate = Color(0.4, 0.5, 0.6)
	version.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	version.position = Vector2(0, 680)
	version.custom_minimum_size = Vector2(1280, 30)
	menu.add_child(version)
	menu.set("title_label", title)
	menu.set("version_label", version)

func build_game_level(level_id: int):
	_clear_scene_root()
	await get_tree().process_frame
	var level_root = Node2D.new()
	level_root.name = "GameLevel"
	_current_scene_root = level_root
	add_child(level_root)
	var camera = Camera2D.new()
	camera.position = Vector2(640, 360)
	camera.zoom = Vector2(1.0, 1.0)
	camera.make_current()
	level_root.add_child(camera)
	var bg = ColorRect.new()
	bg.color = Color(0.06, 0.09, 0.13)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	level_root.add_child(bg)
	var grid_bg = _build_grid_background()
	level_root.add_child(grid_bg)
	var walls = StaticBody2D.new()
	walls.name = "Walls"
	level_root.add_child(walls)
	var shelves = Node2D.new()
	shelves.name = "Shelves"
	level_root.add_child(shelves)
	var patrols = Node2D.new()
	patrols.name = "Patrols"
	level_root.add_child(patrols)
	var checkpoints = Node2D.new()
	checkpoints.name = "Checkpoints"
	level_root.add_child(checkpoints)
	_player = _build_player_robot(Vector2(120, 500))
	level_root.add_child(_player)
	var goal = _build_goal_zone(Vector2(1150, 120), 3, 1)
	level_root.add_child(goal)
	_level_manager = Node2D.new()
	var lm_script = preload("res://scripts/levels/LevelManager.gd")
	_level_manager.set_script(lm_script)
	_level_manager.player = _player
	_level_manager.goal = goal
	_level_manager.shelves_container = shelves
	_level_manager.patrols_container = patrols
	_level_manager.checkpoints_container = checkpoints
	_level_manager.walls_container = walls
	_level_manager.add_to_group("level_manager")
	level_root.add_child(_level_manager)
	_hud = _build_game_hud()
	_hud.visible = true
	add_child(_hud)
	_player.add_to_group("player")
	GameManager.state_changed.connect(_on_game_state_changed)
	_level_manager.call_deferred("load_level", level_id)

func _build_grid_background() -> Node:
	var grid = Node2D.new()
	grid.name = "GridBG"
	for x in range(0, 1281, 40):
		var line = Line2D.new()
		line.points = PackedVector2Array([Vector2(x, 0), Vector2(x, 720)])
		line.width = 1
		line.default_color = Color(0.12, 0.16, 0.22)
		grid.add_child(line)
	for y in range(0, 721, 40):
		var line = Line2D.new()
		line.points = PackedVector2Array([Vector2(0, y), Vector2(1280, y)])
		line.width = 1
		line.default_color = Color(0.12, 0.16, 0.22)
		grid.add_child(line)
	return grid

func _build_player_robot(spawn_pos: Vector2) -> CharacterBody2D:
	var p = CharacterBody2D.new()
	p.name = "PlayerRobot"
	p.position = spawn_pos
	p.set_script(preload("res://scripts/player/PlayerRobot.gd"))
	var collision = CollisionShape2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 16
	collision.shape = circle
	p.add_child(collision)
	var sprite = AnimatedSprite2D.new()
	sprite.name = "AnimatedSprite2D"
	var frames = SpriteFrames.new()
	for anim in ["idle", "walk", "crouch_idle", "crouch_walk", "sprint", "scan"]:
		frames.add_animation(anim)
		var tex = _create_player_texture(anim)
		frames.add_frame(anim, tex)
	sprite.sprite_frames = frames
	sprite.scale = Vector2(1.5, 1.5)
	p.add_child(sprite)
	var scan_area = Area2D.new()
	scan_area.name = "ScanArea"
	var scan_collision = CollisionShape2D.new()
	var scan_shape = CircleShape2D.new()
	scan_shape.radius = 120
	scan_collision.shape = scan_shape
	scan_area.add_child(scan_collision)
	p.add_child(scan_area)
	var scan_visual = ColorRect.new()
	scan_visual.name = "ScanVisual"
	scan_visual.color = Color(0.3, 0.8, 1.0, 0.08)
	scan_visual.size = Vector2(240, 240)
	scan_visual.position = Vector2(-120, -120)
	p.add_child(scan_visual)
	var noise_ind = ColorRect.new()
	noise_ind.name = "NoiseIndicator"
	noise_ind.size = Vector2(36, 36)
	noise_ind.position = Vector2(-18, -18)
	noise_ind.color = Color(0, 1, 0, 0)
	p.add_child(noise_ind)
	var scan_progress = ProgressBar.new()
	scan_progress.name = "ScanProgress"
	scan_progress.size = Vector2(60, 8)
	scan_progress.position = Vector2(-30, -35)
	scan_progress.max_value = 100
	scan_progress.value = 0
	scan_progress.visible = false
	p.add_child(scan_progress)
	return p

func _create_player_texture(anim: String) -> ImageTexture:
	var img = Image.create(32, 32, false, Image.FORMAT_RGBA8)
	var body_color = Color(0.3, 0.75, 0.95)
	var eye_color = Color(1.0, 0.95, 0.2)
	if anim.begins_with("crouch"):
		body_color = Color(0.25, 0.6, 0.8)
	if anim == "sprint":
		body_color = Color(0.5, 0.85, 1.0)
	for y in range(32):
		for x in range(32):
			var dx = x - 16
			var dy = y - 18
			if dx * dx + dy * dy <= 121:
				img.set_pixel(x, y, body_color)
			elif y >= 8 and y <= 16 and x >= 10 and x <= 22:
				img.set_pixel(x, y, body_color)
	for y in range(14, 18):
		for x in range(11, 21):
			img.set_pixel(x, y, eye_color)
	if anim == "scan":
		for y in range(12, 20):
			for x in range(9, 23):
				var dist = abs(x - 16) + abs(y - 16)
				if dist <= 4:
					img.set_pixel(x, y, Color(1.0, 0.6, 0.8))
	return ImageTexture.create_from_image(img)

func _build_goal_zone(pos: Vector2, scans: int, fixes: int) -> Area2D:
	var goal = Area2D.new()
	goal.name = "GoalZone"
	goal.position = pos
	goal.set_script(preload("res://scripts/interactables/GoalZone.gd"))
	var collision = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(100, 100)
	collision.shape = rect
	goal.add_child(collision)
	var visual = ColorRect.new()
	visual.name = "Visual"
	visual.size = Vector2(100, 100)
	visual.position = Vector2(-50, -50)
	visual.color = Color(1.0, 0.7, 0.1, 0.3)
	goal.add_child(visual)
	var label = Label.new()
	label.name = "Label"
	label.text = "出口"
	label.custom_minimum_size = Vector2(100, 80)
	label.position = Vector2(-50, -40)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 12)
	goal.add_child(label)
	var locked = ColorRect.new()
	locked.name = "LockedMarker"
	locked.size = Vector2(100, 100)
	locked.position = Vector2(-50, -50)
	locked.color = Color(1, 0, 0, 0.5)
	goal.add_child(locked)
	goal.set("required_scans", scans)
	goal.set("required_fixes", fixes)
	return goal

func _build_game_hud() -> CanvasLayer:
	var hud = CanvasLayer.new()
	hud.set_script(preload("res://scripts/ui/GameHUD.gd"))
	var top_panel = Panel.new()
	top_panel.name = "TopPanel"
	top_panel.position = Vector2(10, 10)
	top_panel.size = Vector2(1260, 70)
	top_panel.modulate = Color(0.05, 0.08, 0.12, 0.9)
	hud.add_child(top_panel)
	var energy_bar = ProgressBar.new()
	energy_bar.name = "EnergyBar"
	energy_bar.position = Vector2(20, 20)
	energy_bar.size = Vector2(250, 30)
	energy_bar.max_value = 100
	energy_bar.value = 100
	energy_bar.add_theme_color_override("foreground_color", Color(0.3, 0.8, 0.4))
	top_panel.add_child(energy_bar)
	var energy_lbl = Label.new()
	energy_lbl.name = "EnergyLabel"
	energy_lbl.text = "能量: 100%"
	energy_lbl.position = Vector2(20, 25)
	energy_lbl.custom_minimum_size = Vector2(250, 20)
	energy_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top_panel.add_child(energy_lbl)
	var time_lbl = Label.new()
	time_lbl.name = "TimeLabel"
	time_lbl.text = "时间: 00:00"
	time_lbl.position = Vector2(300, 25)
	time_lbl.custom_minimum_size = Vector2(120, 20)
	time_lbl.add_theme_font_size_override("font_size", 14)
	top_panel.add_child(time_lbl)
	var level_lbl = Label.new()
	level_lbl.name = "LevelNameLabel"
	level_lbl.text = "关卡"
	level_lbl.position = Vector2(440, 25)
	level_lbl.custom_minimum_size = Vector2(300, 20)
	level_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_lbl.add_theme_font_size_override("font_size", 14)
	top_panel.add_child(level_lbl)
	var obj_lbl = Label.new()
	obj_lbl.name = "ObjectivesLabel"
	obj_lbl.text = "扫描: 0/0  修复: 0/0"
	obj_lbl.position = Vector2(760, 25)
	obj_lbl.custom_minimum_size = Vector2(280, 20)
	obj_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	obj_lbl.add_theme_font_size_override("font_size", 14)
	top_panel.add_child(obj_lbl)
	var detect_lbl = Label.new()
	detect_lbl.name = "DetectLabel"
	detect_lbl.text = "被发现: 0"
	detect_lbl.position = Vector2(1080, 25)
	detect_lbl.custom_minimum_size = Vector2(150, 20)
	detect_lbl.modulate = Color(1, 0.7, 0.5)
	detect_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	detect_lbl.add_theme_font_size_override("font_size", 14)
	top_panel.add_child(detect_lbl)
	var bottom_panel = Panel.new()
	bottom_panel.name = "BottomPanel"
	bottom_panel.position = Vector2(10, 640)
	bottom_panel.size = Vector2(1260, 70)
	bottom_panel.modulate = Color(0.05, 0.08, 0.12, 0.9)
	hud.add_child(bottom_panel)
	var noise_bar = ProgressBar.new()
	noise_bar.name = "NoiseBar"
	noise_bar.position = Vector2(20, 20)
	noise_bar.size = Vector2(250, 30)
	noise_bar.max_value = 100
	noise_bar.value = 0
	noise_bar.add_theme_color_override("foreground_color", Color(0.95, 0.6, 0.3))
	bottom_panel.add_child(noise_bar)
	var noise_lbl = Label.new()
	noise_lbl.text = "噪音"
	noise_lbl.position = Vector2(20, 25)
	noise_lbl.custom_minimum_size = Vector2(250, 20)
	noise_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bottom_panel.add_child(noise_lbl)
	var ctrl_lbl = Label.new()
	ctrl_lbl.name = "ControlsLabel"
	ctrl_lbl.text = "[WASD]移动 | [空格]扫描 | [E]交互 | [Shift]冲刺 | [Ctrl]蹲伏 | [Esc]暂停 | [F1]调试日志"
	ctrl_lbl.position = Vector2(300, 25)
	ctrl_lbl.custom_minimum_size = Vector2(930, 30)
	ctrl_lbl.add_theme_font_size_override("font_size", 13)
	bottom_panel.add_child(ctrl_lbl)
	var center_msg = Label.new()
	center_msg.name = "CenterMessage"
	center_msg.text = ""
	center_msg.position = Vector2(0, 300)
	center_msg.custom_minimum_size = Vector2(1280, 60)
	center_msg.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center_msg.add_theme_font_size_override("font_size", 36)
	center_msg.modulate = Color(1, 1, 0.5, 1)
	center_msg.visible = false
	hud.add_child(center_msg)
	var ach_panel = PanelContainer.new()
	ach_panel.name = "AchievementPopup"
	ach_panel.position = Vector2(900, 100)
	ach_panel.size = Vector2(360, 90)
	ach_panel.modulate = Color(0.1, 0.15, 0.25, 0.98)
	ach_panel.visible = false
	hud.add_child(ach_panel)
	var ach_vbox = VBoxContainer.new()
	ach_vbox.custom_minimum_size = Vector2(340, 70)
	ach_panel.add_child(ach_vbox)
	var ach_name = Label.new()
	ach_name.name = "AchievementName"
	ach_name.text = ""
	ach_name.add_theme_font_size_override("font_size", 18)
	ach_name.modulate = Color(1.0, 0.9, 0.4)
	ach_vbox.add_child(ach_name)
	var ach_desc = Label.new()
	ach_desc.name = "AchievementDesc"
	ach_desc.text = ""
	ach_desc.add_theme_font_size_override("font_size", 12)
	ach_desc.modulate = Color(0.85, 0.85, 0.85)
	ach_vbox.add_child(ach_desc)
	var debug_panel = PanelContainer.new()
	debug_panel.name = "DebugLogPanel"
	debug_panel.position = Vector2(10, 90)
	debug_panel.size = Vector2(420, 520)
	debug_panel.modulate = Color(0.02, 0.04, 0.08, 0.93)
	hud.add_child(debug_panel)
	var scroll = ScrollContainer.new()
	scroll.name = "ScrollContainer"
	scroll.custom_minimum_size = Vector2(400, 500)
	debug_panel.add_child(scroll)
	var debug_vbox = VBoxContainer.new()
	debug_vbox.name = "VBoxContainer"
	debug_vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.add_child(debug_vbox)
	return hud

func _on_game_state_changed(new_state: int, old_state: int):
	match new_state:
		GameManager.GameState.PAUSED:
			_show_pause_menu()
		GameManager.GameState.LEVEL_COMPLETE:
			_show_level_complete()
		GameManager.GameState.MENU:
			_build_main_menu()

func _show_pause_menu():
	var pm = Control.new()
	pm.set_anchors_preset(Control.PRESET_FULL_RECT)
	var dim = ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	pm.add_child(dim)
	var panel = Panel.new()
	panel.position = Vector2(440, 200)
	panel.size = Vector2(400, 380)
	panel.modulate = Color(0.1, 0.14, 0.2, 0.98)
	pm.add_child(panel)
	var title = Label.new()
	title.name = "TitleLabel"
	title.text = "⏸ 游戏暂停"
	title.position = Vector2(440, 220)
	title.custom_minimum_size = Vector2(400, 40)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 26)
	pm.add_child(title)
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(480, 280)
	vbox.custom_minimum_size = Vector2(320, 280)
	vbox.add_theme_constant_override("separation", 12)
	pm.add_child(vbox)
	var defs = [
		["resume_btn", "▶ 继续游戏", Color(0.3, 0.7, 0.45)],
		["retry_btn", "🔄 重玩本关", Color(0.8, 0.6, 0.25)],
		["settings_btn", "⚙️ 设置", Color(0.6, 0.45, 0.8)],
		["level_select_btn", "📋 关卡选择", Color(0.25, 0.55, 0.85)],
		["quit_btn", "🏠 返回主菜单", Color(0.85, 0.35, 0.35)]
	]
	for def in defs:
		var btn = Button.new()
		btn.name = def[0]
		btn.text = def[1]
		btn.custom_minimum_size = Vector2(320, 42)
		btn.add_theme_font_size_override("font_size", 15)
		var sb = StyleBoxFlat.new()
		sb.bg_color = def[2]
		sb.corner_radius_top_left = 5
		sb.corner_radius_top_right = 5
		sb.corner_radius_bottom_left = 5
		sb.corner_radius_bottom_right = 5
		btn.add_theme_stylebox_override("normal", sb)
		vbox.add_child(btn)
	pm.set_script(preload("res://scripts/ui/PauseMenu.gd"))
	pm.resume_btn = vbox.get_node("resume_btn")
	pm.retry_btn = vbox.get_node("retry_btn")
	pm.settings_btn = vbox.get_node("settings_btn")
	pm.level_select_btn = vbox.get_node("level_select_btn")
	pm.quit_btn = vbox.get_node("quit_btn")
	pm.title = title
	pm.process_mode = Node.PROCESS_MODE_ALWAYS
	pm.initialize()
	if _current_scene_root and is_instance_valid(_current_scene_root):
		_current_scene_root.add_child(pm)
	DebugLog.debug("暂停菜单已打开")

func _show_level_complete():
	var pm = Control.new()
	pm.set_anchors_preset(Control.PRESET_FULL_RECT)
	pm.process_mode = Node.PROCESS_MODE_ALWAYS
	var dim = ColorRect.new()
	dim.color = Color(0, 0, 0, 0.75)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	pm.add_child(dim)
	var panel = Panel.new()
	panel.position = Vector2(380, 100)
	panel.size = Vector2(520, 520)
	panel.modulate = Color(0.08, 0.12, 0.18, 0.98)
	pm.add_child(panel)
	var title = Label.new()
	title.name = "TitleLabel"
	title.text = "🎉 关卡完成！"
	title.position = Vector2(380, 120)
	title.custom_minimum_size = Vector2(520, 50)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	title.modulate = Color(0.5, 1.0, 0.6)
	pm.add_child(title)
	var stars = Label.new()
	stars.name = "StarsLabel"
	stars.text = "★★★"
	stars.position = Vector2(380, 180)
	stars.custom_minimum_size = Vector2(520, 45)
	stars.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stars.add_theme_font_size_override("font_size", 42)
	pm.add_child(stars)
	var stats = RichTextLabel.new()
	stats.name = "StatsLabel"
	stats.position = Vector2(410, 240)
	stats.custom_minimum_size = Vector2(460, 200)
	stats.bbcode_enabled = true
	stats.add_theme_font_size_override("normal_font_size", 14)
	pm.add_child(stats)
	var score = Label.new()
	score.name = "ScoreLabel"
	score.text = "总分: 0"
	score.position = Vector2(380, 445)
	score.custom_minimum_size = Vector2(520, 35)
	score.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	score.add_theme_font_size_override("font_size", 22)
	score.modulate = Color(1.0, 0.9, 0.3)
	pm.add_child(score)
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(430, 495)
	vbox.custom_minimum_size = Vector2(420, 110)
	vbox.add_theme_constant_override("separation", 8)
	pm.add_child(vbox)
	var btn_defs = [
		["next_btn", "➡ 下一关", Color(0.3, 0.7, 0.45)],
		["retry_btn", "🔄 重玩本关", Color(0.8, 0.6, 0.25)],
		["levels_btn", "📋 关卡选择", Color(0.25, 0.55, 0.85)],
		["menu_btn", "🏠 返回主菜单", Color(0.6, 0.45, 0.8)]
	]
	for def in btn_defs:
		var btn = Button.new()
		btn.name = def[0]
		btn.text = def[1]
		btn.custom_minimum_size = Vector2(420, 35)
		btn.add_theme_font_size_override("font_size", 14)
		var sb = StyleBoxFlat.new()
		sb.bg_color = def[2]
		sb.corner_radius_top_left = 5
		sb.corner_radius_top_right = 5
		sb.corner_radius_bottom_left = 5
		sb.corner_radius_bottom_right = 5
		btn.add_theme_stylebox_override("normal", sb)
		vbox.add_child(btn)
	pm.set_script(preload("res://scripts/ui/LevelCompletePanel.gd"))
	pm.next_btn = vbox.get_node("next_btn")
	pm.retry_btn = vbox.get_node("retry_btn")
	pm.levels_btn = vbox.get_node("levels_btn")
	pm.menu_btn = vbox.get_node("menu_btn")
	pm.title = title
	pm.stars_label = stars
	pm.stats_label = stats
	pm.score_label = score
	pm.process_mode = Node.PROCESS_MODE_ALWAYS
	if _current_scene_root and is_instance_valid(_current_scene_root):
		_current_scene_root.add_child(pm)
	pm.initialize()
	DebugLog.debug("结算面板已显示")

func _clear_scene_root():
	if GameManager and GameManager.is_connected("state_changed", Callable(self, "_on_game_state_changed")):
		GameManager.state_changed.disconnect(Callable(self, "_on_game_state_changed"))
	if _level_manager and is_instance_valid(_level_manager):
		_level_manager.queue_free()
	_level_manager = null
	_player = null
	if _hud and is_instance_valid(_hud):
		_hud.queue_free()
	_hud = null
	if _current_scene_root and is_instance_valid(_current_scene_root):
		_current_scene_root.queue_free()
	_current_scene_root = null
	get_tree().paused = false

func _unhandled_input(event):
	if event.is_action_pressed("pause") and GameManager and GameManager.current_state == GameManager.GameState.PLAYING:
		GameManager.pause_game()
	if event is InputEventKey and event.pressed and not event.is_echo() and event.keycode == KEY_F1:
		if _hud and _hud.has_method("toggle_debug_log"):
			_hud.toggle_debug_log()
