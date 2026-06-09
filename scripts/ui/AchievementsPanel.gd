extends Control

class_name AchievementsPanel

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
	panel.position = Vector2(300, 60)
	panel.size = Vector2(680, 600)
	panel.modulate = Color(0.07, 0.1, 0.16, 0.98)
	add_child(panel)
	var vbox = VBoxContainer.new()
	vbox.position = Vector2(320, 80)
	vbox.custom_minimum_size = Vector2(640, 560)
	vbox.add_theme_constant_override("separation", 10)
	add_child(vbox)
	var title = Label.new()
	title.name = "TitleLabel"
	title.text = "🏆 成就系统"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	title.modulate = Color(1.0, 0.8, 0.4)
	vbox.add_child(title)
	var unlocked = AchievementManager.get_unlocked_count()
	var total = AchievementManager.ACHIEVEMENTS.size()
	var progress = Label.new()
	progress.name = "ProgressLabel"
	progress.text = "进度: %d / %d  (%d%%)" % [unlocked, total, int(unlocked * 100.0 / max(1, total))]
	progress.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	progress.add_theme_font_size_override("font_size", 16)
	progress.modulate = Color(0.6, 0.85, 1.0)
	vbox.add_child(progress)
	var prog_bar = ProgressBar.new()
	prog_bar.custom_minimum_size = Vector2(640, 20)
	prog_bar.max_value = total
	prog_bar.value = unlocked
	prog_bar.add_theme_color_override("foreground_color", Color(1.0, 0.75, 0.3))
	vbox.add_child(prog_bar)
	var scroll = ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(640, 400)
	vbox.add_child(scroll)
	var container = VBoxContainer.new()
	container.name = "VBoxContainer"
	container.custom_minimum_size = Vector2(620, 380)
	container.add_theme_constant_override("separation", 6)
	scroll.add_child(container)
	_build_achievements_list(container)
	var close_btn = Button.new()
	close_btn.name = "CloseButton"
	close_btn.text = "❌ 返回"
	close_btn.custom_minimum_size = Vector2(640, 40)
	close_btn.add_theme_font_size_override("font_size", 15)
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

func _build_achievements_list(container: VBoxContainer):
	var achievements = AchievementManager.ACHIEVEMENTS
	var sorted_keys: Array = achievements.keys()
	sorted_keys.sort()
	for id in sorted_keys:
		var data = achievements[id]
		var is_unlocked = AchievementManager.is_unlocked(id)
		var hbox = HBoxContainer.new()
		hbox.custom_minimum_size = Vector2(620, 58)
		hbox.add_theme_constant_override("separation", 12)
		var hb_bg = StyleBoxFlat.new()
		hb_bg.bg_color = Color(0.12, 0.16, 0.24, 0.9) if not is_unlocked else Color(0.15, 0.25, 0.2, 0.9)
		hb_bg.corner_radius_top_left = 4
		hb_bg.corner_radius_top_right = 4
		hb_bg.corner_radius_bottom_left = 4
		hb_bg.corner_radius_bottom_right = 4
		var panel_wrap = PanelContainer.new()
		panel_wrap.add_theme_stylebox_override("panel", hb_bg)
		hbox.add_theme_stylebox_override("panel", hb_bg)
		var icon_lbl = Label.new()
		icon_lbl.text = data["icon"]
		icon_lbl.custom_minimum_size = Vector2(55, 58)
		icon_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		icon_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		icon_lbl.add_theme_font_size_override("font_size", 28)
		if not is_unlocked:
			icon_lbl.modulate = Color(0.5, 0.5, 0.5)
		hbox.add_child(icon_lbl)
		var inner_vb = VBoxContainer.new()
		inner_vb.custom_minimum_size = Vector2(430, 58)
		inner_vb.add_theme_constant_override("separation", 2)
		var name_lbl = Label.new()
		name_lbl.text = data["name"]
		name_lbl.custom_minimum_size = Vector2(430, 28)
		name_lbl.add_theme_font_size_override("font_size", 16)
		if not is_unlocked:
			name_lbl.modulate = Color(0.6, 0.6, 0.6)
		inner_vb.add_child(name_lbl)
		var desc_lbl = Label.new()
		desc_lbl.text = data["description"]
		desc_lbl.custom_minimum_size = Vector2(430, 25)
		desc_lbl.add_theme_font_size_override("font_size", 12)
		desc_lbl.modulate = Color(0.7, 0.7, 0.75)
		inner_vb.add_child(desc_lbl)
		hbox.add_child(inner_vb)
		var status_lbl = Label.new()
		if is_unlocked:
			status_lbl.text = "✓ 已解锁"
			status_lbl.modulate = Color(0.4, 1.0, 0.5)
		else:
			status_lbl.text = "🔒 未解锁"
			status_lbl.modulate = Color(0.55, 0.55, 0.6)
		status_lbl.custom_minimum_size = Vector2(100, 58)
		status_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		status_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		status_lbl.add_theme_font_size_override("font_size", 13)
		hbox.add_child(status_lbl)
		container.add_child(hbox)
