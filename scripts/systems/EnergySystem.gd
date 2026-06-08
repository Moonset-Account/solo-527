extends Node
## 能量系统 - 玩家扫描和活动消耗能量

signal energy_low_warning()
signal energy_critical()
signal energy_recharged()

var max_energy: float = 100.0
var current_energy: float = 100.0

const SCAN_COST_PER_SECOND := 15.0
const IDLE_REGEN_RATE := 3.0
const CROUCH_REGEN_MULTIPLIER := 2.0
const MOVE_REGEN_PENALTY := 0.5
const LOW_ENERGY_THRESHOLD := 25.0
const CRITICAL_ENERGY_THRESHOLD := 10.0
const WARN_COOLDOWN := 2.0

var _low_warned: bool = false
var _crit_warned: bool = false
var _last_warn_time: float = 0.0

var is_scanning: bool = false
var is_crouching: bool = false
var is_moving: bool = false

func _ready() -> void:
	current_energy = max_energy
	_emit_energy_changed()

func _process(delta: float) -> void:
	_update_energy(delta)
	_check_warnings()

func start_scan() -> bool:
	if current_energy < CRITICAL_ENERGY_THRESHOLD:
		EventBus.emit_ui_toast("能量不足，无法启动扫描！", 1.5)
		EventBus.emit_sfx_play("energy_low")
		return false
	if current_energy < 1.0:
		return false
	is_scanning = true
	return true

func stop_scan() -> void:
	is_scanning = false

func update_states(crouch: bool, moving: bool) -> void:
	is_crouching = crouch
	is_moving = moving

func consume_energy(amount: float) -> bool:
	if current_energy < amount:
		return false
	current_energy = max(0.0, current_energy - amount)
	_emit_energy_changed()
	return true

func recharge_energy(amount: float) -> void:
	var before := current_energy
	current_energy = min(max_energy, current_energy + amount)
	if before < max_energy and current_energy >= max_energy:
		energy_recharged.emit()
	_emit_energy_changed()

func set_max_energy(new_max: float) -> void:
	max_energy = max(1.0, new_max)
	current_energy = min(current_energy, max_energy)
	_emit_energy_changed()

func reset() -> void:
	current_energy = max_energy
	_low_warned = false
	_crit_warned = false
	_emit_energy_changed()

func _update_energy(delta: float) -> void:
	if is_scanning:
		consume_energy(SCAN_COST_PER_SECOND * delta)
		if current_energy <= 0.0:
			stop_scan()
			EventBus.emit_energy_depleted()
			EventBus.emit_scan_canceled()
			return
	else:
		var regen_rate := IDLE_REGEN_RATE
		if is_crouching:
			regen_rate *= CROUCH_REGEN_MULTIPLIER
		if is_moving:
			regen_rate *= MOVE_REGEN_PENALTY
		recharge_energy(regen_rate * delta)

func _check_warnings() -> void:
	var time_now := Time.get_ticks_msec() / 1000.0
	if current_energy <= CRITICAL_ENERGY_THRESHOLD and not _crit_warned:
		_crit_warned = true
		_low_warned = true
		energy_critical.emit()
		if time_now - _last_warn_time > WARN_COOLDOWN:
			EventBus.emit_sfx_play("energy_low")
			EventBus.emit_ui_toast("警告：能量即将耗尽！", 2.0)
			_last_warn_time = time_now
	elif current_energy <= LOW_ENERGY_THRESHOLD and not _low_warned:
		_low_warned = true
		energy_low_warning.emit()
		if time_now - _last_warn_time > WARN_COOLDOWN:
			EventBus.emit_sfx_play("energy_low")
			EventBus.emit_ui_toast("能量不足，请蹲伏恢复", 2.0)
			_last_warn_time = time_now
	elif current_energy > LOW_ENERGY_THRESHOLD:
		_low_warned = false
		_crit_warned = false

func _emit_energy_changed() -> void:
	EventBus.emit_energy_changed(current_energy, max_energy)
