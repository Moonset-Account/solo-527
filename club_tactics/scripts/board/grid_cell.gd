class_name GridCell
extends ColorRect

signal cell_clicked(pos: Vector2i)
signal cell_hovered(pos: Vector2i)

var grid_position: Vector2i = Vector2i.ZERO
var cell_size: int = 64
var is_obstacle: bool = false
var is_highlighted: bool = false
var is_task_location: bool = false
var task_type: int = -1
var _default_color: Color = Color(0.2, 0.2, 0.3, 0.8)
var _highlight_color: Color = Color(0.4, 0.6, 0.9, 0.8)
var _obstacle_color: Color = Color(0.1, 0.1, 0.1, 1.0)
var _task_colors: Dictionary = {
	0: Color(0.2, 0.7, 0.3, 0.8),
	1: Color(0.7, 0.5, 0.2, 0.8),
	2: Color(0.3, 0.4, 0.8, 0.8),
}

func _ready() -> void:
	custom_minimum_size = Vector2(cell_size, cell_size)
	color = _default_color
	mouse_entered.connect(_on_mouse_entered)
	gui_input.connect(_on_gui_input)

func setup(pos: Vector2i, size: int, obstacle: bool = false) -> void:
	grid_position = pos
	cell_size = size
	is_obstacle = obstacle
	custom_minimum_size = Vector2(cell_size, cell_size)
	_update_color()

func set_highlight(highlighted: bool) -> void:
	is_highlighted = highlighted
	_update_color()

func set_task_location(is_task: bool, type: int = -1) -> void:
	is_task_location = is_task
	task_type = type
	_update_color()

func _update_color() -> void:
	if is_obstacle:
		color = _obstacle_color
	elif is_highlighted:
		color = _highlight_color
	elif is_task_location and task_type >= 0:
		color = _task_colors.get(task_type, _default_color)
	else:
		color = _default_color

func _on_mouse_entered() -> void:
	cell_hovered.emit(grid_position)

func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		cell_clicked.emit(grid_position)
