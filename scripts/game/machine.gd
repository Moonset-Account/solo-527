class_name Machine
extends StaticBody2D

signal processing_started(product: Product)
signal processing_completed(product: Product)
signal machine_broken

@export var machine_type: String = ""
@export var upgrade_level: int = 0
@export var grid_position: Vector2i = Vector2i.ZERO
@export var facing_direction: int = 0

var is_processing: bool = false
var input_queue: Array = []
var output_buffer: Product = null
var processing_timer: float = 0.0
var total_processed: int = 0
var quality_improvement: float = 0.0

var _base_processing_time: float = 2.0
var _base_quality_rate: float = 0.9
var _upgrade_data: Array = []
var _machine_color: Color = Color(0.6, 0.6, 0.6)

var _machine_configs_cache: Dictionary = {}
var _upgrade_configs_cache: Dictionary = {}

func _ready() -> void:
	_load_configs()
	_update_color()

func _load_configs() -> void:
	var machine_file := FileAccess.open("res://configs/machines.json", FileAccess.READ)
	if machine_file:
		var json := JSON.new()
		if json.parse(machine_file.get_as_text()) == OK:
			var data: Dictionary = json.data
			if data.has("machines") and data["machines"].has(machine_type):
				var mdata: Dictionary = data["machines"][machine_type]
				_base_processing_time = float(mdata.get("processing_time", 2.0))
				_base_quality_rate = float(mdata.get("quality_rate", 0.9))
				quality_improvement = float(mdata.get("quality_improvement", 0.0))
				_machine_color = Color.from_string(mdata.get("color", "#888888"), Color(0.6, 0.6, 0.6))
				_machine_configs_cache = mdata
		machine_file.close()
	var upgrade_file := FileAccess.open("res://configs/upgrades.json", FileAccess.READ)
	if upgrade_file:
		var json := JSON.new()
		if json.parse(upgrade_file.get_as_text()) == OK:
			var data: Dictionary = json.data
			if data.has("upgrades") and data["upgrades"].has(machine_type):
				_upgrade_data = data["upgrades"][machine_type]
				_upgrade_configs_cache = data["upgrades"]
		upgrade_file.close()

func _update_color() -> void:
	var colors: Dictionary = {
		"cutter": Color(0.91, 0.30, 0.24),
		"assembler": Color(0.20, 0.60, 0.86),
		"painter": Color(0.18, 0.80, 0.44),
		"packer": Color(0.95, 0.61, 0.07),
	}
	_machine_color = colors.get(machine_type, _machine_color)

func _process(delta: float) -> void:
	if not is_processing:
		if input_queue.size() > 0 and output_buffer == null:
			var product: Product = input_queue.pop_front() as Product
			if product:
				start_processing(product)
		return
	processing_timer -= delta
	if processing_timer <= 0.0:
		complete_processing()

func process_product(product: Product) -> void:
	if can_accept_product(product):
		input_queue.append(product)

func place_at(grid_pos: Vector2i, direction: int) -> void:
	grid_position = grid_pos
	facing_direction = direction

func start_processing(product: Product) -> void:
	is_processing = true
	processing_timer = get_processing_time()
	processing_started.emit(product)

func complete_processing() -> void:
	if not is_processing:
		return
	is_processing = false
	processing_timer = 0.0
	var product: Product = null
	if input_queue.size() > 0:
		product = input_queue.pop_front() as Product
	if product == null:
		return
	product.advance_stage()
	var quality_rate := get_quality_rate()
	product.modify_quality(-0.05 + quality_rate)
	product.record_processing(machine_type, product.get_total_quality())
	output_buffer = product
	total_processed += 1
	processing_completed.emit(product)

func get_processing_time() -> float:
	var speed_mult := 1.0
	if upgrade_level > 0 and upgrade_level <= _upgrade_data.size():
		var level_data: Dictionary = _upgrade_data[upgrade_level - 1]
		speed_mult = float(level_data.get("speed_multiplier", 1.0))
	return _base_processing_time * speed_mult

func get_quality_rate() -> float:
	var bonus := 0.0
	if upgrade_level > 0 and upgrade_level <= _upgrade_data.size():
		var level_data: Dictionary = _upgrade_data[upgrade_level - 1]
		bonus = float(level_data.get("quality_bonus", 0.0))
	return _base_quality_rate + bonus

func upgrade() -> bool:
	var cost := get_upgrade_cost()
	if cost <= 0:
		return false
	if not GameManager.spend_money(cost):
		return false
	upgrade_level += 1
	return true

func get_upgrade_cost() -> int:
	var next_level := upgrade_level + 1
	if next_level < _upgrade_data.size():
		return int(_upgrade_data[next_level].get("cost", -1))
	return -1

func can_accept_product(product: Product) -> bool:
	return output_buffer == null and input_queue.size() < 3

func set_direction(dir: int) -> void:
	facing_direction = wrapi(dir, 0, 4)

func get_direction() -> int:
	return facing_direction

func get_color() -> Color:
	return _machine_color

func get_queue_length() -> int:
	return input_queue.size()

func get_avg_throughput() -> float:
	if total_processed <= 0:
		return 0.0
	return float(total_processed) / maxf(processing_timer, 0.1)

func _draw() -> void:
	var col := get_color()
	draw_rect(Rect2(-24, -24, 48, 48), col)
	draw_rect(Rect2(-24, -24, 48, 48), Color.WHITE, false, 1.0)
	var label := machine_type.substr(0, 3).to_upper()
	draw_string(ThemeDB.fallback_font, Vector2(-12, 4), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color.WHITE)
	if is_processing:
		var progress := 1.0 - (processing_timer / maxf(get_processing_time(), 0.01))
		draw_rect(Rect2(-24, 20, 48 * progress, 4), Color.GREEN)
	if input_queue.size() > 1:
		draw_string(ThemeDB.fallback_font, Vector2(16, -16), str(input_queue.size()), HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color.YELLOW)
