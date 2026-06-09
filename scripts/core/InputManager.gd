extends Node

const DEFAULT_MAPPINGS := {
	"ui_accept": [
		{"type": "key", "keycode": KEY_SPACE},
		{"type": "key", "keycode": KEY_ENTER}
	],
	"ui_cancel": [
		{"type": "key", "keycode": KEY_ESCAPE}
	],
	"game_pause": [
		{"type": "key", "keycode": KEY_ESCAPE}
	],
	"game_hint": [
		{"type": "key", "keycode": KEY_H}
	],
	"game_submit": [
		{"type": "key", "keycode": KEY_ENTER}
	],
	"ui_left": [
		{"type": "key", "keycode": KEY_LEFT}
	],
	"ui_right": [
		{"type": "key", "keycode": KEY_RIGHT}
	],
	"ui_up": [
		{"type": "key", "keycode": KEY_UP}
	],
	"ui_down": [
		{"type": "key", "keycode": KEY_DOWN}
	]
}

var current_mappings: Dictionary = {}
var action_callbacks: Dictionary = {}
var rebinding_action: String = ""
var rebinding_listener: Callable

func _ready() -> void:
	_load_mappings()
	_apply_mappings_to_input_map()

func _load_mappings() -> void:
	var saved: Dictionary = SaveManager.get_setting("input.key_mappings", {})
	current_mappings = DEFAULT_MAPPINGS.duplicate(true)
	for action in saved.keys():
		current_mappings[action] = saved[action]

func _save_mappings() -> void:
	SaveManager.set_setting("input.key_mappings", current_mappings)

func _apply_mappings_to_input_map() -> void:
	for action in current_mappings.keys():
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		var events: Array = InputMap.action_get_events(action)
		for e in events:
			InputMap.action_erase_event(action, e)
		var mappings: Array = current_mappings.get(action, [])
		for m in mappings:
			var event := _create_event_from_mapping(m)
			if event:
				InputMap.action_add_event(action, event)

func _create_event_from_mapping(mapping: Dictionary) -> InputEvent:
	var type: String = mapping.get("type", "key")
	match type:
		"key":
			var event := InputEventKey.new()
			event.keycode = int(mapping.get("keycode", 0))
			event.physical_keycode = int(mapping.get("physical_keycode", int(mapping.get("keycode", 0))))
			return event
		"mouse_button":
			var event := InputEventMouseButton.new()
			event.button_index = int(mapping.get("button_index", 1))
			return event
		"joypad":
			var event := InputEventJoypadButton.new()
			event.button_index = int(mapping.get("button_index", 0))
			return event
	return null

func get_action_mappings(action: String) -> Array:
	return current_mappings.get(action, []).duplicate()

func set_action_mapping(action: String, mappings: Array) -> void:
	current_mappings[action] = mappings.duplicate()
	_save_mappings()
	_apply_mappings_to_input_map()

func reset_action_to_default(action: String) -> void:
	if DEFAULT_MAPPINGS.has(action):
		current_mappings[action] = DEFAULT_MAPPINGS[action].duplicate(true)
		_save_mappings()
		_apply_mappings_to_input_map()

func reset_all_to_default() -> void:
	current_mappings = DEFAULT_MAPPINGS.duplicate(true)
	_save_mappings()
	_apply_mappings_to_input_map()

func start_rebinding(action: String, listener: Callable) -> void:
	rebinding_action = action
	rebinding_listener = listener

func cancel_rebinding() -> void:
	rebinding_action = ""
	rebinding_listener = Callable()

func is_rebinding() -> bool:
	return not rebinding_action.is_empty()

func _unhandled_input(event: InputEvent) -> void:
	if not rebinding_action.is_empty():
		if event is InputEventKey and event.pressed and not event.echo:
			var mapping := {"type": "key", "keycode": int(event.keycode), "physical_keycode": int(event.physical_keycode)}
			_finish_rebinding(mapping, _keycode_to_string(int(event.physical_keycode)))
		elif event is InputEventMouseButton and event.pressed:
			var mapping := {"type": "mouse_button", "button_index": int(event.button_index)}
			_finish_rebinding(mapping, "鼠标按键 %d" % int(event.button_index))

func _finish_rebinding(mapping: Dictionary, display: String) -> void:
	if rebinding_listener.is_valid():
		rebinding_listener.call(mapping, display)
	rebinding_action = ""
	rebinding_listener = Callable()

func _keycode_to_string(keycode: int) -> String:
	var key_names: Dictionary = {
		KEY_SPACE: "Space",
		KEY_ENTER: "Enter",
		KEY_ESCAPE: "Esc",
		KEY_TAB: "Tab",
		KEY_BACKSPACE: "Backspace",
		KEY_DELETE: "Delete",
		KEY_INSERT: "Insert",
		KEY_HOME: "Home",
		KEY_END: "End",
		KEY_PAGEUP: "PageUp",
		KEY_PAGEDOWN: "PageDown",
		KEY_UP: "↑",
		KEY_DOWN: "↓",
		KEY_LEFT: "←",
		KEY_RIGHT: "→",
		KEY_SHIFT: "Shift",
		KEY_CTRL: "Ctrl",
		KEY_ALT: "Alt",
		KEY_META: "Meta",
		KEY_CAPSLOCK: "CapsLock",
		KEY_NUMLOCK: "NumLock",
		KEY_SCROLLLOCK: "ScrollLock",
		KEY_PRINT: "PrintScreen",
		KEY_PAUSE: "Pause",
		KEY_KP_ENTER: "NP Enter",
		KEY_F1: "F1", KEY_F2: "F2", KEY_F3: "F3", KEY_F4: "F4",
		KEY_F5: "F5", KEY_F6: "F6", KEY_F7: "F7", KEY_F8: "F8",
		KEY_F9: "F9", KEY_F10: "F10", KEY_F11: "F11", KEY_F12: "F12"
	}
	if key_names.has(keycode):
		return key_names[keycode]
	if keycode >= KEY_A and keycode <= KEY_Z:
		return char(KEY_A + (keycode - KEY_A) + 32).to_upper()
	if keycode >= KEY_0 and keycode <= KEY_9:
		return str(keycode - KEY_0)
	if keycode >= KEY_KP_0 and keycode <= KEY_KP_9:
		return "NP %d" % (keycode - KEY_KP_0)
	return "Key 0x%x" % keycode

func register_action_callback(action: String, callback: Callable) -> void:
	if not action_callbacks.has(action):
		action_callbacks[action] = []
	action_callbacks[action].append(callback)

func unregister_action_callback(action: String, callback: Callable) -> void:
	if action_callbacks.has(action):
		action_callbacks[action].erase(callback)

func _process(_delta: float) -> void:
	for action in action_callbacks.keys():
		if Input.is_action_just_pressed(action):
			var callbacks: Array = action_callbacks[action]
			for cb in callbacks:
				cb.call()

func get_action_display(action: String) -> String:
	var mappings: Array = get_action_mappings(action)
	if mappings.is_empty():
		return "无"
	var primary: Dictionary = mappings[0]
	var type: String = primary.get("type", "key")
	match type:
		"key":
			return _keycode_to_string(int(primary.get("physical_keycode", int(primary.get("keycode", 0)))))
		"mouse_button":
			return "鼠标 %d" % int(primary.get("button_index", 0))
		"joypad":
			return "手柄 %d" % int(primary.get("button_index", 0))
	return "无"

func get_all_actions() -> Array:
	return current_mappings.keys()
