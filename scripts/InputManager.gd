extends Node

signal drag_started(position: Vector2)
signal drag_moved(position: Vector2)
signal drag_ended(position: Vector2, is_valid_drop: bool)
signal rotate_cw_pressed()
signal rotate_ccw_pressed()
signal undo_pressed()
signal redo_pressed()
signal submit_pressed()
signal pause_pressed()
signal reset_pressed()
signal debug_toggle_pressed()
signal select_next_pressed()
signal select_prev_pressed()
signal touch_pinch_updated(scale: float)

var is_dragging: bool = false
var drag_start_position: Vector2 = Vector2.ZERO
var last_drag_position: Vector2 = Vector2.ZERO
var current_pointer_id: int = -1
var is_touch_mode: bool = false
var pinch_start_distance: float = 0.0
var pinch_initial_rotation: float = 0.0
var active_touches: Dictionary = {}
var last_tap_time: int = 0
const DOUBLE_TAP_THRESHOLD: int = 300
var current_controller: int = -1

func _ready() -> void:
	_check_input_devices()

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		_handle_touch(event)
	elif event is InputEventScreenDrag:
		_handle_screen_drag(event)
	elif event is InputEventMouseButton:
		_handle_mouse_button(event)
	elif event is InputEventMouseMotion:
		_handle_mouse_motion(event)
	elif event is InputEventKey:
		_handle_key(event)
	elif event is InputEventJoypadButton:
		_handle_joypad_button(event)
	elif event is InputEventJoypadMotion:
		_handle_joypad_motion(event)

func _check_input_devices() -> void:
	is_touch_mode = DisplayServer.is_touchscreen_available()
	for i in range(8):
		if Input.is_joypad_connected(i):
			current_controller = i
			break

func _handle_touch(event: InputEventScreenTouch) -> void:
	if event.pressed:
		active_touches[event.index] = event.position
		if active_touches.size() == 1:
			var now: int = Time.get_ticks_msec()
			if now - last_tap_time < DOUBLE_TAP_THRESHOLD:
				rotate_cw_pressed.emit()
			last_tap_time = now
			_start_drag(event.position, event.index)
		elif active_touches.size() == 2:
			_start_pinch()
	else:
		if active_touches.has(event.index):
			active_touches.erase(event.index)
		if active_touches.size() < 2:
			pinch_start_distance = 0.0
		if active_touches.is_empty() and is_dragging:
			_end_drag(event.position, true)

func _handle_screen_drag(event: InputEventScreenDrag) -> void:
	if active_touches.has(event.index):
		active_touches[event.index] = event.position
	if active_touches.size() == 2:
		_update_pinch()
	elif is_dragging and event.index == current_pointer_id:
		_update_drag(event.position)

func _handle_mouse_button(event: InputEventMouseButton) -> void:
	if event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed and not is_dragging:
			_start_drag(event.position, -1)
		elif not event.pressed and is_dragging and current_pointer_id == -1:
			_end_drag(event.position, true)
	elif event.button_index == MOUSE_BUTTON_WHEEL_UP and not event.pressed:
		if Input.is_key_pressed(KEY_SHIFT):
			rotate_ccw_pressed.emit()
		else:
			rotate_cw_pressed.emit()
	elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and not event.pressed:
		if Input.is_key_pressed(KEY_SHIFT):
			rotate_cw_pressed.emit()
		else:
			rotate_ccw_pressed.emit()

func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
	if is_dragging and current_pointer_id == -1:
		_update_drag(event.position)

