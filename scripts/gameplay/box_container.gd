extends StaticBody2D

signal item_entered(item)
signal item_exited(item)
signal weight_exceeded
signal fragile_crushed(item)

@export var box_width: float = 200.0
@export var box_height: float = 300.0
@export var max_weight: float = 100.0

var items_inside: Array = []
var _detection_area: Area2D
var _wall_thickness: float = 10.0

func _ready() -> void:
	_build_walls()
	_build_detection_area()

func _build_walls() -> void:
	var left_wall = StaticBody2D.new()
	var left_shape = CollisionShape2D.new()
	var left_rect = RectangleShape2D.new()
	left_rect.size = Vector2(_wall_thickness, box_height + _wall_thickness)
	left_shape.shape = left_rect
	left_shape.position = Vector2(-box_width / 2.0 - _wall_thickness / 2.0, 0.0)
	left_wall.add_child(left_shape)
	add_child(left_wall)

	var right_wall = StaticBody2D.new()
	var right_shape = CollisionShape2D.new()
	var right_rect = RectangleShape2D.new()
	right_rect.size = Vector2(_wall_thickness, box_height + _wall_thickness)
	right_shape.shape = right_rect
	right_shape.position = Vector2(box_width / 2.0 + _wall_thickness / 2.0, 0.0)
	right_wall.add_child(right_shape)
	add_child(right_wall)

	var bottom_wall = StaticBody2D.new()
	var bottom_shape = CollisionShape2D.new()
	var bottom_rect = RectangleShape2D.new()
	bottom_rect.size = Vector2(box_width + _wall_thickness * 2.0, _wall_thickness)
	bottom_shape.shape = bottom_rect
	bottom_shape.position = Vector2(0.0, box_height / 2.0 + _wall_thickness / 2.0)
	bottom_wall.add_child(bottom_shape)
	add_child(bottom_wall)

func _build_detection_area() -> void:
	_detection_area = Area2D.new()
	var area_shape = CollisionShape2D.new()
	var area_rect = RectangleShape2D.new()
	area_rect.size = Vector2(box_width, box_height)
	area_shape.shape = area_rect
	_detection_area.add_child(area_shape)
	_detection_area.body_entered.connect(_on_body_entered)
	_detection_area.body_exited.connect(_on_body_exited)
	add_child(_detection_area)

func _on_body_entered(body: Node2D) -> void:
	if body is RigidBody2D and not items_inside.has(body):
		items_inside.append(body)
		item_entered.emit(body)
		if get_total_weight() > max_weight:
			weight_exceeded.emit()

func _on_body_exited(body: Node2D) -> void:
	if items_inside.has(body):
		items_inside.erase(body)
		item_exited.emit(body)

func get_remaining_space() -> float:
	var used_area: float = 0.0
	for item in items_inside:
		if "item_data" in item and item.item_data:
			used_area += item.item_data.get_area()
	return box_width * box_height - used_area

func get_total_weight() -> float:
	var total: float = 0.0
	for item in items_inside:
		if "item_data" in item and item.item_data:
			total += item.item_data.weight
	return total

func is_overweight() -> bool:
	return get_total_weight() > max_weight

func is_item_inside(item: Node2D) -> bool:
	return items_inside.has(item)

func check_fragile_items_under_pressure() -> Array:
	var crushed: Array = []
	var items_by_y = items_inside.duplicate()
	items_by_y.sort_custom(func(a, b): return a.global_position.y < b.global_position.y)
	for item in items_by_y:
		if "item_data" in item and item.item_data and item.item_data.is_fragile:
			var weight_above: float = 0.0
			for other in items_by_y:
				if other != item and other.global_position.y < item.global_position.y:
					if "item_data" in other and other.item_data:
						if abs(other.global_position.x - item.global_position.x) < (item.item_data.width / 2.0 + other.item_data.width / 2.0) * 0.5:
							weight_above += other.item_data.weight
			if weight_above > item.item_data.weight:
				crushed.append(item)
	return crushed
