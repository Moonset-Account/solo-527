extends Node2D
class_name VisionCone

const PlayerScript = preload("res://scripts/player/player.gd")

@export var vision_range: float = 200
@export var vision_angle: float = 45.0
@export var vision_color: Color = Color(1, 0.8, 0, 0.3)

signal player_detected(position: Vector2)

var is_player_visible: bool = false
var player_position: Vector2 = Vector2.ZERO
var _direction: float = 0.0
const _RAY_COUNT: int = 12

func _process(_delta: float) -> void:
	_check_vision()
	queue_redraw()

func _check_vision() -> void:
	var parent: CharacterBody2D = get_parent() as CharacterBody2D
	if not parent or not parent.is_inside_tree():
		is_player_visible = false
		return
	var world: World2D = parent.get_world_2d()
	if not world:
		is_player_visible = false
		return
	var space_state: PhysicsDirectSpaceState2D = world.direct_space_state
	var half_angle: float = deg_to_rad(vision_angle / 2.0)
	var was_visible: bool = is_player_visible
	is_player_visible = false
	for i in _RAY_COUNT:
		var t: float = i / float(_RAY_COUNT - 1) if _RAY_COUNT > 1 else 0.5
		var ray_angle: float = _direction - half_angle + t * 2.0 * half_angle
		var end: Vector2 = parent.global_position + Vector2(cos(ray_angle), sin(ray_angle)) * vision_range
		var query: PhysicsRayQueryParameters2D = PhysicsRayQueryParameters2D.create(parent.global_position, end)
		query.collision_mask = 5
		var result: Dictionary = space_state.intersect_ray(query)
		if result:
			var collider: CollisionObject2D = result["collider"]
			if collider is PlayerScript:
				is_player_visible = true
				player_position = result["position"]
				if not was_visible:
					emit_signal("player_detected", player_position)
				break

func set_direction(angle: float) -> void:
	_direction = angle

func _draw() -> void:
	if SettingsManager and not SettingsManager.get_setting("show_vision_cones", true):
		return
	var half_angle: float = deg_to_rad(vision_angle / 2.0)
	var points: PackedVector2Array = PackedVector2Array()
	points.append(Vector2.ZERO)
	var segments: int = 24
	for i in range(segments + 1):
		var t: float = i / float(segments)
		var angle: float = _direction - half_angle + t * 2.0 * half_angle
		points.append(Vector2(cos(angle), sin(angle)) * vision_range)
	draw_polygon(points, PackedColorArray([vision_color]))
