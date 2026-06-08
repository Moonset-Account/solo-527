extends Control
class_name LevelEditor

enum ToolType { SHELF, GUARD, WALL, CHECKPOINT, PLAYER_START }

var current_tool: ToolType = ToolType.SHELF
var level_data: Dictionary = {}
var objects: Array[Dictionary] = []
var selected_object_index: int = -1
var dragging: bool = false
var drag_offset: Vector2 = Vector2.ZERO

var left_panel: VBoxContainer
var center_area: Control
var right_panel: VBoxContainer
var bottom_bar: HBoxContainer
var grid_canvas: Control
var object_canvas: Control
var property_container: VBoxContainer

var tool_buttons: Dictionary = {}

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	size = Vector2(1280, 720)

	level_data = {"objects": objects}

	var bg = ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.12, 0.12, 0.12)
	add_child(bg)

	_build_left_panel()
	_build_center_area()
	_build_right_panel()
	_build_bottom_bar()

func _build_left_panel() -> void:
	left_panel = VBoxContainer.new()
	left_panel.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	left_panel.offset_left = 0
	left_panel.offset_right = 250
	left_panel.add_theme_constant_override("separation", 6)

	var panel_bg = StyleBoxFlat.new()
	panel_bg.bg_color = Color(0.15, 0.15, 0.18)
	panel_bg.border_color = Color(0.3, 0.3, 0.35)
	panel_bg.border_width_right = 1

	var title = Label.new()
	title.text = "工具"
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color.WHITE)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	left_panel.add_child(title)

	var tools = [
		[ToolType.SHELF, "Shelf"],
		[ToolType.GUARD, "Guard"],
		[ToolType.WALL, "Wall"],
		[ToolType.CHECKPOINT, "Checkpoint"],
		[ToolType.PLAYER_START, "Player Start"],
	]

	for tool_info in tools:
		var btn = Button.new()
		btn.text = tool_info[1]
		btn.custom_minimum_size = Vector2(220, 36)
		btn.add_theme_font_size_override("font_size", 14)
		btn.toggle_mode = true
		var t: ToolType = tool_info[0]
		btn.pressed.connect(_select_tool.bind(t))
		tool_buttons[t] = btn
		left_panel.add_child(btn)

	tool_buttons[ToolType.SHELF].button_pressed = true
	add_child(left_panel)

func _build_center_area() -> void:
	var center_container = Control.new()
	center_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	center_container.offset_left = 250
	center_container.offset_right = -250
	center_container.offset_bottom = -50
	add_child(center_container)

	grid_canvas = Control.new()
	grid_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	grid_canvas.draw.connect(_draw_grid)
	center_container.add_child(grid_canvas)

	object_canvas = Control.new()
	object_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	object_canvas.draw.connect(_draw_objects)
	center_container.add_child(object_canvas)

	center_area = center_container
	center_area.gui_input.connect(_on_center_input)

func _build_right_panel() -> void:
	right_panel = VBoxContainer.new()
	right_panel.set_anchors_preset(Control.PRESET_RIGHT_WIDE)
	right_panel.offset_left = -250
	right_panel.offset_right = 0
	right_panel.add_theme_constant_override("separation", 6)

	var title = Label.new()
	title.text = "属性"
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color.WHITE)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	right_panel.add_child(title)

	property_container = VBoxContainer.new()
	property_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	property_container.offset_top = 30
	property_container.offset_bottom = -10
	property_container.add_theme_constant_override("separation", 4)
	right_panel.add_child(property_container)

	add_child(right_panel)

func _build_bottom_bar() -> void:
	bottom_bar = HBoxContainer.new()
	bottom_bar.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	bottom_bar.offset_top = -50
	bottom_bar.offset_left = 250
	bottom_bar.offset_right = -250
	bottom_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	bottom_bar.add_theme_constant_override("separation", 20)

	var actions = [
		["保存关卡", _on_save],
		["测试关卡", _on_test],
		["清空", _on_clear],
		["返回", _on_back],
	]

	for action in actions:
		var btn = Button.new()
		btn.text = action[0]
		btn.custom_minimum_size = Vector2(120, 36)
		btn.add_theme_font_size_override("font_size", 14)
		btn.pressed.connect(action[1])
		bottom_bar.add_child(btn)

	add_child(bottom_bar)

