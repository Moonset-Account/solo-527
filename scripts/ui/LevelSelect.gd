extends Control

class_name LevelSelect

func _ready():
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_ui()

func _build_ui():
	var dim = ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var panel = Panel.new()
	panel.name = "PanelContainer"
	panel.position = Vector2(340, 100)
	panel.size = Vector2(600, 520)
	panel.modulate = Color(0.08, 0.12, 0.18, 0.98)
	add_child(panel)
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(360, 120)
	vbox.custom_minimum_size = Vector2(560, 480)
	vbox.add_theme_constant_override("separation", 10)
	add_child(vbox)
	var title = Label.new()
	title.name = "TitleLabel"
	title.text = "📋 关卡选择"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	title.modulate = Color(0.5, 0.8, 1.0)
	vbox.add_child(title)
	var scroll = ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(560, 380)
	vbox.add_child(scroll)
	var inner = VBoxContainer.new()
	inner.name = "VBoxContainer"
	inner.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	inner.add_theme_constant_override("separation", 8)
	scroll.add_child(inner)
	add_to_group("level_select_inner")
	var close_btn = Button.new()
	close_btn.name = "CloseButton"
	close_btn.text = "❌ 返回"
	close_btn.custom_minimum_size = Vector2(560, 40)
	close_btn.add_theme_font_size_override("font_size", 14)
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.7, 0.3, 0.3)
	sb.corner_radius_top_left = 5
	sb.corner_radius_top_right = 5
	sb.corner_radius_bottom_left = 5
	sb.corner_radius_bottom_right = 5
	close_btn.add_theme_stylebox_override("normal", sb)
	vbox.add_child(close_btn)
	close_btn.pressed.connect(func():
		AudioManager.play_sfx("ui_click")
		queue_free())
	_build_level_list(inner)

func _build_level_list(container: VBoxContainer):
	for level_info in LevelConfig.get_all_levels_info():
		var hbox = HBoxContainer.new()
		hbox.custom_minimum_size = Vector2(540, 70)
		var level_btn = Button.new()
		level_btn.custom_minimum_size = Vector2(540, 65)
		var unlocked = level_info["unlocked"]
		var stars_str = ""
		for i in range(3):
			if i < level_info["progress"].get("stars", 0):
				stars_str += "★"
			else:
				stars_str += "☆"
		var diff_str = ""
		for i in range(level_info["difficulty_stars"]):
			diff_str += "●"
		var best_time_str = ""
		if level_info["best_time"] > 0:
			var m = int(level_info["best_time"]) / 60
			var s = int(level_info["best_time"]) % 60
			best_time_str = " | 最佳: %02d:%02d" % [m, s]
		level_btn.text = "关卡 %d - %s [%s]\n难度:%s  评价:%s%s" % [
			level_info["id"], level_info["name"], level_info["difficulty"],
			diff_str, stars_str, best_time_str
		]
		level_btn.disabled = not unlocked
		var normal_sb = StyleBoxFlat.new()
		normal_sb.bg_color = Color(0.25, 0.4, 0.6) if unlocked else Color(0.3, 0.3, 0.35)
		normal_sb.corner_radius_top_left = 5
		normal_sb.corner_radius_top_right = 5
		normal_sb.corner_radius_bottom_left = 5
		normal_sb.corner_radius_bottom_right = 5
		level_btn.add_theme_stylebox_override("normal", normal_sb)
		if not unlocked:
			level_btn.text += "\n🔒 完成上一关解锁"
		if unlocked:
			var lvl_id: int = level_info["id"]
			level_btn.pressed.connect(func(): _start_level(lvl_id))
		hbox.add_child(level_btn)
		container.add_child(hbox)

func _start_level(level_id: int):
	DebugLog.info("选择关卡 %d" % level_id)
	AudioManager.play_sfx("ui_click")
	var bootstrap = get_tree().get_first_node_in_group("main_bootstrap")
	if bootstrap and bootstrap.has_method("build_game_level"):
		bootstrap.build_game_level(level_id)
		queue_free()
