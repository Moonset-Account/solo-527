class_name FactoryGrid
extends Node2D

signal cell_occupied(grid_pos)
signal cell_cleared(grid_pos)
signal entity_placed(entity, grid_pos)
signal entity_removed(entity, grid_pos)
signal product_delivered(product)

const CELL_SIZE: int = 64

const DIR_VECTORS: Dictionary = {
	0: Vector2i(1, 0),
	1: Vector2i(0, 1),
	2: Vector2i(-1, 0),
	3: Vector2i(0, -1),
}

@export var grid_width: int = 8
@export var grid_height: int = 6

var grid: Dictionary = {}
var products: Array[Product] = []
var spawn_points: Array[Vector2i] = []
var delivery_points: Array[Vector2i] = []
var hovered_cell: Vector2i = Vector2i(-1, -1)
var selected_entity_type: String = ""
var is_placing: bool = false
var placing_direction: int = 0

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

		if product.waiting_for_target:
			var next := _resolve_next_cell(product)
			if next == product.current_cell:
				if product.current_cell in delivery_points and product.is_deliverable():
					to_deliver.append(product)
				elif product.current_cell in delivery_points and product.is_failed():
					to_remove.append(product)
				continue
			product.target_cell = next
			product.waiting_for_target = false

		var target_pos: Vector2 = get_cell_center(product.target_cell)
		var direction: Vector2 = target_pos - product.global_position
		var speed: float = product.move_speed * CELL_SIZE

		var current_entity = get_entity_at(product.current_cell)
		if current_entity is ConveyorBelt:
			speed *= current_entity.get_speed_multiplier()

		if direction.length() <= speed * delta:
			product.global_position = target_pos
			product.current_cell = product.target_cell
			product.waiting_for_target = true
			_on_product_arrived(product, to_deliver, to_remove)
		else:
			product.global_position += direction.normalized() * speed * delta

	for product in to_deliver:
		product.state = Product.ProductState.DELIVERED
		product_delivered.emit(product)
		_remove_product(product)

	for product in to_remove:
		_remove_product(product)

func _resolve_next_cell(product: Product) -> Vector2i:
	var cell := product.current_cell

	var entity = get_entity_at(cell)
	if entity is ConveyorBelt:
		var dir: int = entity.direction
		var next: Vector2i = cell + DIR_VECTORS.get(dir, Vector2i.RIGHT)
		if _is_valid_cell(next):
			var target_entity = get_entity_at(next)
			if target_entity is Machine and not target_entity.can_accept_product():
				return cell
			return next
		return cell

	if entity is Machine:
		if product.just_exited_machine:
			product.just_exited_machine = false
			return _find_adjacent_exit(cell)
		if entity.can_accept_product():
			entity.start_processing(product)
			return cell
		return cell

	if entity is QualityCheck:
		return _find_adjacent_exit(cell)

	if cell in spawn_points:
		return _find_adjacent_exit(cell)

	if cell in delivery_points:
		return cell

	return _find_adjacent_exit(cell)

func _find_adjacent_exit(cell: Vector2i) -> Vector2i:
	var offsets: Array[Vector2i] = [Vector2i(1, 0), Vector2i(0, 1), Vector2i(-1, 0), Vector2i(0, -1)]

	for offset in offsets:
		var adj: Vector2i = cell + offset
		if not _is_valid_cell(adj):
			continue
		if adj in delivery_points:
			return adj

	for offset in offsets:
		var adj: Vector2i = cell + offset
		if not _is_valid_cell(adj):
			continue
		var entity = get_entity_at(adj)
		if entity is ConveyorBelt:
			return adj

	for offset in offsets:
		var adj: Vector2i = cell + offset
		if not _is_valid_cell(adj):
			continue
		var entity = get_entity_at(adj)
		if entity is Machine and entity.can_accept_product():
			return adj

	return cell

func _on_product_arrived(product: Product, to_deliver: Array, to_remove: Array) -> void:
	var cell := product.current_cell

	if cell in delivery_points:
		if product.is_deliverable():
			to_deliver.append(product)
		else:
			to_remove.append(product)
		return

	var entity = get_entity_at(cell)

	if entity is Machine:
		var machine: Machine = entity
		if machine.can_accept_product():
			machine.start_processing(product)
		else:
			product.waiting_for_target = true
		return

	if entity is QualityCheck:
		var qc: QualityCheck = entity
		qc.inspect_product(product)
		if product.is_failed():
			to_remove.append(product)
		return

