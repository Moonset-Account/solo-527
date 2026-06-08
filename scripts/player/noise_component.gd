extends Node2D
class_name NoiseComponent

@export var max_radius: float = 100
@export var fade_duration: float = 1.0

var _current_radius: float = 0.0
var _current_alpha: float = 0.0
var _tween: Tween

func emit_noise(radius: float):
	if _tween and _tween.is_running():
		_tween.kill()
	_current_radius = 0.0
	_current_alpha = 0.3
	_tween = create_tween()
	_tween.tween_property(self, "_current_radius", radius, 0.3)
	_tween.tween_property(self, "_current_alpha", 0.0, fade_duration)

func _draw():
	if _current_radius > 0 and _current_alpha > 0:
		draw_circle(Vector2.ZERO, _current_radius, Color(1, 1, 0, _current_alpha))

func _process(_delta):
	queue_redraw()
