extends Node
## PlaytestRecorder - 试玩数据记录器
## 记录玩家的用时、失败次数、关键选择、操作序列等

signal event_recorded(event_type: String, data: Dictionary)

const FLUSH_INTERVAL_SECONDS := 30.0

var _session_id: String = ""
var _events: Array = []
var _start_time: float = 0.0
var _key_decisions: Array = []
var _machine_placements: Array = []
var _level_transitions: Array = []
var _last_flush: float = 0.0
var _current_level_start: float = 0.0
var _pause_time: float = 0.0
var _total_paused_time: float = 0.0

func _ready() -> void:
	randomize()
	_session_id = "playtest_%s_%d" % [Time.get_date_string_from_system(), randi()]
	_start_time = Time.get_unix_time_from_system()
	_current_level_start = _start_time
	_last_flush = _start_time
	_connect_signals()
	record_event("session_start", {
		"session_id": _session_id,
		"start_time": _start_time,
		"version": "1.0.0"
	})

func _connect_signals() -> void:
	GameState.order_completed.connect(func(oid):
		record_event("order_completed", {"order_id": oid, "elapsed": get_elapsed_seconds()})
	)
	GameState.order_failed.connect(func(oid):
		record_event("order_failed", {"order_id": oid, "elapsed": get_elapsed_seconds()})
	)
	GameState.machine_placed.connect(_on_machine_placed)
	GameState.machine_upgraded.connect(func(mid, lvl):
		record_event("machine_upgrade", {"machine_id": mid, "new_level": lvl})
	)

func record_event(event_type: String, data: Dictionary = {}) -> void:
	var event: Dictionary = {
		"type": event_type,
		"timestamp": Time.get_unix_time_from_system(),
		"elapsed": get_elapsed_seconds(),
		"money": GameState.money,
		"level": GameState.level,
		"data": data
	}
	_events.append(event)
	event_recorded.emit(event_type, data)
	if _events.size() > 200:
		_flush_to_disk()

func _on_machine_placed(machine_data: Dictionary) -> void:
	var placement: Dictionary = {
		"id": machine_data.get("id"),
		"type": machine_data.get("machine_type"),
		"grid_x": machine_data.get("grid_x"),
		"grid_y": machine_data.get("grid_y"),
		"cost": machine_data.get("base_cost"),
		"time": get_elapsed_seconds()
	}
	_machine_placements.append(placement)
	record_event("machine_placed", placement)

func record_key_decision(decision: String, context: Dictionary = {}) -> void:
	var item: Dictionary = {
		"decision": decision,
		"context": context,
		"time": get_elapsed_seconds(),
		"money": GameState.money,
		"level": GameState.level
	}
	_key_decisions.append(item)
	record_event("key_decision", item)

func record_level_start(level_id: String) -> void:
	_current_level_start = Time.get_unix_time_from_system()
	_level_transitions.append({
		"level": level_id,
		"start": _current_level_start,
		"action": "enter"
	})
	record_event("level_start", {"level_id": level_id})

func record_level_end(level_id: String, result: String, score: int) -> void:
	var elapsed: int = int(Time.get_unix_time_from_system() - _current_level_start)
	_level_transitions.append({
		"level": level_id,
		"end": Time.get_unix_time_from_system(),
		"duration": elapsed,
		"result": result,
		"score": score,
		"action": "exit"
	})
	record_event("level_end", {
		"level_id": level_id,
		"result": result,
		"score": score,
		"duration_seconds": elapsed
	})

func record_ui_click(element_name: String, parent_panel: String = "") -> void:
	record_event("ui_click", {"element": element_name, "panel": parent_panel})

func record_setting_change(setting_key: String, old_value, new_value) -> void:
	record_event("setting_change", {
		"key": setting_key,
		"old": str(old_value),
		"new": str(new_value)
	})

func get_elapsed_seconds() -> int:
	return int(Time.get_unix_time_from_system() - _start_time - _total_paused_time)

func notify_pause() -> void:
	_pause_time = Time.get_unix_time_from_system()

func notify_resume() -> void:
	if _pause_time > 0:
		_total_paused_time += Time.get_unix_time_from_system() - _pause_time
		_pause_time = 0.0

func get_summary() -> Dictionary:
	return {
		"session_id": _session_id,
		"elapsed_seconds": get_elapsed_seconds(),
		"paused_seconds": int(_total_paused_time),
		"money": GameState.money,
		"level": GameState.level,
		"experience": GameState.experience,
		"orders_completed": GameState.total_orders_completed,
		"orders_failed": GameState.total_orders_failed,
		"failure_rate": _safe_div(GameState.total_orders_failed, (GameState.total_orders_completed + GameState.total_orders_failed)),
		"machines_placed_count": _machine_placements.size(),
		"key_decisions_count": _key_decisions.size(),
		"levels_played": _level_transitions.size() / 2,
		"key_decisions": _key_decisions,
		"machine_placements": _machine_placements,
		"level_transitions": _level_transitions,
		"event_count": _events.size()
	}

func _safe_div(a: int, b: int) -> float:
	if b == 0:
		return 0.0
	return float(a) / float(b)

func _flush_to_disk() -> void:
	var full_data: Dictionary = {
		"summary": get_summary(),
		"events": _events
	}
	SaveSystem.save_playtest_data(full_data)
	_last_flush = Time.get_unix_time_from_system()

func export_and_save() -> Dictionary:
	_flush_to_disk()
	return get_summary()

func get_events(filter_type: String = "") -> Array:
	if filter_type.is_empty():
		return _events.duplicate()
	var filtered: Array = []
	for ev in _events:
		if ev.get("type") == filter_type:
			filtered.append(ev)
	return filtered

func _process(delta: float) -> void:
	var now: float = Time.get_unix_time_from_system()
	if now - _last_flush >= FLUSH_INTERVAL_SECONDS:
		_flush_to_disk()

func get_session_id() -> String:
	return _session_id
