extends Node

var binding_overrides: Dictionary = {}

func _ready():
	_load_bindings()

func _load_bindings():
	binding_overrides = SaveSystem.get_setting("input_bindings", {})
	for action_name in binding_overrides.keys():
		_apply_binding(action_name, binding_overrides[action_name])

func _apply_binding(action: String, keycode: int):
	var ei: InputEventKey = InputEventKey.new()
	ei.physical_keycode = keycode
	InputMap.action_erase_events(action)
	InputMap.action_add_event(action, ei)

func rebind_action(action: String, new_keycode: int):
	binding_overrides[action] = new_keycode
	_apply_binding(action, new_keycode)
	SaveSystem.set_setting("input_bindings", binding_overrides)

func reset_bindings():
	binding_overrides.clear()
	SaveSystem.set_setting("input_bindings", binding_overrides)
	for act in get_default_keys().keys():
		var keys: Array = get_default_keys()[act]
		InputMap.action_erase_events(act)
		for k in keys:
			var ei: InputEventKey = InputEventKey.new()
			ei.physical_keycode = k
			InputMap.action_add_event(act, ei)

func get_action_display(action: String) -> String:
	var events: Array = InputMap.action_get_events(action)
	if events.size() == 0:
		return "(无)"
	var ev: InputEvent = events[0]
	if ev is InputEventKey:
		return OS.get_keycode_string((ev as InputEventKey).physical_keycode)
	return events[0].as_text()

func get_default_keys() -> Dictionary:
	return {
		"move_up": [KEY_W, KEY_UP],
		"move_down": [KEY_S, KEY_DOWN],
		"move_left": [KEY_A, KEY_LEFT],
		"move_right": [KEY_D, KEY_RIGHT],
		"confirm": [KEY_SPACE, KEY_ENTER],
		"cancel": [KEY_ESCAPE, KEY_BACKSPACE],
		"end_turn": [KEY_E],
		"pause": [KEY_ESCAPE],
		"skill_1": [KEY_1],
		"skill_2": [KEY_2],
		"skill_3": [KEY_3]
	}
