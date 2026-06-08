extends Node

signal input_action_remapped(action: String, event: InputEvent)

var _custom_mappings: Dictionary = {}
var _remap_actions: Array[String] = [
	"ui_up", "ui_down", "ui_left", "ui_right",
	"buy_item", "sell_item", "next_day", "game_pause"
]
var _action_labels: Dictionary = {
	"ui_up": "上移",
	"ui_down": "下移",
	"ui_left": "左移",
	"ui_right": "右移",
	"buy_item": "购买",
	"sell_item": "出售",
	"next_day": "下一天",
	"game_pause": "暂停"
}
var _is_listening: bool = false
var _listening_action: String = ""

func _ready() -> void:
	_load_mappings()

func _input(event: InputEvent) -> void:
	if _is_listening and event is InputEventKey and event.pressed:
		_remap_action(_listening_action, event)
		_is_listening = false
		_listening_action = ""
		get_viewport().set_input_as_handled()

func start_remap(action: String) -> void:
	if action in _remap_actions:
		_is_listening = true
		_listening_action = action

func is_listening() -> bool:
	return _is_listening

func get_listening_action() -> String:
	return _listening_action

func _remap_action(action: String, event: InputEventKey) -> void:
	var old_events: Array[InputEvent] = InputMap.action_get_events(action)
	for old_event in old_events:
		if old_event is InputEventKey:
			InputMap.action_erase_event(action, old_event)
	InputMap.action_add_event(action, event)
	_custom_mappings[action] = {
		"keycode": event.keycode,
		"physical_keycode": event.physical_keycode,
		"shift_pressed": event.shift_pressed,
		"alt_pressed": event.alt_pressed,
		"ctrl_pressed": event.ctrl_pressed
	}
	_save_mappings()
	input_action_remapped.emit(action, event)

func reset_to_defaults() -> void:
	_custom_mappings.clear()
	var default_mappings: Dictionary = {
		"ui_up": {"keycode": 4194320},
		"ui_down": {"keycode": 4194322},
		"ui_left": {"keycode": 4194319},
		"ui_right": {"keycode": 4194321},
		"buy_item": {"keycode": 66},
		"sell_item": {"keycode": 83},
		"next_day": {"keycode": 78},
		"game_pause": {"keycode": 4194305}
	}
	for action in default_mappings:
		var events := InputMap.action_get_events(action)
		for ev in events:
			if ev is InputEventKey:
				InputMap.action_erase_event(action, ev)
		var new_event := InputEventKey.new()
		new_event.keycode = default_mappings[action].keycode
		InputMap.action_add_event(action, new_event)
	_save_mappings()

func get_action_label(action: String) -> String:
	return _action_labels.get(action, action)

func get_remappable_actions() -> Array[String]:
	return _remap_actions

func get_current_key_name(action: String) -> String:
	var events := InputMap.action_get_events(action)
	for event in events:
		if event is InputEventKey:
			if event.keycode != 0:
				return OS.get_keycode_string(event.keycode)
			elif event.physical_keycode != 0:
				return OS.get_keycode_string(event.physical_keycode)
	return "未设置"

func _save_mappings() -> void:
	var settings := SaveSystem.load_settings()
	settings["input_mappings"] = _custom_mappings
	SaveSystem.save_settings(settings)

func _load_mappings() -> void:
	var settings := SaveSystem.load_settings()
	if not settings.has("input_mappings"):
		return
	var mappings = settings.input_mappings
	if not mappings is Dictionary:
		return
	for action in mappings:
		if action not in _remap_actions:
			continue
		var mapping: Dictionary = mappings[action]
		var events := InputMap.action_get_events(action)
		for ev in events:
			if ev is InputEventKey:
				InputMap.action_erase_event(action, ev)
		var new_event := InputEventKey.new()
		if mapping.has("keycode"):
			new_event.keycode = mapping.keycode
		if mapping.has("physical_keycode"):
			new_event.physical_keycode = mapping.physical_keycode
		if mapping.has("shift_pressed"):
			new_event.shift_pressed = mapping.shift_pressed
		if mapping.has("alt_pressed"):
			new_event.alt_pressed = mapping.alt_pressed
		if mapping.has("ctrl_pressed"):
			new_event.ctrl_pressed = mapping.ctrl_pressed
		InputMap.action_add_event(action, new_event)
		_custom_mappings[action] = mapping
