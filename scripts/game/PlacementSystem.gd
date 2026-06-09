extends Node2D
## PlacementSystem - 玩家输入和放置系统
## 负责鼠标/触摸输入、网格计算、拖拽放置

const DP := preload("res://scripts/data/DataProvider.gd")

signal item_placed(item_type: String, grid_pos: Vector2i)
signal placement_cancelled()
signal machine_selected(machine_id: String)
signal cell_hovered(grid_pos: Vector2i)

@export var grid_offset: Vector2 = Vector2(104, 154)
@export var level_size: Vector2i = Vector2i(12, 7)

var selected_machine_type: String = ""
var selected_rotation: int = 0
var is_placing: bool = false
var is_dragging: bool = false
var ghost_visual: Node2D = null
var hover_cell: Vector2i = Vector2i(-1, -1)
var grid_cells: Dictionary = {}
var occupied_cells: Dictionary = {}
var blocked_cells: Array = []
var selected_machine_id: String = ""
var spawn_points: Array = []
var delivery_points: Array = []
var grid_visual_layer: Node2D = null

func _ready() -> void:
	_setup_grid_visual()

func setup_for_level(level_cfg: Dictionary) -> void:
	level_size = level_cfg.get("grid_size", Vector2i(12, 7))
	spawn_points = level_cfg.get("spawn_points", [])
	delivery_points = level_cfg.get("delivery_points", [])
	blocked_cells.clear()
	occupied_cells.clear()
	RebuildGridVisual()

func RebuildGridVisual() -> void:
	if grid_visual_layer:
		grid_visual_layer.queue_free()
	_setup_grid_visual()

func _setup_grid_visual() -> void:
	grid_visual_layer = Node2D.new()
	grid_visual_layer.z_index = 0
	add_child(grid_visual_layer)
	for x in level_size.x:
		for y in level_size.y:
			var cell_pos: Vector2 = _grid_to_world(Vector2i(x, y))
			var bg := ColorRect.new()
			bg.size = Vector2(GameState.GRID_SIZE - 2, GameState.GRID_SIZE - 2)
			bg.position = cell_pos - bg.size / 2.0
			var is_even: bool = (x + y) % 2 == 0
			bg.color = Color(0.15, 0.12, 0.22, 1.0) if is_even else Color(0.18, 0.14, 0.26, 1.0)
			grid_visual_layer.add_child(bg)
			var key: String = "%d,%d" % [x, y]
			grid_cells[key] = bg
	for sp in spawn_points:
		_mark_special_cell(sp, Color(0.2, 0.6, 0.35, 0.7), "入")
	for dp in delivery_points:
		_mark_special_cell(dp, Color(0.6, 0.3, 0.2, 0.7), "出")

func _mark_special_cell(gpos: Vector2i, col: Color, label_text: String) -> void:
	var cell_pos: Vector2 = _grid_to_world(gpos)
	var bg := ColorRect.new()
	bg.size = Vector2(GameState.GRID_SIZE - 2, GameState.GRID_SIZE - 2)
	bg.position = cell_pos - bg.size / 2.0
	bg.color = col
	bg.z_index = 1
	grid_visual_layer.add_child(bg)
	var lbl := Label.new()
	lbl.text = label_text
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lbl.offset_left = cell_pos.x - GameState.GRID_SIZE / 2
	lbl.offset_right = cell_pos.x + GameState.GRID_SIZE / 2
	lbl.offset_top = cell_pos.y - GameState.GRID_SIZE / 2
	lbl.offset_bottom = cell_pos.y + GameState.GRID_SIZE / 2
	lbl.add_theme_font_size_override("font_size", 22)
	lbl.modulate = Color(1, 1, 1, 1)
	lbl.z_index = 2
	grid_visual_layer.add_child(lbl)

func start_placing(machine_type: String) -> void:
	selected_machine_type = machine_type
	selected_rotation = 0
	is_placing = true
	selected_machine_id = ""
	_create_ghost()
	PlaytestRecorder.record_event("start_placing", {"machine_type": machine_type})

func cancel_placing() -> void:
	is_placing = false
	selected_machine_type = ""
	if ghost_visual:
		ghost_visual.queue_free()
		ghost_visual = null
	placement_cancelled.emit()