func _is_valid_cell(cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.x < grid_width and cell.y >= 0 and cell.y < grid_height

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var grid_pos: Vector2i = world_to_grid(get_global_mouse_position())
		if grid_pos != hovered_cell:
			hovered_cell = grid_pos
			queue_redraw()
	elif event is InputEventMouseButton and event.pressed:
		var grid_pos: Vector2i = world_to_grid(get_global_mouse_position())
		if event.button_index == MOUSE_BUTTON_LEFT:
			if is_placing and selected_entity_type != "":
				if can_place_at(grid_pos):
					place_entity(selected_entity_type, grid_pos, placing_direction)
			else:
				var clicked_entity = get_entity_at(grid_pos)
				if clicked_entity is Machine:
					_show_upgrade_for(clicked_entity)
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			if is_placing:
				is_placing = false
				selected_entity_type = ""
			else:
				if get_entity_at(grid_pos) != null:
					remove_entity(grid_pos)

	if event is InputEventKey and event.pressed and not event.echo:
		if Input.is_action_just_pressed("place_machine"):
			if is_placing and selected_entity_type != "":
				var grid_pos: Vector2i = world_to_grid(get_global_mouse_position())
				if can_place_at(grid_pos):
					place_entity(selected_entity_type, grid_pos, placing_direction)
		elif Input.is_action_just_pressed("rotate_belt"):
			placing_direction = wrapi(placing_direction + 1, 0, 4)
			queue_redraw()
		elif Input.is_action_just_pressed("remove_machine"):
			var grid_pos: Vector2i = world_to_grid(get_global_mouse_position())
			if get_entity_at(grid_pos) != null:
				remove_entity(grid_pos)
		elif Input.is_action_just_pressed("open_shop"):
			var lc := get_parent()
			if lc and lc.has_method("_on_shop_button_pressed"):
				lc._on_shop_button_pressed()
		elif Input.is_action_just_pressed("toggle_pause"):
			var lc := get_parent()
			if lc and lc.has_method("_on_pause_button_pressed"):
				lc._on_pause_button_pressed()
		elif Input.is_action_just_pressed("speed_up"):
			var lc := get_parent()
			if lc and lc.has_method("_on_speed_button_pressed"):
				lc._on_speed_button_pressed()
		elif Input.is_action_just_pressed("cancel"):
			is_placing = false
			selected_entity_type = ""

func _show_upgrade_for(machine: Machine) -> void:
	var lc := get_parent()
	if lc and lc.has_method("_show_upgrade_for_machine"):
		lc._show_upgrade_for_machine(machine)

func _draw() -> void:
	for x in range(grid_width + 1):
		draw_line(Vector2(x * CELL_SIZE, 0), Vector2(x * CELL_SIZE, grid_height * CELL_SIZE), Color(0.4, 0.4, 0.4, 0.8), 1.0)
	for y in range(grid_height + 1):
		draw_line(Vector2(0, y * CELL_SIZE), Vector2(grid_width * CELL_SIZE, y * CELL_SIZE), Color(0.4, 0.4, 0.4, 0.8), 1.0)

	if hovered_cell.x >= 0 and hovered_cell.x < grid_width and hovered_cell.y >= 0 and hovered_cell.y < grid_height:
		var rect: Rect2 = Rect2(hovered_cell * CELL_SIZE, Vector2(CELL_SIZE, CELL_SIZE))
		draw_rect(rect, Color(1.0, 1.0, 0.0, 0.3))
		if is_placing and selected_entity_type == "conveyor":
			var arrow_dir: Vector2i = DIR_VECTORS.get(placing_direction, Vector2i.RIGHT)
			var from_pos: Vector2 = get_cell_center(hovered_cell)
			var to_pos: Vector2 = from_pos + Vector2(arrow_dir) * 20.0
			draw_line(from_pos, to_pos, Color.YELLOW, 3.0)

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
			var arrow_dir: Vector2i = DIR_VECTORS.get(entity.direction, Vector2i.RIGHT)
			var center: Vector2 = get_cell_center(pos)
			var arrow_end: Vector2 = center + Vector2(arrow_dir) * 16.0
			draw_line(center - Vector2(arrow_dir) * 16.0, arrow_end, Color(0.8, 0.8, 0.3, 0.8), 2.0)
			draw_circle(arrow_end, 4.0, Color(0.8, 0.8, 0.3, 0.8))
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
	var sp: Vector2i = spawn_points.pick_random()
	var product: Product = Product.new()
	product.current_cell = sp
	product.target_cell = sp
	product.global_position = get_cell_center(sp)
	product.waiting_for_target = true
	products.append(product)
	add_child(product)
	return product

func deliver_product(product: Product) -> void:
	product.state = Product.ProductState.DELIVERED
	product_delivered.emit(product)
	_remove_product(product)

func _remove_product(product: Product) -> void:
	if product in products:
		products.erase(product)
	if is_instance_valid(product):
		remove_child(product)
		product.queue_free()

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

func highlight_bottleneck(pos: Vector2i) -> void:
	if not _bottleneck_cells.has(pos):
		_bottleneck_cells.append(pos)
		queue_redraw()

func clear_highlights() -> void:
	_bottleneck_cells.clear()
	queue_redraw()
