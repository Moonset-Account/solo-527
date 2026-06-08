extends Node
class_name InputManager

signal cell_clicked(grid_pos: Vector2i)
signal cell_hovered(grid_pos: Vector2i)
signal action_confirmed()
signal action_cancelled()
signal pause_requested()

var _input_enabled: bool = true
var _selected_unit: Node = null

func _ready() -> void:
	pass

func _input(event: InputEvent) -> void:
	if not _input_enabled:
		return
	if event.is_action_pressed("ui_cancel"):
		pause_requested.emit()
		get_viewport().set_input_as_handled()
		return
	if event is InputEventKey and event.pressed and event.keycode == KEY_ENTER:
		action_confirmed.emit()
		get_viewport().set_input_as_handled()
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_RIGHT:
		action_cancelled.emit()
		get_viewport().set_input_as_handled()
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var grid_pos: Vector2i = _screen_to_grid(event.position)
		cell_clicked.emit(grid_pos)
		get_viewport().set_input_as_handled()
		return
	if event is InputEventMouseMotion:
		var grid_pos: Vector2i = _screen_to_grid(event.position)
		cell_hovered.emit(grid_pos)
		return

func set_input_enabled(enabled: bool) -> void:
	_input_enabled = enabled

func is_input_enabled() -> bool:
	return _input_enabled

func select_unit(unit: Node) -> void:
	_selected_unit = unit

func deselect_unit() -> void:
	_selected_unit = null

func get_selected_unit() -> Node:
	return _selected_unit

func _screen_to_grid(screen_pos: Vector2) -> Vector2i:
	return Vector2i(floori(screen_pos.x / 64.0), floori(screen_pos.y / 64.0))