func _handle_key(event: InputEventKey) -> void:
	if event.echo:
		return
	if not event.pressed:
		return
	match event.physical_keycode:
		KEY_E, KEY_BRACKETRIGHT:
			rotate_cw_pressed.emit()
		KEY_Q, KEY_BRACKETLEFT:
			rotate_ccw_pressed.emit()
		KEY_Z:
			if event.ctrl_pressed and event.shift_pressed:
				redo_pressed.emit()
			elif event.ctrl_pressed:
				undo_pressed.emit()
		KEY_Y:
			if event.ctrl_pressed:
				redo_pressed.emit()
		KEY_SPACE, KEY_ENTER:
			submit_pressed.emit()
		KEY_ESCAPE:
			pause_pressed.emit()
		KEY_R:
			reset_pressed.emit()
		KEY_F1, KEY_TAB:
			if event.shift_pressed or event.meta_pressed:
				debug_toggle_pressed.emit()
		KEY_TAB:
			if event.shift_pressed:
				select_prev_pressed.emit()
			else:
				select_next_pressed.emit()
		KEY_PAGEUP, KEY_LEFTBRACKET:
			select_prev_pressed.emit()
		KEY_PAGEDOWN, KEY_RIGHTBRACKET:
			select_next_pressed.emit()

func _handle_joypad_button(event: InputEventJoypadButton) -> void:
	if not event.pressed:
		return
	current_controller = event.device
	match event.button_index:
		JOY_BUTTON_A, 0:
			submit_pressed.emit()
		JOY_BUTTON_B, 1:
			pause_pressed.emit()
		JOY_BUTTON_X, 2:
			undo_pressed.emit()
		JOY_BUTTON_Y, 3:
			reset_pressed.emit()
		JOY_BUTTON_LEFT_SHOULDER, 4:
			rotate_ccw_pressed.emit()
		JOY_BUTTON_RIGHT_SHOULDER, 5:
			rotate_cw_pressed.emit()
		JOY_BUTTON_BACK, 6:
			pause_pressed.emit()
		JOY_BUTTON_START, 7:
			debug_toggle_pressed.emit()
		JOY_BUTTON_DPAD_UP, 11:
			select_prev_pressed.emit()
		JOY_BUTTON_DPAD_DOWN, 12:
			select_next_pressed.emit()
		JOY_BUTTON_DPAD_LEFT, 13:
			select_prev_pressed.emit()
		JOY_BUTTON_DPAD_RIGHT, 14:
			select_next_pressed.emit()

func _handle_joypad_motion(event: InputEventJoypadMotion) -> void:
	current_controller = event.device

func _start_drag(position: Vector2, pointer_id: int) -> void:
	is_dragging = true
	current_pointer_id = pointer_id
	drag_start_position = position
	last_drag_position = position
	drag_started.emit(position)

func _update_drag(position: Vector2) -> void:
	last_drag_position = position
	drag_moved.emit(position)

func _end_drag(position: Vector2, is_valid: bool) -> void:
	is_dragging = false
	current_pointer_id = -1
	drag_ended.emit(position, is_valid)

func _start_pinch() -> void:
	var positions: Array = active_touches.values()
	if positions.size() >= 2:
		pinch_start_distance = positions[0].distance_to(positions[1])

func _update_pinch() -> void:
	var positions: Array = active_touches.values()
	if positions.size() >= 2 and pinch_start_distance > 0:
		var current_distance: float = positions[0].distance_to(positions[1])
		var scale: float = current_distance / pinch_start_distance
		touch_pinch_updated.emit(scale)
		var angle_diff: float = positions[0].angle_to_point(positions[1])
		if pinch_initial_rotation == 0.0:
			pinch_initial_rotation = angle_diff
		else:
			var delta: float = angle_diff - pinch_initial_rotation
			if abs(delta) > 0.15:
				if delta > 0:
					rotate_cw_pressed.emit()
				else:
					rotate_ccw_pressed.emit()
				pinch_initial_rotation = angle_diff

func get_last_position() -> Vector2:
	return last_drag_position

func simulate_drag(position: Vector2) -> void:
	if not is_dragging:
		_start_drag(position, -2)
	else:
		_update_drag(position)

func simulate_drop(position: Vector2) -> void:
	if is_dragging:
		_end_drag(position, true)
