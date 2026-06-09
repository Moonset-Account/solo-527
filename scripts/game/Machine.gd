extends Node2D
## Machine - 机器基类
## 处理输入消耗、生产计时、输出产品

const DP := preload("res://scripts/data/DataProvider.gd")

signal produced_output(machine_id: String, output_type: String)
signal input_consumed(machine_id: String, input_type: String)
signal state_changed(new_state: String)
signal upgrade_applied(new_level: int)

@export var machine_id: String = ""
@export var machine_type: String = "cutter"
@export var grid_pos: Vector2i = Vector2i.ZERO
@export var level: int = 1
@export var rotation_deg: int = 0

var config: Dictionary = {}
var base_cost: int = 0
var production_rate: float = 1.0
var production_timer: float = 0.0
var current_state: String = "idle"
var input_buffer: Dictionary = {}
var output_buffer: Array = []
var production_target: Dictionary = {}
var is_active: bool = true
var total_produced: int = 0
var total_consumed: int = 0
var total_idle_time: float = 0.0
var total_work_time: float = 0.0
var bottleneck_score: float = 0.0

var visual_body: ColorRect = null
var visual_accent: ColorRect = null
var progress_bar: ColorRect = null
var status_label: Label = null
var level_label: Label = null
var indicator: Node2D = null

func _ready() -> void:
	_setup_from_config()
	_setup_visuals()
	_update_state("idle")

func setup_from_data(data: Dictionary) -> void:
	machine_id = data.get("id", machine_id)
	machine_type = data.get("machine_type", machine_type)
	grid_pos = Vector2i(data.get("grid_x", 0), data.get("grid_y", 0))
	level = data.get("level", 1)
	rotation_deg = data.get("rotation", 0)
	_setup_from_config()
	production_rate = data.get("production_rate", config.get("base_rate", 1.0))

func _setup_from_config() -> void:
	config = DP.get_machine_config(machine_type)
	base_cost = config.get("base_cost", 100)
	if production_rate <= 0:
		production_rate = config.get("base_rate", 1.0)
	for inp in config.get("inputs", []):
		input_buffer[inp["type"]] = 0

func _setup_visuals() -> void:
	var size: Vector2 = Vector2(GameState.GRID_SIZE - 4, GameState.GRID_SIZE - 4)
	visual_body = ColorRect.new()
	visual_body.size = size
	visual_body.position = -size / 2.0
	visual_body.color = config.get("color", Color.GRAY)
	visual_body.z_index = 2
	add_child(visual_body)
	visual_accent = ColorRect.new()
	visual_accent.size = Vector2(size.x - 10, size.y - 10)
	visual_accent.position = -visual_accent.size / 2.0 + Vector2(0, -8)
	visual_accent.color = config.get("accent_color", Color.WHITE)
	visual_accent.z_index = 3
	add_child(visual_accent)
	indicator = Node2D.new()
	indicator.z_index = 4
	add_child(indicator)
	var arrow := ColorRect.new()
	arrow.size = Vector2(16, 8)
	arrow.color = Color(1, 1, 1, 0.85)
	arrow.position = Vector2(-8, size.y / 2.0 - 14)
	indicator.add_child(arrow)
	var tri := Polygon2D.new()
	tri.polygon = PackedVector2Array([Vector2(-6, 0), Vector2(6, 0), Vector2(0, 10)])
	tri.color = Color(1, 1, 1, 0.85)
	tri.position = Vector2(0, size.y / 2.0 - 14)
	indicator.add_child(tri)
	indicator.rotation = deg_to_rad(rotation_deg)
	progress_bar = ColorRect.new()
	progress_bar.size = Vector2(size.x - 8, 6)
	progress_bar.position = Vector2(-(size.x - 8) / 2.0, size.y / 2.0 - 8)
	progress_bar.color = Color(0.2, 0.8, 0.3)
	progress_bar.z_index = 5
	add_child(progress_bar)
	progress_bar.scale.x = 0.0
	status_label = Label.new()
	status_label.text = ""
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.offset_left = -size.x / 2 + 4
	status_label.offset_right = size.x / 2 - 4
	status_label.offset_top = -size.y / 2 + 2
	status_label.offset_bottom = -size.y / 2 + 20
	status_label.add_theme_font_size_override("font_size", 10)
	status_label.modulate = Color(1, 1, 1, 1)
	status_label.z_index = 6
	add_child(status_label)
	level_label = Label.new()
	level_label.text = "Lv.%d" % level
	level_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_label.offset_left = -size.x / 2 + 4
	level_label.offset_right = size.x / 2 - 4
	level_label.offset_top = size.y / 2 - 26
	level_label.offset_bottom = size.y / 2 - 8
	level_label.add_theme_font_size_override("font_size", 10)
	level_label.modulate = Color(1, 1, 0.85, 1)
	level_label.z_index = 6
	add_child(level_label)

