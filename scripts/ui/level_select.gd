extends Control
class_name LevelSelect

signal level_selected(level_id: String)
signal back_pressed

var grid_container: GridContainer

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	size = Vector2(1280, 720)

	var bg = ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.1, 0.1, 0.15)
	add_child(bg)

	var title = Label.new()
	title.set_anchors_preset(Control.PRESET_CENTER_TOP)
	title.position = Vector2(-100, 40)
	title.size = Vector2(200, 40)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.text = "选择关卡"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color.WHITE)
	add_child(title)

	grid_container = GridContainer.new()
	grid_container.set_anchors_preset(Control.PRESET_CENTER)
	grid_container.columns = 3
	grid_container.add_theme_constant_override("h_separation", 12)
	grid_container.add_theme_constant_override("v_separation", 12)
	grid_container.position = Vector2(-330, -150)
	grid_container.size = Vector2(660, 300)
	add_child(grid_container)

	_populate_levels()

	var back_btn = Button.new()
	back_btn.set_anchors_preset(Control.PRESET_BOTTOM_CENTER)
	back_btn.position = Vector2(-60, -40)
	back_btn.size = Vector2(120, 36)
	back_btn.text = "返回"
	back_btn.add_theme_font_size_override("font_size", 16)
	back_btn.pressed.connect(func(): back_pressed.emit())
	add_child(back_btn)

func _populate_levels() -> void:
	for child in grid_container.get_children():
		child.queue_free()

	var level_list: Array = LevelManager.get_level_list()

	if level_list.is_empty():
		for i in range(9):
			var lid = "level_%d" % (i + 1)
			_add_level_button(lid, "关卡 %d" % (i + 1))
	else:
		for level_info in level_list:
			var id = level_info.get("id", "")
			var name = level_info.get("name", id)
			_add_level_button(id, name)

func _add_level_button(level_id: String, display_name: String) -> void:
	var btn = Button.new()
	btn.text = display_name
	btn.custom_minimum_size = Vector2(200, 50)
	btn.add_theme_font_size_override("font_size", 14)
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
	btn.pressed.connect(func(): level_selected.emit(level_id))
	grid_container.add_child(btn)