func _create_ghost() -> void:
	if ghost_visual:
		ghost_visual.queue_free()
	ghost_visual = Node2D.new()
	var cfg: Dictionary = DP.get_machine_config(selected_machine_type)
	var s: float = GameState.GRID_SIZE - 4
	var body := ColorRect.new()
	body.size = Vector2(s, s)
	body.position = -Vector2(s, s) / 2.0
	body.color = cfg.get("color", Color.GRAY)
	body.modulate.a = 0.6
	ghost_visual.add_child(body)
	var accent := ColorRect.new()
	accent.size = Vector2(s - 10, s - 10)
	accent.position = -accent.size / 2.0 + Vector2(0, -8)
	accent.color = cfg.get("accent_color", Color.WHITE)
	accent.modulate.a = 0.6
	ghost_visual.add_child(accent)
	ghost_visual.z_index = 100
	add_child(ghost_visual)

func can_place_at(grid_pos: Vector2i) -> bool:
	if grid_pos.x < 0 or grid_pos.x >= level_size.x:
		return false
	if grid_pos.y < 0 or grid_pos.y >= level_size.y:
		return false
	var key: String = "%d,%d" % [grid_pos.x, grid_pos.y]
	if occupied_cells.has(key):
		return false
	for sp in spawn_points:
		if sp == grid_pos:
			return false
	for dp in delivery_points:
		if dp == grid_pos:
			return false
	return true

func is_spawn_point(gpos: Vector2i) -> bool:
	for sp in spawn_points:
		if sp == gpos:
			return true
	return false

func is_delivery_point(gpos: Vector2i) -> bool:
	for dp in delivery_points:
		if dp == gpos:
			return true
	return false

func occupy_cell(grid_pos: Vector2i, object_id: String) -> void:
	var key: String = "%d,%d" % [grid_pos.x, grid_pos.y]
	occupied_cells[key] = object_id

func vacate_cell(grid_pos: Vector2i) -> void:
	var key: String = "%d,%d" % [grid_pos.x, grid_pos.y]
	if occupied_cells.has(key):
		occupied_cells.erase(key)

func is_cell_occupied(grid_pos: Vector2i) -> bool:
	var key: String = "%d,%d" % [grid_pos.x, grid_pos.y]
	return occupied_cells.has(key)

func rotate_ghost() -> void:
	selected_rotation = (selected_rotation + 90) % 360
	if ghost_visual:
		ghost_visual.rotation = deg_to_rad(selected_rotation)

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var mouse_pos: Vector2 = event.position - grid_offset
		hover_cell = _world_to_grid(mouse_pos)
		if is_placing and ghost_visual:
			ghost_visual.global_position = _grid_to_world(hover_cell)
			ghost_visual.rotation = deg_to_rad(selected_rotation)
			var ok: bool = can_place_at(hover_cell)
			for c in ghost_visual.get_children():
				if c is ColorRect:
					c.modulate.a = 0.7 if ok else 0.3
					if not ok:
						c.color = Color(1, 0.3, 0.3, 0.6)
		cell_hovered.emit(hover_cell)
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if is_placing:
			if can_place_at(hover_cell):
				_confirm_placement()
			else:
				AudioManager.play_sfx("warning")
	elif event is InputEventKey and event.pressed:
		if event.keycode == KEY_R and is_placing:
			rotate_ghost()
			AudioManager.play_sfx("button_hover")
		elif event.keycode == KEY_ESCAPE and is_placing:
			cancel_placing()
			AudioManager.play_sfx("click")

func _confirm_placement() -> void:
	var cfg: Dictionary = DP.get_machine_config(selected_machine_type)
	var cost: int = cfg.get("base_cost", 100)
	if not GameState.spend_money(cost):
		AudioManager.play_sfx("warning")
		return
	occupy_cell(hover_cell, selected_machine_type)
	item_placed.emit(selected_machine_type, hover_cell)
	AudioManager.play_sfx("place")
	PlaytestRecorder.record_key_decision("place_%s" % selected_machine_type, {
		"pos": [hover_cell.x, hover_cell.y],
		"cost": cost,
		"rotation": selected_rotation
	})
	if selected_machine_type != "conveyor":
		cancel_placing()

func _grid_to_world(gpos: Vector2i) -> Vector2:
	return Vector2(
		float(gpos.x) * GameState.GRID_SIZE + GameState.GRID_SIZE / 2.0,
		float(gpos.y) * GameState.GRID_SIZE + GameState.GRID_SIZE / 2.0
	) + grid_offset

func _world_to_grid(wpos: Vector2) -> Vector2i:
	var adjusted: Vector2 = wpos
	return Vector2i(
		int(floor(adjusted.x / GameState.GRID_SIZE)),
		int(floor(adjusted.y / GameState.GRID_SIZE))
	)

func grid_to_world(gpos: Vector2i) -> Vector2:
	return _grid_to_world(gpos)

func select_machine_by_id(mid: String) -> void:
	selected_machine_id = mid
	machine_selected.emit(mid)

func clear_selection() -> void:
	selected_machine_id = ""
