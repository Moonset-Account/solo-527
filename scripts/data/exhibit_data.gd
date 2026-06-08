class_name ExhibitData
extends RefCounted

enum ExhibitState { INTACT, DAMAGED, CRITICAL, DESTROYED, REPAIRED }

var exhibit_name: String = ""
var exhibit_type: String = ""
var max_hp: int = 5
var current_hp: int = 5
var hidden_damage: int = 0
var state: ExhibitState = ExhibitState.DAMAGED
var is_hidden_damage_revealed: bool = false
var decay_rate: int = 1
var is_stabilized: bool = false
var skip_next_event: bool = false

func take_damage(amount: int) -> void:
	current_hp = maxi(0, current_hp - amount)
	_update_state()

func heal(amount: int) -> void:
	current_hp = mini(max_hp, current_hp + amount)
	_update_state()

func apply_hidden_damage() -> void:
	if hidden_damage > 0 and not is_hidden_damage_revealed:
		take_damage(hidden_damage)
		is_hidden_damage_revealed = true

func reveal_hidden_damage() -> void:
	is_hidden_damage_revealed = true

func apply_decay() -> void:
	if is_stabilized:
		is_stabilized = false
		return
	take_damage(decay_rate)

func stabilize() -> void:
	is_stabilized = true

func set_skip_next_event() -> void:
	skip_next_event = true

func _update_state() -> void:
	if current_hp <= 0:
		state = ExhibitState.DESTROYED
	elif current_hp >= max_hp:
		state = ExhibitState.REPAIRED
	elif current_hp <= max_hp * 0.3:
		state = ExhibitState.CRITICAL
	else:
		state = ExhibitState.DAMAGED

func get_hp_ratio() -> float:
	if max_hp <= 0:
		return 0.0
	return float(current_hp) / float(max_hp)

func get_state_text() -> String:
	match state:
		ExhibitState.INTACT:
			return "完好"
		ExhibitState.DAMAGED:
			return "损坏"
		ExhibitState.CRITICAL:
			return "危急"
		ExhibitState.DESTROYED:
			return "毁坏"
		ExhibitState.REPAIRED:
			return "已修复"
		_:
			return "未知"

func get_state_color() -> Color:
	match state:
		ExhibitState.INTACT, ExhibitState.REPAIRED:
			return Color(0.3, 0.8, 0.3)
		ExhibitState.DAMAGED:
			return Color(0.9, 0.7, 0.2)
		ExhibitState.CRITICAL:
			return Color(0.9, 0.3, 0.2)
		ExhibitState.DESTROYED:
			return Color(0.5, 0.1, 0.1)
		_:
			return Color.WHITE

func duplicate_data() -> ExhibitData:
	var copy = ExhibitData.new()
	copy.exhibit_name = exhibit_name
	copy.exhibit_type = exhibit_type
	copy.max_hp = max_hp
	copy.current_hp = current_hp
	copy.hidden_damage = hidden_damage
	copy.state = state
	copy.is_hidden_damage_revealed = is_hidden_damage_revealed
	copy.decay_rate = decay_rate
	copy.is_stabilized = is_stabilized
	copy.skip_next_event = skip_next_event
	return copy