func apply_level_visual(new_lvl: int) -> void:
	level = new_lvl
	if level_label:
		level_label.text = "Lv.%d" % level

func accept_input(product_type_name: String) -> bool:
	if not input_buffer.has(product_type_name):
		return false
	if production_target.is_empty() == false:
		return false
	var needed: int = _get_input_needed(product_type_name)
	if needed <= 0:
		return false
	input_buffer[product_type_name] += 1
	total_consumed += 1
	input_consumed.emit(machine_id, product_type_name)
	_try_start_production()
	return true

func _get_input_needed(type_name: String) -> int:
	var inputs: Array = config.get("inputs", [])
	for inp in inputs:
		if inp["type"] == type_name:
			return inp["count"] - input_buffer.get(type_name, 0)
	return 0

func can_accept_any_input() -> bool:
	if production_target.is_empty() == false:
		return false
	for inp in config.get("inputs", []):
		if input_buffer.get(inp["type"], 0) < inp["count"]:
			return true
	return false

func has_full_inputs() -> bool:
	for inp in config.get("inputs", []):
		if input_buffer.get(inp["type"], 0) < inp["count"]:
			return false
	return true

func _try_start_production() -> void:
	if not has_full_inputs():
		return
	for inp in config.get("inputs", []):
		input_buffer[inp["type"]] -= inp["count"]
	production_target = {}
	for out in config.get("outputs", []):
		production_target[out["type"]] = out["count"]
	production_timer = 0.0
	_update_state("working")

func _process(delta: float) -> void:
	if GameState.is_paused:
		return
	var dt := delta * GameState.game_speed
	if current_state == "working":
		total_work_time += dt
		var cycle_time: float = 1.0 / max(production_rate, 0.1)
		production_timer += dt
		var p: float = clamp(production_timer / cycle_time, 0.0, 1.0)
		if progress_bar:
			progress_bar.scale.x = p
		if production_timer >= cycle_time:
			_finish_production()
	elif current_state == "idle":
		total_idle_time += dt
		bottleneck_score = total_idle_time / max(total_work_time + total_idle_time, 0.1)
		if progress_bar:
			progress_bar.scale.x = 0.0
	elif current_state == "blocked":
		total_idle_time += dt
		bottleneck_score = 0.85
		if progress_bar:
			progress_bar.scale.x = 0.0

func _finish_production() -> void:
	for out_type in production_target.keys():
		var count: int = production_target[out_type]
		for i in count:
			output_buffer.append(out_type)
			total_produced += 1
			produced_output.emit(machine_id, out_type)
	production_target.clear()
	production_timer = 0.0
	_try_start_production()
	if production_target.is_empty():
		if can_accept_any_input():
			_update_state("idle")
		else:
			_update_state("blocked")

func pop_output() -> String:
	if output_buffer.size() == 0:
		return ""
	return output_buffer.pop_front()

func peek_output() -> String:
	if output_buffer.size() == 0:
		return ""
	return output_buffer[0]

func has_output() -> bool:
	return output_buffer.size() > 0

func rotate_placement(deg: int = 90) -> void:
	rotation_deg = (rotation_deg + deg) % 360
	if indicator:
		indicator.rotation = deg_to_rad(rotation_deg)

func get_output_direction() -> Vector2i:
	match rotation_deg:
		0: return Vector2i(0, 1)
		90: return Vector2i(1, 0)
		180: return Vector2i(0, -1)
		270: return Vector2i(-1, 0)
	return Vector2i(0, 1)

func get_input_direction() -> Vector2i:
	return -get_output_direction()

func _update_state(state: String) -> void:
	if current_state == state:
		return
	current_state = state
	state_changed.emit(state)
	if status_label:
		match state:
			"idle":
				status_label.text = "待命"
				status_label.modulate = Color(0.7, 0.9, 1.0, 1)
			"working":
				status_label.text = "生产"
				status_label.modulate = Color(0.6, 1.0, 0.6, 1)
			"blocked":
				status_label.text = "阻塞"
				status_label.modulate = Color(1.0, 0.6, 0.5, 1)

func is_bottleneck() -> bool:
	return bottleneck_score > 0.6 and total_work_time > 10.0

func get_upgrade_cost() -> int:
	return GameState.get_upgrade_cost(machine_id)

func do_upgrade() -> bool:
	var success: bool = GameState.upgrade_machine(machine_id)
	if success:
		apply_level_visual(level + 1)
		upgrade_applied.emit(level)
		AudioManager.play_sfx("upgrade")
	return success

func to_dict() -> Dictionary:
	return {
		"id": machine_id,
		"machine_type": machine_type,
		"grid_x": grid_pos.x,
		"grid_y": grid_pos.y,
		"level": level,
		"rotation": rotation_deg,
		"base_cost": base_cost,
		"production_rate": production_rate,
		"type": "machine"
	}
