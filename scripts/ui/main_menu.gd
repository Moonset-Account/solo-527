class_name MainMenu
extends Control

signal new_game_pressed
signal load_game_pressed
signal replay_pressed
signal quit_pressed

func _ready() -> void:
	_build_ui()

func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)

	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.offset_left = -150
	panel.offset_top = -120
	panel.offset_right = 150
	panel.offset_bottom = 120
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "深海灯塔守夜"
	title.add_theme_font_size_override("font_size", 28)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Deep Sea Lighthouse"
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.modulate = Color.GRAY
	vbox.add_child(subtitle)

	var spacer := Control.new()
	spacer.custom_minimum_size.y = 20
	vbox.add_child(spacer)

	var new_btn := Button.new()
	new_btn.text = "新游戏"
	new_btn.custom_minimum_size = Vector2(200, 40)
	new_btn.pressed.connect(func(): new_game_pressed.emit())
	vbox.add_child(new_btn)

	var load_btn := Button.new()
	load_btn.text = "继续游戏"
	load_btn.custom_minimum_size = Vector2(200, 40)
	load_btn.pressed.connect(func(): load_game_pressed.emit())
	vbox.add_child(load_btn)

	var replay_btn := Button.new()
	replay_btn.text = "复盘记录"
	replay_btn.custom_minimum_size = Vector2(200, 40)
	replay_btn.pressed.connect(func(): replay_pressed.emit())
	vbox.add_child(replay_btn)

	var quit_btn := Button.new()
	quit_btn.text = "退出"
	quit_btn.custom_minimum_size = Vector2(200, 40)
	quit_btn.pressed.connect(func(): quit_pressed.emit())
	vbox.add_child(quit_btn)
