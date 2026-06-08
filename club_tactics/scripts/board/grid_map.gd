class_name GridMap
extends Control

signal cell_selected(pos: Vector2i)
signal cell_hover(pos: Vector2i)

var _cells: Dictionary = {}
var _grid_width: int = 8
var _grid_height: int = 6
var _cell_size: int = 64
var _highlighted_cells: Array[Vector2i] = []

func setup(width: int, height: int, cell_size: int = 64) -> void:
	_grid_width = width
	_grid_height = height
	_cell_size = cell_size
	_clear_grid()
	_build_grid()

func _clear_grid() -> void:
	for child in get_children():
		child.queue_free()
	_cells.clear()
	_highlighted_cells.clear()

func _build_grid() -> void:
	for y in _grid_height:
		for x in _grid_width:
			var cell: GridCell = GridCell.new()
			cell.setup(Vector2i(x, y), _cell_size)
			cell.position = Vector2(x * _cell_size, y * _cell_size)
			cell.cell_clicked.connect(_on_cell_clicked)
			cell.cell_hovered.connect(_on_cell_hovered)
			add_child(cell)
			_cells[Vector2i(x, y)] = cell
	custom_minimum_size = Vector2(_grid_width * _cell_size, _grid_height * _cell_size)

func set_obstacles(positions: Array[Vector2i]) -> void:
	for pos in positions:
		if _cells.has(pos):
			_cells[pos].is_obstacle = true
			_cells[pos]._update_color()

func set_task_position(pos: Vector2i, task_type: int) -> void:
	if _cells.has(pos):
		_cells[pos].set_task_location(true, task_type)

func highlight_cells(positions: Array[Vector2i]) -> void:
	clear_highlights()
	_highlighted_cells = positions
	for pos in positions:
		if _cells.has(pos):
			_cells[pos].set_highlight(true)

func clear_highlights() -> void:
	for pos in _highlighted_cells:
		if _cells.has(pos):
			_cells[pos].set_highlight(false)
	_highlighted_cells.clear()

func get_cell(pos: Vector2i) -> GridCell:
	return _cells.get(pos, null)

func is_valid_position(pos: Vector2i) -> bool:
	return pos.x >= 0 and pos.x < _grid_width and pos.y >= 0 and pos.y < _grid_height

func is_walkable(pos: Vector2i) -> bool:
	if not is_valid_position(pos):
		return false
	var cell: GridCell = _cells.get(pos, null)
	return cell != null and not cell.is_obstacle

func get_reachable_positions(from: Vector2i, range: int) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	var visited: Dictionary = {}
	var to_visit: Array = [{pos = from, dist = 0}]
	visited[from] = true
	var directions: Array[Vector2i] = [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]
	while to_visit.size() > 0:
		var current: Dictionary = to_visit.pop_front()
		var cur_pos: Vector2i = current.pos
		var cur_dist: int = current.dist
		if cur_dist > 0:
			result.append(cur_pos)
		if cur_dist < range:
			for d in directions:
				var next: Vector2i = cur_pos + d
				if not visited.has(next) and is_walkable(next):
					visited[next] = true
					to_visit.append({pos = next, dist = cur_dist + 1})
	return result

func get_path(from: Vector2i, to: Vector2i) -> Array[Vector2i]:
	var path: Array[Vector2i] = []
	if not is_walkable(to):
		return path
	var came_from: Dictionary = {}
	var visited: Dictionary = {}
	var to_visit: Array = [from]
	visited[from] = true
	var directions: Array[Vector2i] = [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]
	while to_visit.size() > 0:
		var current: Vector2i = to_visit.pop_front()
		if current == to:
			var node: Vector2i = to
			while node != from:
				path.push_front(node)
				node = came_from[node]
			return path
		for d in directions:
			var next: Vector2i = current + d
			if not visited.has(next) and is_walkable(next):
				visited[next] = true
				came_from[next] = current
				to_visit.append(next)
	return path

func _on_cell_clicked(pos: Vector2i) -> void:
	cell_selected.emit(pos)

func _on_cell_hovered(pos: Vector2i) -> void:
	cell_hover.emit(pos)
