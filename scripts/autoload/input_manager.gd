extends Node

signal input_method_changed(method: String)
signal action_pressed(action: String)
signal action_released(action: String)

var current_method: String = "auto"
var _detected_method: String = "keyboard_mouse"
var _touch_active: bool = false
var _drag_active: bool = false
var _drag_target: Node2D = null
var _drag_offset: Vector2 = Vector2.ZERO
var _selected_item: Node2D = null
var _kb_move_speed: float = 200.0
var _kb_item: Node2D = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_detect_initial_input()
	if SaveManager.get_setting("input_method", "auto") != "auto":
		current_method = SaveManager.get_setting("input_method", "auto")
	Input.joy_connection_changed.connect(_on_joy_connection)

func _detect_initial_input() -> void:
	if DisplayServer.is_touchscreen_available():
		_detected_method = "touch"
		current_method = "touch"
	elif Input.get_connected_joypads().size() > 0:
		_detected_method = "gamepad"
	else:
		_detected_method = "keyboard_mouse"

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		if _detected_method != "keyboard_mouse":
			_detected_method = "keyboard_mouse"
			_check_method_change()
	elif event is InputEventMouseButton:
		if _detected_method != "keyboard_mouse":
			_detected_method = "keyboard_mouse"
			_check_method_change()
	elif event is InputEventTouchScreenTouch:
		if _detected_method != "touch":
			_detected_method = "touch"
			_check_method_change()
	elif event is InputEventJoypadButton or event is InputEventJoypadMotion:
		if _detected_method != "gamepad":
			_detected_method = "gamepad"
			_check_method_change()

	if current_method == "auto":
		var effective = _detected_method
		if effective != _last_emitted_method:
			_last_emitted_method = effective
			input_method_changed.emit(effective)
	elif current_method != _last_emitted_method:
		_last_emitted_method = current_method
		input_method_changed.emit(current_method)

var _last_emitted_method: String = ""

func _check_method_change() -> void:
	if current_method == "auto":
		input_method_changed.emit(_detected_method)
	else:
		input_method_changed.emit(current_method)

func _on_joy_connection(_device: int, connected: bool) -> void:
	if connected and current_method == "auto":
		_detected_method = "gamepad"
		_check_method_change()

func get_effective_input_method() -> String:
	if current_method == "auto":
		return _detected_method
	return current_method

func get_action_hint(action: String) -> String:
	var method = get_effective_input_method()
	match method:
		"keyboard_mouse":
			return _get_kb_hint(action)
		"touch":
			return _get_touch_hint(action)
		"gamepad":
			return _get_gamepad_hint(action)
	return action

func _get_kb_hint(action: String) -> String:
	var actions = {
		"move_left": "← / A",
		"move_right": "→ / D",
		"move_up": "↑ / W",
		"move_down": "↓ / S",
		"rotate_cw": "R",
		"rotate_ccw": "E",
		"confirm": "Enter",
		"undo": "Ctrl+Z",
		"pause": "Esc"
	}
	return actions.get(action, action)

func _get_touch_hint(action: String) -> String:
	var actions = {
		"move_left": "Tap",
		"move_right": "Tap",
		"move_up": "Tap",
		"move_down": "Tap",
		"rotate_cw": "Double-tap",
		"rotate_ccw": "Double-tap",
		"confirm": "Release",
		"undo": "2-finger tap",
		"pause": "⚙"
	}
	return actions.get(action, action)

func _get_gamepad_hint(action: String) -> String:
	var actions = {
		"move_left": "D-Pad ←",
		"move_right": "D-Pad →",
		"move_up": "D-Pad ↑",
		"move_down": "D-Pad ↓",
		"rotate_cw": "B / ▢",
		"rotate_ccw": "X / △",
		"confirm": "A / ✕",
		"undo": "Select",
		"pause": "Start"
	}
	return actions.get(action, action)

func remap_action(action: String, keycode_str: String) -> void:
	if not InputMap.has_action(action):
		return
	var keycode = int(keycode_str)
	if keycode == 0:
		return
	InputMap.action_erase_events(action)
	var ev = InputEventKey.new()
	ev.keycode = keycode
	InputMap.action_add_event(action, ev)

func start_drag(target: Node2D, from_pos: Vector2) -> void:
	_drag_target = target
	_drag_offset = target.global_position - from_pos
	_drag_active = true

func update_drag(current_pos: Vector2) -> void:
	if _drag_active and _drag_target and is_instance_valid(_drag_target):
		_drag_target.global_position = current_pos + _drag_offset

func end_drag() -> void:
	_drag_active = false
	_drag_target = null

func is_dragging() -> bool:
	return _drag_active

func select_item(item: Node2D) -> void:
	_selected_item = item
	_kb_item = item
	if item:
		item.set_meta("selected", true)

func deselect_item() -> void:
	if _selected_item and is_instance_valid(_selected_item):
		_selected_item.set_meta("selected", false)
	_selected_item = null
	_kb_item = null

func get_selected_item() -> Node2D:
	return _selected_item

func handle_kb_movement(delta: float) -> void:
	if not _kb_item or not is_instance_valid(_kb_item):
		return
	var dir = Vector2.ZERO
	if Input.is_action_pressed("move_left"):
		dir.x -= 1
	if Input.is_action_pressed("move_right"):
		dir.x += 1
	if Input.is_action_pressed("move_up"):
		dir.y -= 1
	if Input.is_action_pressed("move_down"):
		dir.y += 1
	if dir != Vector2.ZERO:
		_kb_item.global_position += dir.normalized() * _kb_move_speed * delta
