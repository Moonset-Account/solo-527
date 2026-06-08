extends Node2D
## 视野锥 - 巡逻灯的检测区域，带碰撞和视觉反馈

@export var view_distance: float = 220.0
@export var view_angle_degrees: float = 65.0
@export var segments: int = 24
@export var detection_layer_mask: int = 1

var _vision_polygon: Polygon2D
var _detection_area: Area2D
var _cone_collision: CollisionPolygon2D

var detected_bodies: Array = []
var detection_callback: Callable = Callable()

var base_color: Color = Color(1.0, 0.3, 0.3, 0.25)
var alert_color: Color = Color(1.0, 0.15, 0.15, 0.45)
var current_color: Color = base_color

var _is_alerted: bool = false
var _player_detected: bool = false

func _ready() -> void:
	_setup_visuals()
	_setup_collision()

func _setup_visuals() -> void:
	_vision_polygon = Polygon2D.new()
	_vision_polygon.color = current_color
	add_child(_vision_polygon)
	_update_vision_polygon_shape()
	var outline := Line2D.new()
	outline.width = 2.0
	outline.default_color = Color(1, 0.5, 0.5, 0.8)
	_vision_polygon.add_child(outline)

func _setup_collision() -> void:
	_detection_area = Area2D.new()
	_detection_area.collision_layer = 16
	_detection_area.collision_mask = detection_layer_mask
	add_child(_detection_area)
	_cone_collision = CollisionPolygon2D.new()
	_detection_area.add_child(_cone_collision)
	_update_collision_polygon()
	_detection_area.body_entered.connect(_on_body_entered)
	_detection_area.body_exited.connect(_on_body_exited)
	_detection_area.area_entered.connect(_on_area_entered)
	_detection_area.area_exited.connect(_on_area_exited)

func _process(delta: float) -> void:
	_update_vision_polygon_shape()
	_update_collision_polygon()
	_check_line_of_sight()

func _update_vision_polygon_shape() -> void:
	if not _vision_polygon:
		return
	var points := _generate_cone_points()
	_vision_polygon.polygon = points
	if _vision_polygon.get_child_count() > 0:
		var outline := _vision_polygon.get_child(0) as Line2D
		if outline:
			var outline_points := points.duplicate()
			outline_points.append(Vector2.ZERO)
			outline.points = outline_points

func _update_collision_polygon() -> void:
	if not _cone_collision:
		return
	var points := _generate_cone_points()
	_cone_collision.polygon = points

func _generate_cone_points() -> PackedVector2Array:
	var result := PackedVector2Array()
	result.append(Vector2.ZERO)
	var half_angle := deg_to_rad(view_angle_degrees * 0.5)
	var start_angle := -half_angle
	for i in segments + 1:
		var t := float(i) / segments
		var angle := start_angle + t * half_angle * 2.0
		var ray_dir := Vector2.RIGHT.rotated(angle)
		var ray_length := view_distance
		var space_state := get_world_2d().direct_space_state
		var query := PhysicsRayQueryParameters2D.create(global_position, global_position + ray_dir * ray_length, 8)
		query.exclude = [self.get_rid()]
		var hit := space_state.intersect_ray(query)
		if hit:
			var local_hit := to_local(hit.position)
			ray_length = local_hit.length()
		result.append(ray_dir * ray_length)
	return result

func _check_line_of_sight() -> void:
	var valid_bodies := _detection_area.get_overlapping_bodies()
	detected_bodies.clear()
	var has_player := false
	for body in valid_bodies:
		if body.is_in_group("player"):
			if _has_line_of_sight_to(body.global_position):
				detected_bodies.append(body)
				has_player = true
	if has_player and not _player_detected:
		_player_detected = true
		set_alerted(true)
		if detection_callback.is_valid():
			detection_callback.call(body)
	elif not has_player and _player_detected:
		_player_detected = false
		set_alerted(false)

func _has_line_of_sight_to(target_pos: Vector2) -> bool:
	var space_state := get_world_2d().direct_space_state
	var ray_params := PhysicsRayQueryParameters2D.create(global_position, target_pos, 8)
	ray_params.exclude = [self.get_rid()]
	var hit := space_state.intersect_ray(ray_params)
	return hit.is_empty()

func set_alerted(alerted: bool) -> void:
	_is_alerted = alerted
	var tween := create_tween()
	if alerted:
		current_color = alert_color
		tween.tween_property(_vision_polygon, "color", alert_color, 0.15)
	else:
		current_color = tween.interpolate_value(base_color, alert_color, base_color, 0.3)
		tween.tween_property(_vision_polygon, "color", base_color, 0.3)

func is_alerted() -> bool:
	return _is_alerted

func has_detected_player() -> bool:
	return _player_detected

func get_detected_bodies() -> Array:
	return detected_bodies

func set_view_distance(dist: float) -> void:
	view_distance = dist

func set_view_angle(angle_deg: float) -> void:
	view_angle_degrees = angle_deg

func set_color(c: Color) -> void:
	base_color = c
	if not _is_alerted:
		current_color = c
		if _vision_polygon:
			_vision_polygon.color = c

func _on_body_entered(body: Node2D) -> void:
	pass

func _on_body_exited(body: Node2D) -> void:
	pass

func _on_area_entered(area: Area2D) -> void:
	pass

func _on_area_exited(area: Area2D) -> void:
	pass
