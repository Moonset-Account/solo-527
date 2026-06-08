class_name QualityCheck
extends StaticBody2D

signal product_passed(product: Product, quality_score: float)
signal product_failed(product: Product, quality_score: float)

@export var grid_position: Vector2i = Vector2i.ZERO
@export var facing_direction: int = 0
@export var upgrade_level: int = 0
@export var strictness: float = 0.7

var products_inspected: int = 0
var products_passed: int = 0
var products_failed: int = 0
var inspection_timer: float = 0.0
var is_inspecting: bool = false
var current_product: Product = null
var input_queue: Array = []

var _base_inspection_time: float = 1.0
var _upgrade_data: Array = []

func _ready() -> void:
	_load_upgrades()

func _load_upgrades() -> void:
	var upgrade_file := FileAccess.open("res://configs/upgrades.json", FileAccess.READ)
	if upgrade_file:
		var json := JSON.new()
		if json.parse(upgrade_file.get_as_text()) == OK:
			var data: Dictionary = json.data
			if data.has("upgrades") and data["upgrades"].has("quality_check"):
				_upgrade_data = data["upgrades"]["quality_check"]
		upgrade_file.close()

func _process(delta: float) -> void:
	if is_inspecting:
		inspection_timer -= delta
		if inspection_timer <= 0.0:
			if current_product != null:
				inspect_product(current_product)
			is_inspecting = false
			current_product = null
		return
	if input_queue.size() > 0:
		current_product = input_queue.pop_front() as Product
		is_inspecting = true
		inspection_timer = get_inspection_time()

func process_product(product: Product) -> void:
	if can_accept_product(product):
		input_queue.append(product)

func inspect_product(product: Product) -> void:
	var quality_score := product.get_total_quality()
	products_inspected += 1
	if quality_score >= get_strictness():
		pass_product(product)
	else:
		fail_product(product)

func pass_product(product: Product) -> void:
	products_passed += 1
	product_passed.emit(product, product.get_total_quality())

func fail_product(product: Product) -> void:
	products_failed += 1
	product.set_quality(0.0)
	product.mark_failed()
	product_failed.emit(product, 0.0)

func get_inspection_time() -> float:
	var speed_mult := 1.0
	if upgrade_level > 0 and upgrade_level <= _upgrade_data.size():
		var level_data: Dictionary = _upgrade_data[upgrade_level - 1]
		speed_mult = float(level_data.get("speed_multiplier", 1.0))
	return _base_inspection_time * speed_mult

func get_strictness() -> float:
	var bonus := 0.0
	if upgrade_level > 0 and upgrade_level <= _upgrade_data.size():
		var level_data: Dictionary = _upgrade_data[upgrade_level - 1]
		bonus = float(level_data.get("quality_bonus", 0.0))
	return maxf(strictness - bonus, 0.1)

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
	return not is_inspecting and input_queue.size() < 3

func get_pass_rate() -> float:
	if products_inspected == 0:
		return 0.0
	return float(products_passed) / float(products_inspected)

func get_queue_length() -> int:
	return input_queue.size()

func _draw() -> void:
	var col := Color(0.61, 0.35, 0.71)
	draw_rect(Rect2(-24, -24, 48, 48), col)
	draw_rect(Rect2(-24, -24, 48, 48), Color.WHITE, false, 1.0)
	draw_string(ThemeDB.fallback_font, Vector2(-12, 4), "QC", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color.WHITE)
	if is_inspecting:
		var progress := 1.0 - (inspection_timer / maxf(get_inspection_time(), 0.01))
		draw_rect(Rect2(-24, 20, 48 * progress, 4), Color.CYAN)
