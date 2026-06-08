class_name FactoryGrid
extends Node2D

signal cell_occupied(grid_pos)
signal cell_cleared(grid_pos)
signal entity_placed(entity, grid_pos)
signal entity_removed(entity, grid_pos)
signal product_delivered(product)

const CELL_SIZE: int = 64

@export var grid_width: int = 8
@export var grid_height: int = 6

var grid: Dictionary = {}
var products: Array[Product] = []
var spawn_points: Array[Vector2i] = []
var delivery_points: Array[Vector2i] = []
var hovered_cell: Vector2i = Vector2i(-1, -1)
var selected_entity_type: String = ""
var is_placing: bool = false

var _bottleneck_cells: Array[Vector2i] = []
var _machine_costs: Dictionary = {}

func _ready() -> void:
	initialize_grid(grid_width, grid_height)
	_load_machine_costs()

func _load_machine_costs() -> void:
	var file := FileAccess.open("res://configs/machines.json", FileAccess.READ)
	if file:
		var json := JSON.new()
		if json.parse(file.get_as_text()) == OK:
			var data: Dictionary = json.data
			if data.has("machines"):
				for mtype in data["machines"]:
					_machine_costs[mtype] = int(data["machines"][mtype].get("cost", 100))
		file.close()

func _process(delta: float) -> void:
	var to_deliver: Array[Product] = []
	var to_remove: Array[Product] = []

	for product in products:
		if product.state == Product.ProductState.DELIVERED:
			continue

		if product.state == Product.ProductState.PROCESSING:
			var entity = get_entity_at(product.current_cell)
			if entity is Machine and entity.is_processing:
				product.processing_time_remaining = entity.processing_timer
				product.queue_redraw()
			continue

		if product.path.size() == 0 or product.path_index >= product.path.size():
			if product.current_cell in delivery_points and product.is_deliverable():
				to_deliver.append(product)
			continue

		var target_cell: Vector2i = product.path[product.path_index]
		var target_pos: Vector2 = get_cell_center(target_cell)
		var direction: Vector2 = target_pos - product.global_position
		var move_speed: float = product.move_speed * CELL_SIZE

		var current_entity = get_entity_at(product.current_cell)
		if current_entity is ConveyorBelt:
			move_speed *= current_entity.get_speed_multiplier()

		var target_entity = get_entity_at(target_cell)
		if target_entity is Machine and not target_entity.can_accept_product():
			continue

		if direction.length() <= move_speed * delta:
			product.global_position = target_pos
			product.current_cell = target_cell

			if target_cell in delivery_points:
				if product.is_deliverable():
					to_deliver.append(product)
				else:
					to_remove.append(product)
				continue

			var entity = get_entity_at(target_cell)

			if entity is Machine:
				var machine: Machine = entity
				machine.start_processing(product)
				continue

			if entity is QualityCheck:
				var qc: QualityCheck = entity
				qc.inspect_product(product)
				if product.is_failed():
					to_remove.append(product)
					continue
				product.path_index += 1
				continue

			product.path_index += 1
		else:
			product.global_position += direction.normalized() * move_speed * delta

	for product in to_deliver:
		product.state = Product.ProductState.DELIVERED
		product_delivered.emit(product)
		_remove_product(product)

	for product in to_remove:
		_remove_product(product)

func _remove_product(product: Product) -> void:
	if product in products:
		products.erase(product)
	if is_instance_valid(product):
		remove_child(product)
		product.queue_free()

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var grid_pos: Vector2i = world_to_grid(get_global_mouse_position())
		if grid_pos != hovered_cell:
			hovered_cell = grid_pos
			queue_redraw()
	elif event is InputEventMouseButton and event.pressed:
		var grid_pos: Vector2i = world_to_grid(get_global_mouse_position())
		if event.button_index == MOUSE_BUTTON_LEFT and is_placing and selected_entity_type != "":
			if can_place_at(grid_pos):
				place_entity(selected_entity_type, grid_pos)
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			if get_entity_at(grid_pos) != null:
				remove_entity(grid_pos)
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_T:
			_rotate_selected()
		elif event.keycode == KEY_ESCAPE:
			is_placing = false
			selected_entity_type = ""

