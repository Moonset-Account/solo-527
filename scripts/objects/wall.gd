extends StaticBody2D
class_name Wall

@export var wall_size: Vector2 = Vector2(64, 64)

func _ready() -> void:
	collision_layer = 3
	collision_mask = 0

func _draw() -> void:
	draw_rect(Rect2(-wall_size.x / 2.0, -wall_size.y / 2.0, wall_size.x, wall_size.y), Color(0.3, 0.3, 0.3))
