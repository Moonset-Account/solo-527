extends StaticBody2D

signal item_entered_box(item: Node2D)
signal item_exited_box(item: Node2D)
signal box_overflow
signal weight_warning(ratio: float)

var box_width: float = 300.0
var box_height: float = 400.0
var wall_thickness: float = 10.0
var max_weight: float = 50.0
var current_weight: float = 0.0
var inner_area: float = 0.0
var _items_inside: Array[Node2D] = []
var _detection_area: Area2D = null
var _weight_bar: ProgressBar = null
var _overflow_indicator: ColorRect = null
var _wall_visuals: Node2D = null
var _floor_visual: ColorRect = null
var _is_overflowing: bool = false

func _ready() -> void:
	add_to_group("box")
	collision_layer = 2
	collision_mask = 1
	_build_box()

func setup(config: Dictionary) -> void:
	box_width = float(config.get("box_width", 300))
	box_height = float(config.get("box_height", 400))
	max_weight = float(config.get("max_weight", 50))
	inner_area = box_width * box_height
	set_meta("inner_area", inner_area)
	_clear_box()
	_build_box()

func _clear_box() -> void:
	for child in get_children():
		remove_child(child)
		child.queue_free()
	_items_inside.clear()

func _build_box() -> void:
	inner_area = box_width * box_height
	set_meta("inner_area", inner_area)
	_floor_visual = ColorRect.new()
	_floor_visual.size = Vector2(box_width, box_height)
	_floor_visual.position = Vector2(-box_width / 2, -box_height / 2)
	_floor_visual.color = Color(0.15, 0.1, 0.05, 1.0)
	_floor_visual.z_index = -2
	add_child(_floor_visual)
	_build_walls()
	_build_detection_area()
	_build_weight_bar()
	_overflow_indicator = ColorRect.new()
	_overflow_indicator.size = Vector2(box_width, box_height)
	_overflow_indicator.position = Vector2(-box_width / 2, -box_height / 2)
	_overflow_indicator.color = Color(1, 0, 0, 0)
	_overflow_indicator.z_index = 10
	add_child(_overflow_indicator)

func _build_walls() -> void:
	_wall_visuals = Node2D.new()
	_wall_visuals.name = "Walls"
	add_child(_wall_visuals)
	var wall_color = Color(0.55, 0.35, 0.15)
	var bottom_vis = ColorRect.new()
	bottom_vis.size = Vector2(box_width + wall_thickness * 2, wall_thickness)
	bottom_vis.position = Vector2(-(box_width + wall_thickness * 2) / 2, box_height / 2)
	bottom_vis.color = wall_color
	_wall_visuals.add_child(bottom_vis)
	var left_vis = ColorRect.new()
	left_vis.size = Vector2(wall_thickness, box_height + wall_thickness)
	left_vis.position = Vector2(-box_width / 2 - wall_thickness, -(box_height + wall_thickness) / 2)
	left_vis.color = wall_color
	_wall_visuals.add_child(left_vis)
	var right_vis = ColorRect.new()
	right_vis.size = Vector2(wall_thickness, box_height + wall_thickness)
	right_vis.position = Vector2(box_width / 2, -(box_height + wall_thickness) / 2)
	right_vis.color = wall_color
	_wall_visuals.add_child(right_vis)
	var bottom_shape = CollisionShape2D.new()
	bottom_shape.name = "BottomShape"
	var rect_bottom = RectangleShape2D.new()
	rect_bottom.size = Vector2(box_width + wall_thickness * 2, wall_thickness)
	bottom_shape.shape = rect_bottom
	bottom_shape.position = Vector2(0, box_height / 2 + wall_thickness / 2)
	add_child(bottom_shape)
	var left_shape = CollisionShape2D.new()
	left_shape.name = "LeftShape"
	var rect_left = RectangleShape2D.new()
	rect_left.size = Vector2(wall_thickness, box_height + wall_thickness)
	left_shape.shape = rect_left
	left_shape.position = Vector2(-box_width / 2 - wall_thickness / 2, 0)
	add_child(left_shape)
	var right_shape = CollisionShape2D.new()
	right_shape.name = "RightShape"
	var rect_right = RectangleShape2D.new()
	rect_right.size = Vector2(wall_thickness, box_height + wall_thickness)
	right_shape.shape = rect_right
	right_shape.position = Vector2(box_width / 2 + wall_thickness / 2, 0)
	add_child(right_shape)

func _build_detection_area() -> void:
	_detection_area = Area2D.new()
	_detection_area.name = "DetectionArea"
	_detection_area.collision_layer = 0
	_detection_area.collision_mask = 1
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(box_width - 4, box_height - 4)
	shape.shape = rect
	_detection_area.add_child(shape)
	add_child(_detection_area)
	_detection_area.body_entered.connect(_on_item_entered)
	_detection_area.body_exited.connect(_on_item_exited)