func _rotate_selected() -> void:
	pass

func _draw() -> void:
	for x in range(grid_width + 1):
		draw_line(Vector2(x * CELL_SIZE, 0), Vector2(x * CELL_SIZE, grid_height * CELL_SIZE), Color(0.4, 0.4, 0.4, 0.8), 1.0)
	for y in range(grid_height + 1):
		draw_line(Vector2(0, y * CELL_SIZE), Vector2(grid_width * CELL_SIZE, y * CELL_SIZE), Color(0.4, 0.4, 0.4, 0.8), 1.0)
	if hovered_cell.x >= 0 and hovered_cell.x < grid_width and hovered_cell.y >= 0 and hovered_cell.y < grid_height:
		var rect: Rect2 = Rect2(hovered_cell * CELL_SIZE, Vector2(CELL_SIZE, CELL_SIZE))
		draw_rect(rect, Color(1.0, 1.0, 0.0, 0.3))
	for sp in spawn_points:
		var rect: Rect2 = Rect2(sp * CELL_SIZE, Vector2(CELL_SIZE, CELL_SIZE))
		draw_rect(rect, Color(0.0, 1.0, 0.0, 0.25))
		draw_rect(rect, Color(0.0, 1.0, 0.0, 0.6), false, 2.0)
		draw_string(ThemeDB.fallback_font, Vector2(sp.x * CELL_SIZE + 8, sp.y * CELL_SIZE + 40), "IN", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color.GREEN)
	for dp in delivery_points:
		var rect: Rect2 = Rect2(dp * CELL_SIZE, Vector2(CELL_SIZE, CELL_SIZE))
		draw_rect(rect, Color(1.0, 0.0, 0.0, 0.25))
		draw_rect(rect, Color(1.0, 0.0, 0.0, 0.6), false, 2.0)
		draw_string(ThemeDB.fallback_font, Vector2(dp.x * CELL_SIZE + 4, dp.y * CELL_SIZE + 40), "OUT", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color.RED)
	for bp in _bottleneck_cells:
		var rect: Rect2 = Rect2(bp * CELL_SIZE, Vector2(CELL_SIZE, CELL_SIZE))
		draw_rect(rect, Color(1.0, 0.5, 0.0, 0.4))
	for pos in grid:
		var entity = grid[pos]
		var cell_rect: Rect2 = Rect2(pos * CELL_SIZE, Vector2(CELL_SIZE, CELL_SIZE))
		if entity is Machine:
			match entity.machine_type:
				"cutter":
					draw_rect(cell_rect, Color(0.2, 0.6, 0.8, 0.35))
					draw_string(ThemeDB.fallback_font, Vector2(pos.x * CELL_SIZE + 4, pos.y * CELL_SIZE + 36), "CUT", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.2, 0.6, 0.8))
				"assembler":
					draw_rect(cell_rect, Color(0.8, 0.5, 0.2, 0.35))
					draw_string(ThemeDB.fallback_font, Vector2(pos.x * CELL_SIZE + 4, pos.y * CELL_SIZE + 36), "ASM", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.8, 0.5, 0.2))
				"painter":
					draw_rect(cell_rect, Color(0.7, 0.2, 0.8, 0.35))
					draw_string(ThemeDB.fallback_font, Vector2(pos.x * CELL_SIZE + 4, pos.y * CELL_SIZE + 36), "PNT", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.7, 0.2, 0.8))
				"packer":
					draw_rect(cell_rect, Color(0.2, 0.8, 0.4, 0.35))
					draw_string(ThemeDB.fallback_font, Vector2(pos.x * CELL_SIZE + 4, pos.y * CELL_SIZE + 36), "PAK", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.2, 0.8, 0.4))
		elif entity is ConveyorBelt:
			draw_rect(cell_rect, Color(0.6, 0.6, 0.6, 0.25))
			draw_string(ThemeDB.fallback_font, Vector2(pos.x * CELL_SIZE + 8, pos.y * CELL_SIZE + 36), ">>", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color(0.7, 0.7, 0.7))
		elif entity is QualityCheck:
			draw_rect(cell_rect, Color(1.0, 1.0, 0.2, 0.3))
			draw_string(ThemeDB.fallback_font, Vector2(pos.x * CELL_SIZE + 2, pos.y * CELL_SIZE + 36), "QC", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color(1.0, 1.0, 0.3))

