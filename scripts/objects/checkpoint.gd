extends Area2D
class_name Checkpoint

const PlayerScript = preload("res://scripts/player/player.gd")

@export var checkpoint_id: String = ""
@export var is_active: bool = false

signal checkpoint_reached(checkpoint_id: String, position: Vector2)

var _triggered: bool = false

func _ready() -> void:
	collision_layer = 7
	collision_mask = 1
	body_entered.connect(_on_body_entered)

func _draw() -> void:
	var color := Color.GRAY
	if is_active:
		color = Color.GREEN
	var points := PackedVector2Array([
		Vector2(0, -16),
		Vector2(16, 0),
		Vector2(0, 16),
		Vector2(-16, 0)
	])
	draw_colored_polygon(points, color)

func activate() -> void:
	if _triggered:
		return
	_triggered = true
	is_active = true
	queue_redraw()
	checkpoint_reached.emit(checkpoint_id, global_position)

func _on_body_entered(body: Node2D) -> void:
	if body is PlayerScript:
		activate()
