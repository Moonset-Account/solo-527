extends Node2D
## PipelineController - 流水线核心控制器
## 协调机器、传送带、产品之间的流转

const DP := preload("res://scripts/data/DataProvider.gd")

signal bottleneck_detected(machine_id: String, score: float)
signal pipeline_health_changed(score: float)

@onready var placement_system: Node = null
@onready var order_manager: Node = null

var machine_nodes: Dictionary = {}
var conveyor_nodes: Dictionary = {}
var product_scene: PackedScene = null
var machine_scene: PackedScene = null
var conveyor_scene: PackedScene = null
var spawn_timer: float = 0.0
var spawn_interval: float = 5.0
var total_products_spawned: int = 0
var raw_material_pool: Array = ["raw_material", "fastener"]
var bottleneck_check_timer: float = 0.0
var pipeline_health: float = 1.0

func initialize(ps: Node, om: Node) -> void:
	placement_system = ps
	order_manager = om
	_setup_scene_refs()

func _setup_scene_refs() -> void:
	product_scene = preload("res://scenes/game/Product.tscn")
	machine_scene = preload("res://scenes/game/Machine.tscn")
	conveyor_scene = preload("res://scenes/game/ConveyorBelt.tscn")

func spawn_machine(machine_type: String, grid_pos: Vector2i, rotation: int = 0) -> Node:
	if machine_type == "conveyor":
		return spawn_conveyor(grid_pos, rotation)
	var cfg: Dictionary = DP.get_machine_config(machine_type)
	var mid: String = GameState.generate_machine_id()
	var data: Dictionary = {
		"id": mid,
		"machine_type": machine_type,
		"grid_x": grid_pos.x,
		"grid_y": grid_pos.y,
		"level": 1,
		"rotation": rotation,
		"base_cost": cfg.get("base_cost", 100),
		"production_rate": cfg.get("base_rate", 1.0),
		"type": "machine"
	}
	var node: Node = machine_scene.instantiate()
	node.setup_from_data(data)
	node.name = mid
	var world_pos: Vector2 = placement_system.grid_to_world(grid_pos)
	node.global_position = world_pos
	add_child(node)
	node.state_changed.connect(_on_machine_state_changed.bind(mid))
	node.produced_output.connect(_on_machine_produced.bind(mid))
	machine_nodes[mid] = node
	GameState.add_machine(data)
	if machine_type == "quality":
		_update_quality_presence()
	return node

func spawn_conveyor(grid_pos: Vector2i, rotation: int = 0) -> Node:
	var cfg: Dictionary = DP.get_machine_config("conveyor")
	var cid: String = GameState.generate_machine_id()
	var node: Node = conveyor_scene.instantiate()
	node.conveyor_id = cid
	node.grid_pos = grid_pos
	node.direction_deg = rotation
	node.name = cid
	var world_pos: Vector2 = placement_system.grid_to_world(grid_pos)
	node.global_position = world_pos
	add_child(node)
	conveyor_nodes[cid] = node
	var data: Dictionary = node.to_dict()
	GameState.conveyors[cid] = data
	return node

func _update_quality_presence() -> void:
	var has: bool = false
	for m in machine_nodes.values():
		if m.machine_type == "quality":
			has = true
			break
	if order_manager:
		order_manager.set_has_quality(has)

func _on_machine_state_changed(state: String, mid: String = "") -> void:
	pass

func _on_machine_produced(mid: String, output_type: String) -> void:
	var m_node = machine_nodes.get(mid)
	if m_node == null:
		return
	if m_node.machine_type == "quality":
		_spawn_product_from_quality(m_node, output_type)
		return
	var next_pos: Vector2i = m_node.grid_pos + m_node.get_output_direction()
	if placement_system.is_delivery_point(next_pos):
		_deliver_product(m_node, output_type)
		return
	var target: Node = _find_machine_at(next_pos)
	if target and target.accept_input(output_type):
		m_node.pop_output()
		return
	var conveyor: Node = _find_conveyor_at(next_pos)
	if conveyor:
		_route_product_via_conveyor(m_node, conveyor, output_type)
		return
	if placement_system.is_cell_occupied(next_pos) == false:
		m_node.pop_output()

func _spawn_product_from_quality(q_node: Node, output_type: String) -> void:
	var out: String = q_node.pop_output()
	if out.is_empty():
		return
	var dir: Vector2i = q_node.get_output_direction()
	var start_pos: Vector2i = q_node.grid_pos + dir
	if placement_system.is_delivery_point(start_pos):
		var reward: int = 50
		GameState.add_money(reward)
		return
	var target = _find_machine_at(start_pos)
	if target:
		target.accept_input(out)