func initialize_grid(width: int, height: int) -> void:
	grid_width = width
	grid_height = height
	grid.clear()
	products.clear()
	_bottleneck_cells.clear()
	for child in get_children():
		remove_child(child)
		child.queue_free()
	queue_redraw()

func create_grid(width: int, height: int) -> void:
	initialize_grid(width, height)

func set_spawn_points(points: Array[Vector2i]) -> void:
	spawn_points.clear()
	for p in points:
		if p.x >= 0 and p.x < grid_width and p.y >= 0 and p.y < grid_height:
			spawn_points.append(p)
	queue_redraw()

func set_delivery_points(points: Array[Vector2i]) -> void:
	delivery_points.clear()
	for p in points:
		if p.x >= 0 and p.x < grid_width and p.y >= 0 and p.y < grid_height:
			delivery_points.append(p)
	queue_redraw()

func can_place_at(pos: Vector2i) -> bool:
	if pos.x < 0 or pos.x >= grid_width or pos.y < 0 or pos.y >= grid_height:
		return false
	return not grid.has(pos)

func place_entity(entity_type: String, pos: Vector2i, direction: int = 0) -> Node2D:
	if not can_place_at(pos):
		return null
	var cost := get_entity_cost(entity_type)
	if cost > 0 and GameManager:
		if not GameManager.spend_money(cost):
			return null
	var entity: Node2D = null
	match entity_type:
		"cutter", "assembler", "painter", "packer":
			var machine := Machine.new()
			machine.machine_type = entity_type
			machine.grid_position = pos
			machine.facing_direction = direction
			entity = machine
		"conveyor":
			var belt := ConveyorBelt.new()
			belt.grid_position = pos
			belt.direction = direction
			entity = belt
		"quality_check":
			var qc := QualityCheck.new()
			qc.grid_position = pos
			qc.facing_direction = direction
			entity = qc
		_:
			return null
	entity.position = get_cell_center(pos)
	grid[pos] = entity
	add_child(entity)
	entity_placed.emit(entity, pos)
	cell_occupied.emit(pos)
	queue_redraw()
	return entity

func get_entity_cost(entity_type: String) -> int:
	return _machine_costs.get(entity_type, 0)

func remove_entity(pos: Vector2i) -> Node2D:
	if not grid.has(pos):
		return null
	var entity: Node2D = grid[pos]
	grid.erase(pos)
	remove_child(entity)
	entity.queue_free()
	cell_cleared.emit(pos)
	entity_removed.emit(entity, pos)
	queue_redraw()
	return null

func get_entity_at(pos: Vector2i) -> Node2D:
	if grid.has(pos):
		return grid[pos]
	return null

func get_cell_center(pos: Vector2i) -> Vector2:
	return Vector2(pos.x * CELL_SIZE + CELL_SIZE * 0.5, pos.y * CELL_SIZE + CELL_SIZE * 0.5)

func world_to_grid(world_pos: Vector2) -> Vector2i:
	return Vector2i(int(world_pos.x / CELL_SIZE), int(world_pos.y / CELL_SIZE))

func spawn_product() -> Product:
	if spawn_points.is_empty():
		return null
	var sp: Vector2i = spawn_points[0]
	var product: Product = Product.new()
	product.current_cell = sp
	product.global_position = get_cell_center(sp)
	var nearest_delivery: Vector2i = delivery_points[0] if delivery_points.size() > 0 else Vector2i(-1, -1)
	if nearest_delivery.x >= 0:
		product.path = find_path(sp, nearest_delivery)
		product.path_index = 1 if product.path.size() > 1 else 0
	else:
		product.path = [sp]
		product.path_index = 0
	products.append(product)
	add_child(product)
	return product

