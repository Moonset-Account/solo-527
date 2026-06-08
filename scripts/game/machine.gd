class_name Machine
extends StaticBody2D

signal processing_completed(product: Product)

@export var machine_type: String = ""
@export var upgrade_level: int = 0
@export var grid_position: Vector2i = Vector2i.ZERO
@export var facing_direction: int = 0

var is_processing: bool = false
var current_product: Product = null
var processing_timer: float = 0.0
var total_processed: int = 0

var _base_processing_time: float = 2.0
var _base_quality_rate: float = 0.9
var _machine_color: Color = Color(0.6, 0.6, 0.6)
var _target_stage: int = Product.ProductStage.CUT
var _upgrade_data: Array = []
var _machine_configs_cache: Dictionary = {}

const MACHINE_TARGET_STAGES: Dictionary = {
	"cutter": Product.ProductStage.CUT,
	"assembler": Product.ProductStage.ASSEMBLED,
	"painter": Product.ProductStage.PAINTED,
	"packer": Product.ProductStage.PACKED,
}

const MACHINE_COLORS: Dictionary = {
	"cutter": Color(0.91, 0.30, 0.24),
	"assembler": Color(0.20, 0.60, 0.86),
	"painter": Color(0.18, 0.80, 0.44),
	"packer": Color(0.95, 0.61, 0.07),
}

func _ready() -> void:
	_load_configs()
	_target_stage = MACHINE_TARGET_STAGES.get(machine_type, Product.ProductStage.CUT)
	_machine_color = MACHINE_COLORS.get(machine_type, _machine_color)

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
				_machine_configs_cache = mdata
		machine_file.close()
	var upgrade_file := FileAccess.open("res://configs/upgrades.json", FileAccess.READ)
	if upgrade_file:
		var json := JSON.new()
		if json.parse(upgrade_file.get_as_text()) == OK:
			var data: Dictionary = json.data
			if data.has("upgrades") and data["upgrades"].has(machine_type):
				_upgrade_data = data["upgrades"][machine_type]
		upgrade_file.close()

func _process(delta: float) -> void:
	if not is_processing or current_product == null:
		return
	processing_timer -= delta
	if processing_timer <= 0.0:
		_complete_processing()

func start_processing(product: Product) -> bool:
	if is_processing:
		return false
	is_processing = true
	current_product = product
	product.state = Product.ProductState.PROCESSING
	product.processing_time_remaining = get_processing_time()
	processing_timer = get_processing_time()
	return true

func _complete_processing() -> void:
	if current_product == null:
		is_processing = false
		return
	current_product.advance_to_stage(_target_stage)
	var quality_rate := get_quality_rate()
	current_product.modify_quality(quality_rate - 1.0 + 0.1)
	current_product.record_processing(machine_type, current_product.get_total_quality())
	current_product.state = Product.ProductState.MOVING
	current_product.processing_time_remaining = 0.0
	current_product.waiting_for_target = true
	current_product.just_exited_machine = true
	var finished_product := current_product
	current_product = null
	is_processing = false
	total_processed += 1
	processing_completed.emit(finished_product)

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

func can_accept_product() -> bool:
	return not is_processing

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

func set_direction(dir: int) -> void:
	facing_direction = wrapi(dir, 0, 4)

func get_direction() -> int:
	return facing_direction

func get_color() -> Color:
	return _machine_color

func get_queue_length() -> int:
	return 1 if is_processing else 0

func get_avg_throughput() -> float:
	return float(total_processed)

func _draw() -> void:
	var col := get_color()
	draw_rect(Rect2(-24, -24, 48, 48), col)
	draw_rect(Rect2(-24, -24, 48, 48), Color.WHITE, false, 1.0)
	var label := machine_type.substr(0, 3).to_upper()
	draw_string(ThemeDB.fallback_font, Vector2(-12, 4), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color.WHITE)
	if is_processing:
		var progress := 1.0 - (processing_timer / maxf(get_processing_time(), 0.01))
		draw_rect(Rect2(-24, 20, 48 * progress, 4), Color.GREEN)
		draw_rect(Rect2(-24, 20, 48, 4), Color(0.3, 0.3, 0.3), false, 1.0)