func _build_weight_bar() -> void:
	_weight_bar = ProgressBar.new()
	_weight_bar.min_value = 0
	_weight_bar.max_value = 100
	_weight_bar.value = 0
	_weight_bar.size = Vector2(box_width, 12)
	_weight_bar.position = Vector2(-box_width / 2, box_height / 2 + wall_thickness + 5)
	_weight_bar.show_percentage = false
	var style_bg = StyleBoxFlat.new()
	style_bg.bg_color = Color(0.2, 0.2, 0.2)
	_weight_bar.add_theme_stylebox_override("background", style_bg)
	var style_fill = StyleBoxFlat.new()
	style_fill.bg_color = Color(0.3, 0.8, 0.3)
	_weight_bar.add_theme_stylebox_override("fill", style_fill)
	add_child(_weight_bar)

func _on_item_entered(body: Node2D) -> void:
	if body == self or not body.has_meta("item_id"):
		return
	if not _items_inside.has(body):
		_items_inside.append(body)
		body.set_meta("in_box", true)
		item_entered_box.emit(body)
		_update_weight()
		_check_overflow(body)

func _on_item_exited(body: Node2D) -> void:
	if body == self or not body.has_meta("item_id"):
		return
	_items_inside.erase(body)
	item_exited_box.emit(body)
	_update_weight()

func _update_weight() -> void:
	current_weight = 0.0
	for item in _items_inside:
		if is_instance_valid(item):
			current_weight += item.get_meta("weight", 1.0)
	var ratio = current_weight / max_weight
	if _weight_bar:
		_weight_bar.value = clampf(ratio * 100, 0, 100)
		var fill = _weight_bar.get_theme_stylebox("fill") as StyleBoxFlat
		if fill:
			if ratio < 0.5:
				fill.bg_color = Color(0.3, 0.8, 0.3)
			elif ratio < 0.8:
				fill.bg_color = Color(0.8, 0.8, 0.2)
			else:
				fill.bg_color = Color(0.9, 0.2, 0.2)
	if ratio > 0.8:
		weight_warning.emit(ratio)

func _check_overflow(item: Node2D) -> void:
	var bounds = _get_item_bounds_in_box(item)
	if bounds.position.y < -box_height / 2:
		_is_overflowing = true
		box_overflow.emit()
		_show_overflow_warning()
	else:
		_is_overflowing = false
		if _overflow_indicator:
			var tw = create_tween()
			tw.tween_property(_overflow_indicator, "color", Color(1, 0, 0, 0), 0.3)

func _get_item_bounds_in_box(item: Node2D) -> Rect2:
	var local_pos = to_local(item.global_position)
	return Rect2(local_pos - Vector2(item.item_width, item.item_height)/2, Vector2(item.item_width, item.item_height))

func _show_overflow_warning() -> void:
	if _overflow_indicator:
		var tw = create_tween()
		tw.tween_property(_overflow_indicator, "color", Color(1, 0, 0, 0.2), 0.2)
		tw.tween_property(_overflow_indicator, "color", Color(1, 0, 0, 0.0), 0.3)

func get_items_inside() -> Array[Node2D]:
	return _items_inside

func get_fill_ratio() -> float:
	var used_area = 0.0
	for item in _items_inside:
		if is_instance_valid(item):
			used_area += item.item_width * item.item_height
	return used_area / inner_area

func get_weight_ratio() -> float:
	return current_weight / max_weight

func is_overflowing() -> bool:
	return _is_overflowing

func reset() -> void:
	_items_inside.clear()
	current_weight = 0.0
	_is_overflowing = false
	if _weight_bar:
		_weight_bar.value = 0
	if _overflow_indicator:
		_overflow_indicator.color = Color(1, 0, 0, 0)

func rebuild_internal_state() -> void:
	_items_inside.clear()
	var tree = get_tree()
	if not tree:
		return
	for node in tree.get_nodes_in_group("items"):
		if not is_instance_valid(node):
			continue
		if not node.get_meta("in_box", false):
			continue
		var local_pos = to_local(node.global_position)
		var half = Vector2(node.item_width, node.item_height) / 2.0
		var box_inner = Rect2(Vector2(-box_width / 2.0, -box_height / 2.0), Vector2(box_width, box_height))
		if box_inner.has_point(local_pos):
			_items_inside.append(node)
	_update_weight()

func remove_item_from_tracking(item: Node2D) -> void:
	if _items_inside.has(item):
		_items_inside.erase(item)
		_update_weight()
