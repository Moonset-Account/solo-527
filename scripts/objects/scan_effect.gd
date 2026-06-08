extends Node2D
class_name ScanEffect

@export var max_radius: float = 80.0
@export var expand_duration: float = 0.5
@export var fade_duration: float = 0.3

signal scan_complete

var _tween: Tween

func play(pos: Vector2) -> void:
	global_position = pos
	modulate.a = 1.0
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_method(_set_progress, 0.0, 1.0, expand_duration)
	_tween.tween_property(self, "modulate:a", 0.0, fade_duration)
	_tween.tween_callback(func() -> void: scan_complete.emit())
	_tween.tween_callback(queue_redraw)

func _draw() -> void:
	draw_circle(Vector2.ZERO, max_radius * _progress, Color(0, 1, 1, 0.4))

var _progress: float = 0.0

func _set_progress(value: float) -> void:
	_progress = value
	queue_redraw()
