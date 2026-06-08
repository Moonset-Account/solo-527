class_name EventScheduler
extends Node

signal event_triggered(event: NightEvent)
signal night_events_resolved(events: Array[NightEvent])

var _event_pool: Array[NightEvent] = []
var _cooldown_tracker: Dictionary = {}
var _current_night: int = 0
var _max_simultaneous_critical: int = 1
var _max_simultaneous_events: int = 3
var _tutorial_mode: bool = false

func _ready() -> void:
	_build_event_pool()

func _build_event_pool() -> void:
	_event_pool.clear()

	var e1 := NightEvent.new()
	e1.id = "power_surge"
	e1.display_name = "电力浪涌"
	e1.description = "海底电缆异常，电力系统受到冲击"
	e1.severity = NightEvent.Severity.MEDIUM
	e1.affected_system = NightEvent.AffectedSystem.POWER
	e1.power_drain = 15
	e1.weight = 1.0
	e1.cooldown_nights = 2
	e1.min_night = 1
	_event_pool.append(e1)

	var e2 := NightEvent.new()
	e2.id = "oxygen_leak"
	e2.display_name = "氧气泄漏"
	e2.description = "密封舱壁出现裂缝，氧气持续外泄"
	e2.severity = NightEvent.Severity.HIGH
	e2.affected_system = NightEvent.AffectedSystem.OXYGEN
	e2.oxygen_drain = 20
	e2.weight = 0.8
	e2.cooldown_nights = 3
	e2.min_night = 1
	_event_pool.append(e2)

	var e3 := NightEvent.new()
	e3.id = "sonar_interference"
	e3.display_name = "声呐干扰"
	e3.description = "深层洋流产生噪声干扰，声呐效率下降"
	e3.severity = NightEvent.Severity.MEDIUM
	e3.affected_system = NightEvent.AffectedSystem.SONAR
	e3.sonar_drain = 20
	e3.weight = 0.9
	e3.cooldown_nights = 2
	e3.min_night = 2
	e3.requires_sonar = true
	_event_pool.append(e3)

	var e4 := NightEvent.new()
	e4.id = "generator_overload"
	e4.display_name = "发电机过载"
	e4.description = "主发电机温度过高，系统启动保护性降频"
	e4.severity = NightEvent.Severity.HIGH
	e4.affected_system = NightEvent.AffectedSystem.POWER
	e4.power_drain = 25
	e4.weight = 0.6
	e4.cooldown_nights = 4
	e4.min_night = 3
	_event_pool.append(e4)

	var e5 := NightEvent.new()
	e5.id = "hull_breach"
	e5.display_name = "船体裂缝"
	e5.description = "深海压力导致灯塔底部出现裂缝"
	e5.severity = NightEvent.Severity.CRITICAL
	e5.affected_system = NightEvent.AffectedSystem.MULTIPLE
	e5.power_drain = 10
	e5.oxygen_drain = 15
	e5.structure_damage = 20
	e5.weight = 0.3
	e5.cooldown_nights = 5
	e5.min_night = 4
	_event_pool.append(e5)

	var e6 := NightEvent.new()
	e6.id = "sonar_blackout"
	e6.display_name = "声呐盲区"
	e6.description = "声呐阵列完全失灵，无法探测周围环境"
	e6.severity = NightEvent.Severity.CRITICAL
	e6.affected_system = NightEvent.AffectedSystem.SONAR
	e6.sonar_drain = 40
	e6.weight = 0.2
	e6.cooldown_nights = 5
	e6.min_night = 3
	e6.requires_sonar = true
	_event_pool.append(e6)

	var e7 := NightEvent.new()
	e7.id = "storm"
	e7.display_name = "深海风暴"
	e7.description = "猛烈的海底风暴冲击灯塔结构"
	e7.severity = NightEvent.Severity.HIGH
	e7.affected_system = NightEvent.AffectedSystem.MULTIPLE
	e7.power_drain = 10
	e7.oxygen_drain = 10
	e7.sonar_drain = 15
	e7.structure_damage = 10
	e7.weight = 0.5
	e7.cooldown_nights = 3
	e7.min_night = 2
	_event_pool.append(e7)

	var e8 := NightEvent.new()
	e8.id = "oxygen_contamination"
	e8.display_name = "氧气污染"
	e8.description = "循环系统混入有害气体，氧气纯度下降"
	e8.severity = NightEvent.Severity.MEDIUM
	e8.affected_system = NightEvent.AffectedSystem.OXYGEN
	e8.oxygen_drain = 12
	e8.weight = 0.7
	e8.cooldown_nights = 2
	e8.min_night = 1
	_event_pool.append(e8)

	var e9 := NightEvent.new()
	e9.id = "creaking_pressure"
	e9.display_name = "压力异响"
	e9.description = "灯塔结构发出异常声响，需要检查"
	e9.severity = NightEvent.Severity.LOW
	e9.affected_system = NightEvent.AffectedSystem.STRUCTURE
	e9.structure_damage = 8
	e9.weight = 1.2
	e9.cooldown_nights = 1
	e9.min_night = 1
	_event_pool.append(e9)

	var e10 := NightEvent.new()
	e10.id = "tutorial_power_drain"
	e10.display_name = "电力轻微波动"
	e10.description = "发电机输出不稳定，电力轻微下降"
	e10.severity = NightEvent.Severity.LOW
	e10.affected_system = NightEvent.AffectedSystem.POWER
	e10.power_drain = 8
	e10.weight = 1.0
	e10.cooldown_nights = 0
	e10.min_night = 1
	e10.is_tutorial_only = true
	_event_pool.append(e10)