func add_product_at(product: Product, pos: Vector2i) -> void:
	product.current_cell = pos
	product.global_position = get_cell_center(pos)
	var nearest_delivery: Vector2i = delivery_points[0] if delivery_points.size() > 0 else Vector2i(-1, -1)
	if nearest_delivery.x >= 0:
		product.path = find_path(pos, nearest_delivery)
		product.path_index = 1 if product.path.size() > 1 else 0
	if not products.has(product):
		products.append(product)

func deliver_product(product: Product) -> void:
	product.state = Product.ProductState.DELIVERED
	product_delivered.emit(product)
	_remove_product(product)

func find_path(from: Vector2i, to: Vector2i) -> Array[Vector2i]:
	if from == to:
		return [from]
	var visited: Dictionary = {}
	var queue: Array = [[from, [from]]]
	visited[from] = true
	while queue.size() > 0:
		var current: Array = queue.pop_front()
		var current_pos: Vector2i = current[0]
		var current_path: Array[Vector2i] = current[1]
		for adj in get_adjacent_cells(current_pos):
			if visited.has(adj):
				continue
			var new_path: Array[Vector2i] = current_path.duplicate()
			new_path.append(adj)
			if adj == to:
				return new_path
			visited[adj] = true
			queue.append([adj, new_path])
	var fallback_path: Array[Vector2i] = [from]
	var step: Vector2i = from
	while step != to:
		var diff: Vector2i = to - step
		if abs(diff.x) >= abs(diff.y):
			step = step + Vector2i(sign(diff.x), 0)
		else:
			step = step + Vector2i(0, sign(diff.y))
		if fallback_path.has(step):
			break
		fallback_path.append(step)
	return fallback_path

func get_adjacent_cells(pos: Vector2i) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	var offsets: Array[Vector2i] = [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]
	for offset in offsets:
		var adj: Vector2i = pos + offset
		if adj.x >= 0 and adj.x < grid_width and adj.y >= 0 and adj.y < grid_height:
			result.append(adj)
	return result

func get_all_machines() -> Array[Machine]:
	var result: Array[Machine] = []
	for pos in grid:
		var entity = grid[pos]
		if entity is Machine:
			result.append(entity)
	return result

func get_all_conveyors() -> Array[ConveyorBelt]:
	var result: Array[ConveyorBelt] = []
	for pos in grid:
		var entity = grid[pos]
		if entity is ConveyorBelt:
			result.append(entity)
	return result

func get_all_quality_checks() -> Array[QualityCheck]:
	var result: Array[QualityCheck] = []
	for pos in grid:
		var entity = grid[pos]
		if entity is QualityCheck:
			result.append(entity)
	return result

func clear_grid() -> void:
	for product in products:
		if is_instance_valid(product):
			remove_child(product)
			product.queue_free()
	products.clear()
	for pos in grid:
		var entity = grid[pos]
		if is_instance_valid(entity):
			remove_child(entity)
			entity.queue_free()
	grid.clear()
	_bottleneck_cells.clear()
	queue_redraw()

func get_occupancy_map() -> Dictionary:
	var result: Dictionary = {}
	for pos in grid:
		var entity = grid[pos]
		var type_name: String = "unknown"
		if entity is Machine:
			type_name = entity.machine_type
		elif entity is ConveyorBelt:
			type_name = "conveyor"
		elif entity is QualityCheck:
			type_name = "quality_check"
		result[pos] = type_name
	return result

func auto_connect_machines() -> void:
	pass

func highlight_bottleneck(pos: Vector2i) -> void:
	if not _bottleneck_cells.has(pos):
		_bottleneck_cells.append(pos)
		queue_redraw()

func clear_highlights() -> void:
	_bottleneck_cells.clear()
	queue_redraw()