func _route_product_via_conveyor(from_machine: Node, conveyor: Node, output_type: String) -> void:
	var out: String = from_machine.pop_output()
	if out.is_empty():
		return
	var product: Node = product_scene.instantiate()
	product.product_type = out
	var path: Array = []
	path.append(from_machine.global_position)
	var cur_conv: Node = conveyor
	var last_dir: Vector2i = cur_conv.get_flow_direction()
	var visited: Dictionary = {}
	var safety: int = 0
	while cur_conv and safety < 50:
		var ckey: String = "%d,%d" % [cur_conv.grid_pos.x, cur_conv.grid_pos.y]
		if visited.has(ckey):
			break
		visited[ckey] = true
		path.append(cur_conv.global_position)
		var next_grid: Vector2i = cur_conv.grid_pos + cur_conv.get_flow_direction()
		if placement_system.is_delivery_point(next_grid):
			path.append(placement_system.grid_to_world(next_grid))
			product.set_path(path)
			add_child(product)
			product.stuck.connect(func(p): _on_product_stuck(p))
			product.set_script(product.get_script())
			_call_later(func(): _deliver_arrived_product(out))
			return
		var next_machine = _find_machine_at(next_grid)
		if next_machine:
			path.append(next_machine.global_position)
			product.set_path(path)
			add_child(product)
			product.stuck.connect(func(p): _on_product_stuck(p))
			_call_later(func(): next_machine.accept_input(out))
			return
		var next_conv = _find_conveyor_at(next_grid)
		if next_conv:
			last_dir = next_conv.get_flow_direction()
			cur_conv = next_conv
		else:
			break
		safety += 1
	if path.size() > 1:
		product.set_path(path)
		add_child(product)
		product.stuck.connect(func(p): _on_product_stuck(p))

func _call_later(cb: Callable) -> void:
	await get_tree().create_timer(1.0).timeout
	if cb.is_valid():
		cb.call()

func _deliver_product(machine: Node, product_type_name: String) -> void:
	var out: String = machine.pop_output()
	if out.is_empty():
		return
	if order_manager:
		order_manager.deliver_product(out)

func _deliver_arrived_product(product_type_name: String) -> void:
	if order_manager:
		order_manager.deliver_product(product_type_name)

func _find_machine_at(grid_pos: Vector2i) -> Node:
	for m in machine_nodes.values():
		if m.grid_pos == grid_pos:
			return m
	return null

func _find_conveyor_at(grid_pos: Vector2i) -> Node:
	for c in conveyor_nodes.values():
		if c.grid_pos == grid_pos:
			return c
	return null

func _on_product_stuck(product_node: Node) -> void:
	if product_node and is_instance_valid(product_node):
		product_node.destroy_self()

func spawn_raw_material() -> void:
	for sp in placement_system.spawn_points:
		var target_dirs := [Vector2i(1, 0), Vector2i(0, 1), Vector2i(0, -1)]
		for d in target_dirs:
			var ng: Vector2i = sp + d
			var target: Node = _find_machine_at(ng)
			if target and target.can_accept_any_input():
				var chosen: String = raw_material_pool[randi() % raw_material_pool.size()]
				for inp in DP.get_machine_config(target.machine_type).get("inputs", []):
					if inp["type"] == chosen or (chosen == "raw_material"):
						chosen = inp["type"]
						break
				target.accept_input(chosen)
				total_products_spawned += 1
				return

func _process(delta: float) -> void:
	if GameState.is_paused:
		return
	var dt := delta * GameState.game_speed
	spawn_timer += dt
	if spawn_timer >= spawn_interval:
		spawn_timer = 0.0
		spawn_raw_material()
	bottleneck_check_timer += dt
	if bottleneck_check_timer >= 3.0:
		bottleneck_check_timer = 0.0
		_check_bottlenecks()

func _check_bottlenecks() -> void:
	var worst_score: float = 0.0
	var worst_id: String = ""
	var total_idle: float = 0.0
	var total: int = 0
	for mid in machine_nodes.keys():
		var m = machine_nodes[mid]
		if m.is_bottleneck():
			bottleneck_detected.emit(mid, m.bottleneck_score)
			if m.bottleneck_score > worst_score:
				worst_score = m.bottleneck_score
				worst_id = mid
		total_idle += m.total_idle_time
		total += 1
	if total > 0:
		pipeline_health = 1.0 - clamp(total_idle / (total * max(bottleneck_check_timer * 10, 1.0)), 0.0, 1.0)
		pipeline_health_changed.emit(pipeline_health)

func get_machine_by_id(mid: String):
	return machine_nodes.get(mid, null)

func remove_machine(mid: String) -> bool:
	var m = machine_nodes.get(mid, null)
	if m:
		placement_system.vacate_cell(m.grid_pos)
		m.queue_free()
		machine_nodes.erase(mid)
		GameState.remove_machine(mid)
		_update_quality_presence()
		return true
	return false

func get_statistics() -> Dictionary:
	var total_machines: int = machine_nodes.size()
	var total_conveyors: int = conveyor_nodes.size()
	var total_produced: int = 0
	var working_count: int = 0
	var idle_count: int = 0
	var blocked_count: int = 0
	for m in machine_nodes.values():
		total_produced += m.total_produced
		match m.current_state:
			"working": working_count += 1
			"idle": idle_count += 1
			"blocked": blocked_count += 1
	return {
		"machines": total_machines,
		"conveyors": total_conveyors,
		"produced": total_produced,
		"products_spawned": total_products_spawned,
		"working": working_count,
		"idle": idle_count,
		"blocked": blocked_count,
		"health": pipeline_health
	}
