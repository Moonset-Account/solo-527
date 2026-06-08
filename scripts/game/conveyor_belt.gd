class_name ConveyorBelt
extends Node2D

signal product_entered(product: Product)
signal product_exited(product: Product)

@export var direction: int = 0
@export var speed: float = 60.0
@export var grid_position: Vector2i = Vector2i.ZERO
@export var upgrade_level: int = 0

var products_on_belt: Array[Product] = []
var belt_length: float = 64.0

var _upgrade_data: Array = []
var _belt_speed_multiplier: float = 1.0

var _direction_vectors: Dictionary = {
	0: Vector2.RIGHT,
	1: Vector2.DOWN,
	2: Vector2.LEFT,
	3: Vector2.UP,
}

var _direction_arrows: Dictionary = {
	0: "→",
	1: "↓",
	2: "←",
	3: "↑",
}

func _ready() -> void:
	_load_configs()

func _load_configs() -> void:
	var upgrade_file := FileAccess.open("res://configs/upgrades.json", FileAccess.READ)
	if upgrade_file:
		var json := JSON.new()
		if json.parse(upgrade_file.get_as_text()) == OK:
			var data: Dictionary = json.data
			if data.has("upgrades") and data["upgrades"].has("conveyor"):
				_upgrade_data = data["upgrades"]["conveyor"]
		upgrade_file.close()
	_update_belt_speed()

func _update_belt_speed() -> void:
	_belt_speed_multiplier = 1.0
	if upgrade_level > 0 and upgrade_level <= _upgrade_data.size():
		var level_data: Dictionary = _upgrade_data[upgrade_level - 1]
		_belt_speed_multiplier = float(level_data.get("belt_speed_multiplier", 1.0))

func _process(delta: float) -> void:
	var move_speed := get_speed()
	var direction_vector: Vector2 = _direction_vectors.get(direction, Vector2.RIGHT)
	var to_remove: Array[Product] = []
	for product: Product in products_on_belt:
		if not product.is_moving:
			product.is_moving = true
		var offset: Vector2 = direction_vector * move_speed * delta
		product.position += offset
		var belt_start := Vector2(grid_position.x * 64.0, grid_position.y * 64.0)
		var distance := product.position.distance_to(belt_start)
		if distance >= belt_length:
			to_remove.append(product)
	for product: Product in to_remove:
		remove_product(product)
		product_exited.emit(product)

func process_product(product: Product) -> void:
	add_product(product)

func add_product(product: Product) -> void:
	if not has_space():
		return
	product.is_moving = true
	product.current_belt = self
	var belt_start := Vector2(grid_position.x * 64.0, grid_position.y * 64.0)
	product.position = belt_start
	products_on_belt.append(product)
	product_entered.emit(product)

func remove_product(product: Product) -> void:
	var idx := products_on_belt.find(product)
	if idx >= 0:
		products_on_belt.remove_at(idx)
		product.is_moving = false
		product.current_belt = null

func set_direction(dir: int) -> void:
	direction = wrapi(dir, 0, 4)

func get_speed() -> float:
	return speed * _belt_speed_multiplier

func has_space() -> bool:
	return products_on_belt.size() < 2

func get_end_position() -> Vector2:
	var direction_vector: Vector2 = _direction_vectors.get(direction, Vector2.RIGHT)
	var belt_start := Vector2(grid_position.x * 64.0, grid_position.y * 64.0)
	return belt_start + direction_vector * belt_length

func upgrade() -> bool:
	var cost := get_upgrade_cost()
	if cost <= 0:
		return false
	if not GameManager.spend_money(cost):
		return false
	upgrade_level += 1
	_update_belt_speed()
	return true

func get_upgrade_cost() -> int:
	var next_level := upgrade_level + 1
	if next_level < _upgrade_data.size():
		return int(_upgrade_data[next_level].get("cost", -1))
	return -1

func _draw() -> void:
	var col := Color(0.58, 0.58, 0.58)
	draw_rect(Rect2(-24, -24, 48, 48), col)
	draw_rect(Rect2(-24, -24, 48, 48), Color(0.4, 0.4, 0.4), false, 1.0)
	var arrow: String = _direction_arrows.get(direction, "→")
	draw_string(ThemeDB.fallback_font, Vector2(-6, 6), arrow, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, Color.WHITE)
