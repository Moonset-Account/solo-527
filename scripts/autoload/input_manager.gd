extends Node

signal action_remapped(action, old_key, new_key)

const MAPPINGS_PATH = "user://input_mappings.json"

var _default_mappings: Dictionary = {
	"place_machine": KEY_P,
	"remove_machine": KEY_R,
	"rotate_belt": KEY_T,
	"open_shop": KEY_B,
	"toggle_pause": KEY_ESCAPE,
	"speed_up": KEY_SPACE,
	"confirm": KEY_ENTER,
	"cancel": KEY_ESCAPE,
	"move_up": KEY_W,
	"move_down": KEY_S,
	"move_left": KEY_A,
	"move_right": KEY_D,
}

var _current_mappings: Dictionary = {}

func _ready() -> void:
	_current_mappings = _default_mappings.duplicate()
	load_mappings()

func remap_action(action_name: String, new_keycode: int) -> void:
	if not _current_mappings.has(action_name):
		return
	var old_key: int = _current_mappings[action_name]
	_current_mappings[action_name] = new_keycode
	action_remapped.emit(action_name, old_key, new_keycode)
	_apply_action_to_input_map(action_name, old_key, new_keycode)

func reset_to_defaults() -> void:
	_current_mappings = _default_mappings.duplicate()
	for action in _current_mappings:
		if InputMap.has_action(action):
			InputMap.action_erase_events(action)
			var event = InputEventKey.new()
			event.keycode = _current_mappings[action]
			InputMap.action_add_event(action, event)
	save_mappings()

func get_key_for_action(action: String) -> Key:
	return _current_mappings.get(action, KEY_NONE) as Key

func get_all_mappings() -> Dictionary:
	return _current_mappings.duplicate()

func get_all_actions() -> Array:
	return _current_mappings.keys()

func save_mappings() -> void:
	var file = FileAccess.open(MAPPINGS_PATH, FileAccess.WRITE)
	if file == null:
		return
	var serializable: Dictionary = {}
	for key in _current_mappings:
		serializable[key] = _current_mappings[key]
	file.store_string(JSON.stringify(serializable))
	file.close()

func load_mappings() -> void:
	if not FileAccess.file_exists(MAPPINGS_PATH):
		return
	var file = FileAccess.open(MAPPINGS_PATH, FileAccess.READ)
	if file == null:
		return
	var json_string = file.get_as_text()
	file.close()
	var json = JSON.new()
	var error = json.parse(json_string)
	if error != OK:
		return
	var loaded: Dictionary = json.data
	for key in loaded:
		if _current_mappings.has(key):
			_current_mappings[key] = int(loaded[key])

func _apply_action_to_input_map(action: String, old_keycode: int, new_keycode: int) -> void:
	if not InputMap.has_action(action):
		return
	var old_event = InputEventKey.new()
	old_event.keycode = old_keycode
	InputMap.action_erase_event(action, old_event)
	var new_event = InputEventKey.new()
	new_event.keycode = new_keycode
	InputMap.action_add_event(action, new_event)