func _select_tool(tool: ToolType) -> void:
	current_tool = tool
	for key in tool_buttons:
		tool_buttons[key].button_pressed = (key == tool)

func _snap_to_grid(pos: Vector2) -> Vector2:
	return Vector2(snappedf(pos.x, 32), snappedf(pos.y, 32))

func _on_center_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb: InputEventMouseButton = event
		var local_pos = mb.position
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			var snapped = _snap_to_grid(local_pos)
			var obj = {
				"type": ToolType.keys()[current_tool],
				"position": {"x": snapped.x, "y": snapped.y},
			}
			match current_tool:
				ToolType.SHELF:
					obj["labels"] = []
				ToolType.GUARD:
					obj["patrol_points"] = []
				ToolType.WALL:
					obj["size"] = {"x": 64, "y": 64}
				ToolType.CHECKPOINT:
					obj["id"] = ""
				ToolType.PLAYER_START:
					obj["direction"] = "right"
			objects.append(obj)
			selected_object_index = objects.size() - 1
			object_canvas.queue_redraw()
			_update_property_panel()
		elif mb.button_index == MOUSE_BUTTON_RIGHT and mb.pressed:
			_try_select_object(local_pos)
	elif event is InputEventMouseMotion:
		if dragging and selected_object_index >= 0:
			var snapped = _snap_to_grid(event.position + drag_offset)
			objects[selected_object_index]["position"] = {"x": snapped.x, "y": snapped.y}
			object_canvas.queue_redraw()
			_update_property_panel()

func _try_select_object(pos: Vector2) -> void:
	for i in range(objects.size() - 1, -1, -1):
		var obj = objects[i]
		var obj_pos = Vector2(obj["position"]["x"], obj["position"]["y"])
		if pos.distance_to(obj_pos) < 32:
			selected_object_index = i
			dragging = true
			drag_offset = obj_pos - pos
			object_canvas.queue_redraw()
			_update_property_panel()
			return
	selected_object_index = -1
	dragging = false
	object_canvas.queue_redraw()
	_update_property_panel()

func _draw_grid() -> void:
	var area_size = grid_canvas.size
	var color = Color(0.25, 0.25, 0.25)
	for x in range(0, int(area_size.x), 64):
		grid_canvas.draw_line(Vector2(x, 0), Vector2(x, area_size.y), color)
	for y in range(0, int(area_size.y), 64):
		grid_canvas.draw_line(Vector2(0, y), Vector2(area_size.x, y), color)

func _draw_objects() -> void:
	for i in objects.size():
		var obj = objects[i]
		var pos = Vector2(obj["position"]["x"], obj["position"]["y"])
		var color = _type_color(obj["type"])
		object_canvas.draw_rect(Rect2(pos.x - 16, pos.y - 16, 32, 32), color)
		object_canvas.draw_string(ThemeDB.fallback_font, pos + Vector2(-12, 4), obj["type"], HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color.WHITE)
		if i == selected_object_index:
			object_canvas.draw_rect(Rect2(pos.x - 18, pos.y - 18, 36, 36), Color.YELLOW, false, 2.0)

func _type_color(type_str: String) -> Color:
	match type_str:
		"SHELF": return Color(0.6, 0.4, 0.2)
		"GUARD": return Color(0.8, 0.2, 0.2)
		"WALL": return Color(0.5, 0.5, 0.5)
		"CHECKPOINT": return Color(0.2, 0.8, 0.2)
		"PLAYER_START": return Color(0.2, 0.4, 0.8)
		_: return Color.WHITE

