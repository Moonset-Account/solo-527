extends Control
class_name MainMenu

signal start_game
signal select_level
signal open_editor
signal open_settings
signal quit_game

var _buttons: Array[Button] = []

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	size = Vector2(1280, 720)

	var bg = ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.1, 0.1, 0.15)
	add_child(bg)

	var title = Label.new()
	title.set_anchors_preset(Control.PRESET_CENTER_TOP)
	title.position = Vector2(-200, 80)
	title.size = Vector2(400, 60)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.text = "仓库潜行机器人"
	title.add_theme_font_size_override("font_size", 48)
	title.add_theme_color_override("font_color", Color.WHITE)
	add_child(title)

	var subtitle = Label.new()
	subtitle.set_anchors_preset(Control.PRESET_CENTER_TOP)
	subtitle.position = Vector2(-200, 145)
	subtitle.size = Vector2(400, 30)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.text = "Warehouse Stealth Robot"
	subtitle.add_theme_font_size_override("font_size", 20)
	subtitle.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	add_child(subtitle)

	var button_texts = ["开始游戏", "选择关卡", "关卡编辑器", "设置", "退出"]
	var button_signals = [start_game, select_level, open_editor, open_settings, quit_game]

	var vbox = VBoxContainer.new()
	vbox.set_anchors_preset(Control.PRESET_CENTER)
	vbox.position = Vector2(-100, -120)
	vbox.size = Vector2(200, 240)
	vbox.add_theme_constant_override("separation", 8)

	for i in button_texts.size():
		var btn = Button.new()
		btn.text = button_texts[i]
		btn.custom_minimum_size = Vector2(200, 40)
		btn.add_theme_font_size_override("font_size", 16)
		btn.add_theme_color_override("font_color", Color.WHITE)
		btn.add_theme_color_override("font_hover_color", Color.CYAN)
		var normal_style = StyleBoxFlat.new()
		normal_style.bg_color = Color(0.2, 0.2, 0.25)
		normal_style.corner_radius_top_left = 5
		normal_style.corner_radius_top_right = 5
		normal_style.corner_radius_bottom_left = 5
		normal_style.corner_radius_bottom_right = 5
		normal_style.content_margin_top = 8
		normal_style.content_margin_bottom = 8
		btn.add_theme_stylebox_override("normal", normal_style)
		var hover_style = StyleBoxFlat.new()
		hover_style.bg_color = Color(0.3, 0.3, 0.4)
		hover_style.corner_radius_top_left = 5
		hover_style.corner_radius_top_right = 5
		hover_style.corner_radius_bottom_left = 5
		hover_style.corner_radius_bottom_right = 5
		hover_style.content_margin_top = 8
		hover_style.content_margin_bottom = 8
		btn.add_theme_stylebox_override("hover", hover_style)
		btn.mouse_entered.connect(_on_button_hover.bind(btn))
		btn.mouse_exited.connect(_on_button_hover_exit.bind(btn))
		btn.pressed.connect(button_signals[i].emit)
		vbox.add_child(btn)
		_buttons.append(btn)

	add_child(vbox)

func _on_button_hover(btn: Button) -> void:
	btn.add_theme_color_override("font_color", Color.CYAN)

func _on_button_hover_exit(btn: Button) -> void:
	btn.add_theme_color_override("font_color", Color.WHITE)
