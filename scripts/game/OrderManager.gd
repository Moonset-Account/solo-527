extends Node
## OrderManager - 订单系统
## 生成订单、计时、完成判定、奖励发放

const DP := preload("res://scripts/data/DataProvider.gd")

signal order_added(order: Dictionary)
signal order_removed(order_id: String, completed: bool, reward: int)
signal order_progress_updated(order_id: String, progress: float)
signal order_time_warning(order_id: String)

@export var spawn_interval_min: float = 12.0
@export var spawn_interval_max: float = 20.0
@export var max_concurrent: int = 3

var level_id: String = "level_1"
var order_spawn_timer: float = 0.0
var next_spawn_time: float = 15.0
var total_orders_generated: int = 0
var total_orders_completed_here: int = 0
var total_orders_failed_here: int = 0
var consecutive_completed: int = 0
var has_quality_in_line: bool = false
var warning_notified: Dictionary = {}

func setup_for_level(level_cfg: Dictionary) -> void:
	level_id = level_cfg.get("id", "level_1")
	var interval: Array = level_cfg.get("order_spawn_interval", [12, 20])
	spawn_interval_min = float(interval[0])
	spawn_interval_max = float(interval[1])
	max_concurrent = level_cfg.get("max_concurrent_orders", 3)
	order_spawn_timer = 0.0
	next_spawn_time = 3.0
	total_orders_generated = 0
	total_orders_completed_here = 0
	total_orders_failed_here = 0
	warning_notified.clear()
	_schedule_next_spawn()

func _schedule_next_spawn() -> void:
	next_spawn_time = randf_range(spawn_interval_min, spawn_interval_max)

func _process(delta: float) -> void:
	if GameState.is_paused:
		return
	var dt := delta * GameState.game_speed
	order_spawn_timer += dt
	if order_spawn_timer >= next_spawn_time:
		order_spawn_timer = 0.0
		_try_spawn_order()
		_schedule_next_spawn()
	_update_active_orders(dt)

func _try_spawn_order() -> void:
	if GameState.get_active_orders_count() >= max_concurrent:
		return
	var new_order: Dictionary = DP.generate_random_order(level_id)
	if new_order.is_empty():
		return
	GameState.add_active_order(new_order)
	total_orders_generated += 1
	order_added.emit(new_order)
	AudioManager.play_sfx("order_new")

func _update_active_orders(dt: float) -> void:
	for i in range(GameState.active_orders.size() - 1, -1, -1):
		var order: Dictionary = GameState.active_orders[i]
		if order.get("is_completed", false) or order.get("is_failed", false):
			continue
		var rt: float = order.get("remaining_time", 0) - dt
		order["remaining_time"] = max(rt, 0.0)
		var tlimit: float = order.get("time_limit", 60)
		var frac: float = rt / max(tlimit, 1)
		if frac < 0.25 and not warning_notified.get(order["id"], false):
			order_time_warning.emit(order["id"])
			warning_notified[order["id"]] = true
			AudioManager.play_sfx("warning")
		if rt <= 0.0:
			_fail_order(order)

func deliver_product(product_type_name: String) -> bool:
	var consumed: bool = false
	for order in GameState.active_orders:
		if order.get("is_completed", false) or order.get("is_failed", false):
			continue
		for req in order.get("requirements", []):
			if req["type"] == product_type_name:
				var cur: int = order["current_progress"].get(req["type"], 0)
				if cur < req["count"]:
					order["current_progress"][req["type"]] = cur + 1
					consumed = true
					_emit_progress(order)
					if _check_order_completed(order):
						_complete_order(order)
					return consumed
	return consumed

func _emit_progress(order: Dictionary) -> void:
	var total_needed: int = 0
	var total_done: int = 0
	for req in order.get("requirements", []):
		total_needed += req["count"]
		total_done += order["current_progress"].get(req["type"], 0)
	var p: float = float(total_done) / float(max(total_needed, 1))
	order_progress_updated.emit(order["id"], p)

func _check_order_completed(order: Dictionary) -> bool:
	for req in order.get("requirements", []):
		var cur: int = order["current_progress"].get(req["type"], 0)
		if cur < req["count"]:
			return false
	return true

func _complete_order(order: Dictionary) -> void:
	order["is_completed"] = true
	var reward: int = DP.calculate_order_reward(order, has_quality_in_line)
	var xp: int = order.get("xp_bonus", 10)
	GameState.add_money(reward)
	GameState.experience += xp
	consecutive_completed += 1
	total_orders_completed_here += 1
	GameState.remove_active_order(order["id"], true)
	order_removed.emit(order["id"], true, reward)
	AudioManager.play_sfx("coin")
	PlaytestRecorder.record_event("order_complete", {
		"order_id": order["id"],
		"template": order.get("template_id"),
		"reward": reward,
		"time_left": order.get("remaining_time", 0)
	})

func _fail_order(order: Dictionary) -> void:
	order["is_failed"] = true
	consecutive_completed = 0
	GameState.remove_active_order(order["id"], false)
	order_removed.emit(order["id"], false, 0)
	AudioManager.play_sfx("warning")
	PlaytestRecorder.record_event("order_fail", {
		"order_id": order["id"],
		"template": order.get("template_id")
	})

func set_has_quality(has: bool) -> void:
	has_quality_in_line = has

func get_summary() -> Dictionary:
	return {
		"generated": total_orders_generated,
		"completed": total_orders_completed_here,
		"failed": total_orders_failed_here,
		"consecutive": consecutive_completed
	}
