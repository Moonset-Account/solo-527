class_name EventScheduler
extends Node

signal event_triggered(event: GameEvent)
signal event_logged(event_id: String, message: String)

var _event_pool: Array[GameEvent] = []
var _cooldown_timers: Dictionary = {}
var _event_history: Array[Dictionary] = []
var _unlocked_features: Array[String] = []
var _base_interval: float = 15.0
var _timer: float = 0.0
var _active: bool = false

func setup(events: Array[Dictionary], base_interval: float = 15.0) -> void:
	_event_pool.clear()
	_cooldown_timers.clear()
	_event_history.clear()
	for e_data in events:
		var evt = GameEvent.new(e_data)
		_event_pool.append(evt)
		_cooldown_timers[evt.id] = 0.0
	_base_interval = base_interval
	_timer = _base_interval * 0.5
	_active = true

func unlock_feature(feature: String) -> void:
	if not _unlocked_features.has(feature):
		_unlocked_features.append(feature)

func set_active(active: bool) -> void:
	_active = active

func process_events(delta: float) -> void:
	if not _active:
		return
	for id in _cooldown_timers:
		if _cooldown_timers[id] > 0.0:
			_cooldown_timers[id] -= delta
	_timer -= delta
	if _timer <= 0.0:
		_try_spawn_event()
		_timer = _base_interval * randf_range(0.7, 1.3)

func _try_spawn_event() -> void:
	var candidates: Array[GameEvent] = []
	var weights: Array[float] = []
	for evt in _event_pool:
		if _cooldown_timers.get(evt.id, 0.0) > 0.0:
			continue
		if evt.requires_unlock != "" and not _unlocked_features.has(evt.requires_unlock):
			continue
		candidates.append(evt)
		weights.append(evt.weight)
	if candidates.is_empty():
		return
	var total_weight = 0.0
	for w in weights:
		total_weight += w
	var roll = randf() * total_weight
	var accumulated = 0.0
	var chosen: GameEvent = candidates[0]
	for i in candidates.size():
		accumulated += weights[i]
		if roll <= accumulated:
			chosen = candidates[i]
			break
	_cooldown_timers[chosen.id] = chosen.cooldown
	var log_entry = {
		"event_id": chosen.id,
		"event_name": chosen.event_name,
		"description": chosen.description,
		"target_resource": String(chosen.target_resource),
		"damage": chosen.damage,
		"damage_type": chosen.damage_type,
	}
	_event_history.append(log_entry)
	event_logged.emit(chosen.id, chosen.description)
	event_triggered.emit(chosen)

func get_event_history() -> Array[Dictionary]:
	return _event_history.duplicate(true)

func get_active_event_count() -> int:
	var count = 0
	for id in _cooldown_timers:
		if _cooldown_timers[id] > 0.0:
			count += 1
	return count

func serialize() -> Dictionary:
	return {
		"cooldowns": _cooldown_timers.duplicate(true),
		"history": _event_history.duplicate(true),
		"unlocked": _unlocked_features.duplicate(true),
		"timer": _timer,
		"base_interval": _base_interval,
	}

func deserialize(data: Dictionary) -> void:
	_cooldown_timers = data.get("cooldowns", {})
	_event_history.clear()
	for h in data.get("history", []):
		_event_history.append(h)
	_unlocked_features.clear()
	for u in data.get("unlocked", []):
		_unlocked_features.append(u)
	_timer = data.get("timer", _base_interval * 0.5)
	_base_interval = data.get("base_interval", 15.0)
