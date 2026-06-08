class_name OrderSystem
extends Node

signal order_added(order)
signal order_completed(order_id, reward)
signal order_failed(order_id, penalty)
signal order_updated(order_id, progress)
signal all_orders_complete

class Order:
	var id: String
	var product_type: String
	var quantity: int
	var deadline: float
	var time_remaining: float
	var reward_base: int
	var penalty: int
	var min_quality: float
	var quantity_delivered: int
	var is_active: bool
	var is_complete: bool
	var is_failed: bool

	func _init(data: Dictionary = {}) -> void:
		id = str(data.get("id", ""))
		product_type = str(data.get("product_type", "packed"))
		quantity = int(data.get("quantity", 1))
		deadline = float(data.get("deadline_seconds", data.get("deadline", 60.0)))
		time_remaining = deadline
		reward_base = int(data.get("reward_base", data.get("reward", 100)))
		penalty = int(data.get("penalty", 50))
		min_quality = float(data.get("min_quality_required", data.get("min_quality", 0.0)))
		quantity_delivered = 0
		is_active = true
		is_complete = false
		is_failed = false

	func get_progress() -> float:
		if quantity <= 0:
			return 0.0
		return float(quantity_delivered) / float(quantity)

var active_orders: Array[Order] = []
var completed_orders: Array[Order] = []
var failed_orders: Array[Order] = []

func load_orders_for_level(level_id: int) -> void:
	var file_path = "res://configs/orders.json"
	if not FileAccess.file_exists(file_path):
		return
	var file = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return
	var json = JSON.new()
	var err = json.parse(file.get_as_text())
	file.close()
	if err != OK:
		return
	var data = json.data
	if not data is Dictionary:
		return
	if not data.has("orders"):
		return
	var level_key := "level_%d" % level_id
	if not data["orders"].has(level_key):
		return
	var orders_data: Array = data["orders"][level_key]
	for order_data in orders_data:
		if order_data is Dictionary:
			load_order(order_data)

func load_order(order_data: Dictionary) -> Order:
	var order = Order.new(order_data)
	active_orders.append(order)
	order_added.emit(order)
	return order

func add_order(order_data: Dictionary) -> Order:
	return load_order(order_data)

func start_orders() -> void:
	for order in active_orders:
		order.is_active = true

func stop_orders() -> void:
	for order in active_orders:
		order.is_active = false

func update_orders(delta: float) -> void:
	var to_fail: Array[Order] = []
	for order in active_orders:
		if not order.is_active:
			continue
		order.time_remaining -= delta
		if order.time_remaining <= 0.0:
			to_fail.append(order)
			continue
		order_updated.emit(order.id, order.get_progress())
	for order in to_fail:
		fail_order(order)

func update_deadlines(delta: float) -> Array[Order]:
	var expired: Array[Order] = []
	var to_fail: Array[Order] = []
	for order in active_orders:
		if not order.is_active:
			continue
		order.time_remaining -= delta
		if order.time_remaining <= 0.0:
			to_fail.append(order)
			continue
		order_updated.emit(order.id, order.get_progress())
	for order in to_fail:
		fail_order(order)
		expired.append(order)
	return expired

func deliver_product(product_type: String, quality: float) -> bool:
	for order in active_orders:
		if not order.is_active:
			continue
		if order.product_type != product_type:
			continue
		if quality < order.min_quality:
			continue
		order.quantity_delivered += 1
		order_updated.emit(order.id, order.get_progress())
		if order.quantity_delivered >= order.quantity:
			complete_order(order)
		return true
	return false

func find_matching_order(product: Product) -> Order:
	for order in active_orders:
		if not order.is_active:
			continue
		if product.is_finished() and order.product_type == "packed":
			if product.get_total_quality() >= order.min_quality:
				return order
	return null

func complete_order(order: Order) -> void:
	order.is_active = false
	order.is_complete = true
	var idx = active_orders.find(order)
	if idx >= 0:
		active_orders.remove_at(idx)
	completed_orders.append(order)
	order_completed.emit(order.id, order.reward_base)
	if active_orders.is_empty():
		all_orders_complete.emit()

func fail_order(order: Order) -> void:
	order.is_active = false
	order.is_failed = true
	order.time_remaining = 0.0
	var idx = active_orders.find(order)
	if idx >= 0:
		active_orders.remove_at(idx)
	failed_orders.append(order)
	order_failed.emit(order.id, order.penalty)

func get_active_orders() -> Array[Order]:
	return active_orders

func get_active_order_count() -> int:
	return active_orders.size()

func get_order_by_id(id: String) -> Order:
	for order in active_orders:
		if order.id == id:
			return order
	for order in completed_orders:
		if order.id == id:
			return order
	for order in failed_orders:
		if order.id == id:
			return order
	return null

func get_progress() -> Dictionary:
	return {
		"completed": completed_orders.size(),
		"failed": failed_orders.size(),
		"active": active_orders.size()
	}

func reset() -> void:
	active_orders.clear()
	completed_orders.clear()
	failed_orders.clear()