func _update_property_panel() -> void:
	for child in property_container.get_children():
		child.queue_free()

	if selected_object_index < 0 or selected_object_index >= objects.size():
		var lbl = Label.new()
		lbl.text = "未选中对象"
		lbl.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
		property_container.add_child(lbl)
		return

	var obj = objects[selected_object_index]
	var type_label = Label.new()
	type_label.text = "类型: " + obj["type"]
	type_label.add_theme_color_override("font_color", Color.WHITE)
	property_container.add_child(type_label)

	var pos_label = Label.new()
	pos_label.text = "位置: (%d, %d)" % [obj["position"]["x"], obj["position"]["y"]]
	pos_label.add_theme_color_override("font_color", Color.WHITE)
	property_container.add_child(pos_label)

	match obj["type"]:
		"SHELF":
			var lbl = Label.new()
			lbl.text = "标签数量: %d" % obj["labels"].size()
			lbl.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
			property_container.add_child(lbl)
			var add_btn = Button.new()
			add_btn.text = "添加标签"
			add_btn.pressed.connect(func(): obj["labels"].append("label_%d" % obj["labels"].size()); _update_property_panel())
			property_container.add_child(add_btn)
		"GUARD":
			var lbl = Label.new()
			lbl.text = "巡逻点: %d" % obj["patrol_points"].size()
			lbl.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
			property_container.add_child(lbl)
			var add_btn = Button.new()
			add_btn.text = "添加巡逻点"
			add_btn.pressed.connect(func(): obj["patrol_points"].append({"x": 0, "y": 0}); _update_property_panel())
			property_container.add_child(add_btn)
		"WALL":
			var w_label = Label.new()
			w_label.text = "尺寸: %dx%d" % [obj["size"]["x"], obj["size"]["y"]]
			w_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
			property_container.add_child(w_label)
			var w_slider = HSlider.new()
			w_slider.min_value = 32
			w_slider.max_value = 256
			w_slider.step = 32
			w_slider.value = obj["size"]["x"]
			w_slider.value_changed.connect(func(v): obj["size"]["x"] = int(v); _update_property_panel())
			property_container.add_child(w_slider)
			var h_slider = HSlider.new()
			h_slider.min_value = 32
			h_slider.max_value = 256
			h_slider.step = 32
			h_slider.value = obj["size"]["y"]
			h_slider.value_changed.connect(func(v): obj["size"]["y"] = int(v); _update_property_panel())
			property_container.add_child(h_slider)
		"CHECKPOINT":
			var id_label = Label.new()
			id_label.text = "ID: " + str(obj["id"])
			id_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
			property_container.add_child(id_label)
			var id_input = LineEdit.new()
			id_input.text = str(obj["id"])
			id_input.text_changed.connect(func(t): obj["id"] = t)
			property_container.add_child(id_input)
		"PLAYER_START":
			var dir_label = Label.new()
			dir_label.text = "方向: " + obj["direction"]
			dir_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
			property_container.add_child(dir_label)
			var dir_btn = Button.new()
			dir_btn.text = "切换方向"
			dir_btn.pressed.connect(func():
				var dirs = ["right", "left", "up", "down"]
				var idx = dirs.find(obj["direction"])
				obj["direction"] = dirs[(idx + 1) % dirs.size()]
				_update_property_panel()
			)
			property_container.add_child(dir_btn)

	var delete_btn = Button.new()
	delete_btn.text = "删除对象"
	delete_btn.pressed.connect(_delete_selected)
	property_container.add_child(delete_btn)

func _delete_selected() -> void:
	if selected_object_index >= 0 and selected_object_index < objects.size():
		objects.remove_at(selected_object_index)
		selected_object_index = -1
		object_canvas.queue_redraw()
		_update_property_panel()

func _on_save() -> void:
	LevelManager.save_level(level_data, "custom_level_%d" % Time.get_ticks_msec())

func _on_test() -> void:
	SceneManager.request_scene("game")

func _on_clear() -> void:
	objects.clear()
	selected_object_index = -1
	object_canvas.queue_redraw()
	_update_property_panel()

func _on_back() -> void:
	SceneManager.request_scene("main_menu")

func load_level_data(data: Dictionary) -> void:
	level_data = data
	objects = data.get("objects", [])
	selected_object_index = -1
	object_canvas.queue_redraw()
	_update_property_panel()

func get_level_data() -> Dictionary:
	return {"objects": objects}