func set_tutorial_mode(enabled: bool) -> void:
	_tutorial_mode = enabled

func tick_cooldowns() -> void:
	var to_remove: Array[String] = []
	for id: String in _cooldown_tracker:
		_cooldown_tracker[id] -= 1
		if _cooldown_tracker[id] <= 0:
			to_remove.append(id)
	for id: String in to_remove:
		_cooldown_tracker.erase(id)

func is_on_cooldown(event_id: String) -> bool:
	return _cooldown_tracker.has(event_id) and _cooldown_tracker[event_id] > 0

func get_available_events(night: int) -> Array[NightEvent]:
	var available: Array[NightEvent] = []
	for evt: NightEvent in _event_pool:
		if _tutorial_mode and not evt.is_tutorial_only:
			continue
		if not _tutorial_mode and evt.is_tutorial_only:
			continue
		if night < evt.min_night:
			continue
		if evt.max_night > 0 and night > evt.max_night:
			continue
		if is_on_cooldown(evt.id):
			continue
		if evt.requires_sonar and night < 2:
			continue
		available.append(evt)
	return available

func select_night_events(night: int) -> Array[NightEvent]:
	_current_night = night
	var available := get_available_events(night)
	if available.is_empty():
		return []

	var weighted_pool: Array[NightEvent] = []
	for evt: NightEvent in available:
		var count := int(evt.weight * 10)
		for i in count:
			weighted_pool.append(evt)

	var selected: Array[NightEvent] = []
	var critical_count := 0
	var num_events := mini(_max_simultaneous_events, 1 + night / 2)
	num_events = maxi(1, mini(num_events, available.size()))

	var rng := RandomNumberGenerator.new()
	rng.randomize()

	for i in num_events:
		if weighted_pool.is_empty():
			break
		var attempts := 0
		while attempts < 20:
			var pick: NightEvent = weighted_pool[rng.randi() % weighted_pool.size()]
			if pick.severity == NightEvent.Severity.CRITICAL and critical_count >= _max_simultaneous_critical:
				attempts += 1
				continue
			if selected.has(pick):
				attempts += 1
				continue
			selected.append(pick)
			if pick.severity == NightEvent.Severity.CRITICAL:
				critical_count += 1
			_cooldown_tracker[pick.id] = pick.cooldown_nights
			weighted_pool = weighted_pool.filter(func(e): return e != pick)
			break

	return selected

func set_difficulty(max_critical: int, max_events: int) -> void:
	_max_simultaneous_critical = max_critical
	_max_simultaneous_events = max_events

func serialize() -> Dictionary:
	return {
		"cooldowns": _cooldown_tracker.duplicate(),
		"current_night": _current_night,
		"tutorial_mode": _tutorial_mode,
	}

func deserialize(data: Dictionary) -> void:
	if data.has("cooldowns"):
		_cooldown_tracker = data["cooldowns"]
	if data.has("current_night"):
		_current_night = data["current_night"]
	if data.has("tutorial_mode"):
		_tutorial_mode = data["tutorial_mode"]
