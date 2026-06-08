extends Node

signal move_direction(direction: Vector2)
signal scan_pressed
signal interact_pressed
signal sneak_toggled(is_sneaking: bool)
signal pause_pressed

var input_enabled: bool = true
var _is_sneaking: bool = false

func _unhandled_input(event: InputEvent) -> void:
	if not input_enabled:
		return
	if event.is_action_pressed("move_up") or event.is_action_pressed("move_down") or event.is_action_pressed("move_left") or event.is_action_pressed("move_right"):
		move_direction.emit(get_movement_vector())
	elif event.is_action_pressed("scan"):
		scan_pressed.emit()
	elif event.is_action_pressed("interact"):
		interact_pressed.emit()
	elif event.is_action_pressed("sneak"):
		_is_sneaking = not _is_sneaking
		sneak_toggled.emit(_is_sneaking)
	elif event.is_action_pressed("pause"):
		pause_pressed.emit()

func get_movement_vector() -> Vector2:
	if not input_enabled:
		return Vector2.ZERO
	var x: float = Input.get_axis("move_left", "move_right")
	var y: float = Input.get_axis("move_up", "move_down")
	var direction: Vector2 = Vector2(x, y)
	if direction.length_squared() > 1.0:
		direction = direction.normalized()
	return direction

func is_sneaking() -> bool:
	return _is_sneaking

func set_input_enabled(enabled: bool) -> void:
	input_enabled = enabled
	if not enabled:
		move_direction.emit(Vector2.ZERO)
