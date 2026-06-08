extends Control
class_name PauseMenu

signal resume
signal restart_segment
signal restart_level
signal open_settings
signal back_to_menu

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	size = Vector2(1280, 720)
	visible = false

	var overlay = ColorRect.new()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.color = Color(0, 0, 0, 0.5)
	add_child(overlay)

	var vbox = VBoxContainer.new()
	vbox.set_anchors_preset(Control.PRESET_CENTER)
	vbox.position = Vector2(-100, -130)
	vbox.size = Vector2(200, 260)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", 10)

	var title = Label.new()
	title.text = "暂停"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color.WHITE)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var button_data = [
		["继续", resume],
		["重新开始段", restart_segment],
		["重新开始关", restart_level],
		["设置", open_settings],
		["返回主菜单", back_to_menu],
	]

	for data in button_data:
		var btn = Button.new()
		btn.text = data[0]
		btn.custom_minimum_size = Vector2(200, 36)
		btn.add_theme_font_size_override("font_size", 16)
		btn.add_theme_color_override("font_color", Color.WHITE)
		var normal_style = StyleBoxFlat.new()
		normal_style.bg_color = Color(0.2, 0.2, 0.25)
		normal_style.corner_radius_top_left = 5
		normal_style.corner_radius_top_right = 5
		normal_style.corner_radius_bottom_left = 5
		normal_style.corner_radius_bottom_right = 5
		btn.add_theme_stylebox_override("normal", normal_style)
		var hover_style = StyleBoxFlat.new()
		hover_style.bg_color = Color(0.3, 0.3, 0.4)
		hover_style.corner_radius_top_left = 5
		hover_style.corner_radius_top_right = 5
		hover_style.corner_radius_bottom_left = 5
		hover_style.corner_radius_bottom_right = 5
		btn.add_theme_stylebox_override("hover", hover_style)
		btn.pressed.connect(data[1].emit)
		vbox.add_child(btn)

	add_child(vbox)

func show_menu() -> void:
	visible = true
	get_tree().paused = true

func hide_menu() -> void:
	visible = false
	get_tree().paused = false
