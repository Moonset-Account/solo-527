extends Node
## GameState - 全局游戏状态管理器
## 管理金币、等级、当前关卡、机器数据等核心游戏状态

signal money_changed(new_amount: int)
signal level_changed(new_level: int)
signal order_completed(order_id: String)
signal order_failed(order_id: String)
signal machine_placed(machine_data: Dictionary)
signal machine_upgraded(machine_id: String, new_level: int)

const GRID_SIZE := 64
const GRID_COLS := 14
const GRID_ROWS := 8

var money: int = 500
var level: int = 1
var experience: int = 0
var current_level_id: String = "level_1"
var total_orders_completed: int = 0
var total_orders_failed: int = 0
var game_speed: float = 1.0
var is_paused: bool = false
var last_save_timestamp: float = 0.0
var session_start_time: float = 0.0

var machines: Dictionary = {}
var conveyors: Dictionary = {}
var quality_checks: Dictionary = {}
var active_orders: Array = []
var completed_orders_history: Array = []

var _machine_id_counter: int = 0

func _ready() -> void:
	session_start_time = Time.get_unix_time_from_system()
	randomize()

func add_money(amount: int) -> void:
	if amount == 0:
		return
	money += amount
	money_changed.emit(money)
	if amount > 0:
		experience += int(amount * 0.1)
		_check_level_up()

func spend_money(amount: int) -> bool:
	if money >= amount:
		money -= amount
		money_changed.emit(money)
		return true
	return false

func can_afford(amount: int) -> bool:
	return money >= amount

func generate_machine_id() -> String:
	_machine_id_counter += 1
	return "machine_%d_%d" % [Time.get_ticks_msec(), _machine_id_counter]

func add_machine(machine_data: Dictionary) -> String:
	var id: String = machine_data.get("id", generate_machine_id())
	machine_data["id"] = id
	machines[id] = machine_data
	machine_placed.emit(machine_data)
	return id

func remove_machine(machine_id: String) -> void:
	if machines.has(machine_id):
		machines.erase(machine_id)

func get_machine(machine_id: String) -> Dictionary:
	return machines.get(machine_id, {})

func upgrade_machine(machine_id: String) -> bool:
	if not machines.has(machine_id):
		return false
	var machine: Dictionary = machines[machine_id]
	var current_lvl: int = machine.get("level", 1)
	var upgrade_cost: int = _calculate_upgrade_cost(machine, current_lvl)
	if not spend_money(upgrade_cost):
		return false
	machine["level"] = current_lvl + 1
	machine["production_rate"] = float(machine.get("base_rate", 1.0)) * (1.0 + 0.25 * current_lvl)
	machine_upgraded.emit(machine_id, machine["level"])
	return true

func get_upgrade_cost(machine_id: String) -> int:
	if not machines.has(machine_id):
		return 0
	var machine: Dictionary = machines[machine_id]
	return _calculate_upgrade_cost(machine, machine.get("level", 1))

func _calculate_upgrade_cost(machine: Dictionary, current_level: int) -> int:
	var base_cost: int = machine.get("base_cost", 100)
	return int(base_cost * pow(1.6, current_level))

func _check_level_up() -> void:
	var required_xp: int = level * 200
	while experience >= required_xp:
		experience -= required_xp
		level += 1
		level_changed.emit(level)
		required_xp = level * 200

func get_level_progress() -> float:
	var required_xp: int = level * 200
	return float(experience) / float(required_xp) if required_xp > 0 else 0.0

func add_active_order(order: Dictionary) -> void:
	active_orders.append(order)

func remove_active_order(order_id: String, completed: bool) -> void:
	for i in range(active_orders.size() - 1, -1, -1):
		if active_orders[i].get("id") == order_id:
			if completed:
				total_orders_completed += 1
				completed_orders_history.append(active_orders[i])
				order_completed.emit(order_id)
			else:
				total_orders_failed += 1
				order_failed.emit(order_id)
			active_orders.remove_at(i)
			break

func get_active_orders_count() -> int:
	return active_orders.size()

func reset_for_new_level() -> void:
	machines.clear()
	conveyors.clear()
	quality_checks.clear()
	active_orders.clear()
	total_orders_completed = 0
	total_orders_failed = 0

func get_playtime_seconds() -> int:
	return int(Time.get_unix_time_from_system() - session_start_time)

func get_offline_earnings(offline_seconds: int) -> Dictionary:
	var earnings: int = 0
	var orders_simulated: int = 0
	var offline_factor: float = 0.3
	var max_offline_hours: int = 8
	var effective_seconds: int = min(offline_seconds, max_offline_hours * 3600)
	var total_rate: float = 0.0
	for machine in machines.values():
		total_rate += machine.get("production_rate", 0.0)
	if total_rate > 0:
		orders_simulated = int(total_rate * effective_seconds / 30.0 * offline_factor)
		earnings = orders_simulated * 50 * level
	return {
		"seconds": effective_seconds,
		"money": earnings,
		"orders": orders_simulated
	}
