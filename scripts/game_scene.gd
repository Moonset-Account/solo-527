extends Node2D

var _box: StaticBody2D = null
var _hud: CanvasLayer = null
var _feedback: Node2D = null
var _items: Array[RigidBody2D] = []
var _spawned_count: int = 0
var _level_config: Dictionary = {}
var _dragging: bool = false
var _dragged_item: RigidBody2D = null
var _touch_id: int = -1
var _double_tap_timer: float = 0.0
var _double_tap_item: RigidBody2D = null
var _two_finger_timer: float = 0.0
var _two_finger_count: int = 0
var _camera: Camera2D = null
var _pause_overlay: CanvasLayer = null
var _settle_timer: float = 0.0
var _is_settling: bool = false
var _settle_item: RigidBody2D = null

func _ready() -> void:
	_setup_camera()
	_hud = CanvasLayer.new()
	_hud.name = "HUD"
	_hud.set_script(load("res://scripts/hud.gd"))
	add_child(_hud)
	_hud.undo_pressed.connect(_on_undo)
	_hud.pause_pressed.connect(_on_pause)
	_hud.complete_pressed.connect(_on_complete)
	_pause_overlay = CanvasLayer.new()
	_pause_overlay.name = "PauseOverlay"
	_pause_overlay.set_script(load("res://scripts/pause_overlay.gd"))
	add_child(_pause_overlay)
	_feedback = Node2D.new()
	_feedback.name = "Feedback"
	_feedback.set_script(load("res://scripts/feedback_system.gd"))
	add_child(_feedback)
	GameManager.level_started.connect(_on_level_started)
	GameManager.fragile_damaged.connect(_on_fragile_damaged)
	if GameManager.has_meta("load_save_slot"):
		var slot = GameManager.get_meta("load_save_slot")
		GameManager.remove_meta("load_save_slot")
		_load_from_save(slot)
	elif GameManager.current_level_id != "":
		_load_level(GameManager.current_level_id)

func _setup_camera() -> void:
	_camera = Camera2D.new()
	_camera.name = "Camera"
	_camera.zoom = Vector2(1, 1)
	_camera.position = Vector2(0, 0)
	_camera.enabled = true
	_camera.make_current()
	add_child(_camera)

func _on_level_started(level_id: String) -> void:
	_load_level(level_id)

func _load_level(level_id: String) -> void:
	_clear_level()
	_level_config = LevelConfig.load_level(level_id)
	if _level_config.is_empty():
		return
	_box = StaticBody2D.new()
	_box.name = "BoxContainer"
	_box.set_script(load("res://scripts/box_container.gd"))
	_box.position = Vector2(100, 0)
	add_child(_box)
	_box.setup(_level_config)
	_box.item_entered_box.connect(_on_item_entered)
	_box.item_exited_box.connect(_on_item_exited)
	_box.weight_warning.connect(_on_weight_warning)
	_box.box_overflow.connect(_on_overflow)
	_spawn_items()
	if _hud:
		_hud.set_level_name(_level_config.get("name", level_id))
		_hud._update_hints(InputManager.get_effective_input_method())

func _load_from_save(slot: int) -> void:
	var data = SaveManager.load_game_slot(slot)
	if data.is_empty():
		return
	_clear_level()
	var level_id = data.get("level_id", "level_01")
	_level_config = LevelConfig.load_level(level_id)
	if _level_config.is_empty():
		return
	_box = StaticBody2D.new()
	_box.name = "BoxContainer"
	_box.set_script(load("res://scripts/box_container.gd"))
	_box.position = Vector2(100, 0)
	add_child(_box)
	_box.setup(_level_config)
	_box.item_entered_box.connect(_on_item_entered)
	_box.item_exited_box.connect(_on_item_exited)
	_box.weight_warning.connect(_on_weight_warning)
	_box.box_overflow.connect(_on_overflow)
	GameManager.current_level_id = level_id
	GameManager.current_score = data.get("score", 0)
	GameManager.level_time = data.get("time", 0.0)
	GameManager.fragile_broken_count = data.get("fragile_broken_count", 0)
	GameManager.undo_stack = data.get("undo_stack", [])
	GameManager.is_level_active = true
	GameManager.is_paused = false
	GameManager.state = GameManager.GameState.PLAYING
	GameManager.items_in_box.clear()
	var all_items_data = data.get("all_items", [])
	var items_config = _level_config.get("items", [])
	_spawned_count = items_config.size()
	for item_state in all_items_data:
		var config_match = _find_config_for_item(items_config, item_state.get("item_id", ""))
		if config_match.is_empty():
			config_match = item_state.duplicate()
		var item = RigidBody2D.new()
		item.set_script(load("res://scripts/item.gd"))
		item.setup(config_match)
		add_child(item)
		item.global_position = Vector2(item_state.get("position", {}).get("x", 0), item_state.get("position", {}).get("y", 0))
		item.global_rotation = item_state.get("rotation", 0.0)
		item.damage_amount = item_state.get("damage", 0.0)
		if item_state.get("in_box", false):
			item.is_placed = true
			item.freeze = true
			item.gravity_scale = 0.0
			item.set_meta("in_box", true)
			item.add_to_group("packed_items")
			GameManager.items_in_box.append(item)
		else:
			item.freeze = true
			item.gravity_scale = 0.0
		if item.damage_amount > 0 and item.is_fragile:
			item._update_crack_visual()
		_items.append(item)
	if _hud:
		_hud.set_level_name(_level_config.get("name", level_id))

func _find_config_for_item(items_config: Array, item_id: String) -> Dictionary:
	for cfg in items_config:
		if cfg.get("id", "") == item_id:
			return cfg
	return {}

func _spawn_items() -> void:
	var items_data = _level_config.get("items", [])
	var spawn_positions = _level_config.get("spawn_positions", [])
	for i in items_data.size():
		var item_data = items_data[i]
		var item = RigidBody2D.new()
		item.set_script(load("res://scripts/item.gd"))
		item.setup(item_data)
		if i < spawn_positions.size():
			item.global_position = Vector2(spawn_positions[i].get("x", -400), spawn_positions[i].get("y", 0))
		else:
			item.global_position = Vector2(-400 + (i % 3) * 60, -150 + (i / 3) * 80)
		add_child(item)
		_items.append(item)
	_spawned_count = items_data.size()

func _clear_level() -> void:
	for item in _items:
		if is_instance_valid(item):
			item.queue_free()
	_items.clear()
	if _box and is_instance_valid(_box):
		_box.queue_free()
	_box = null
	_dragging = false
	_dragged_item = null
	_is_settling = false
	_settle_item = null

func _process(delta: float) -> void:
	if not GameManager.is_level_active or GameManager.is_paused:
		return
	SaveManager.update_play_time(delta)
	InputManager.handle_kb_movement(delta)
	if _double_tap_timer > 0:
		_double_tap_timer -= delta
		if _double_tap_timer <= 0:
			_double_tap_item = null
	if _two_finger_timer > 0:
		_two_finger_timer -= delta
		if _two_finger_timer <= 0 and _two_finger_count >= 2:
			_on_undo()
			_two_finger_count = 0
	if _is_settling and _settle_item and is_instance_valid(_settle_item):
		_settle_timer -= delta
		if _settle_item.freeze or _settle_item.linear_velocity.length() < 3.0 or _settle_timer <= 0:
			_finalize_placement(_settle_item)
			_is_settling = false
			_settle_item = null
	if Input.is_action_just_pressed("rotate_cw"):
		_handle_rotate(true)
	if Input.is_action_just_pressed("rotate_ccw"):
		_handle_rotate(false)
	if Input.is_action_just_pressed("undo"):
		_on_undo()
	if Input.is_action_just_pressed("pause"):
		_on_pause()
	if Input.is_action_just_pressed("confirm"):
		_handle_confirm()
	if _hud:
		var packed = GameManager.items_in_box.size()
		var weight = _box.current_weight if _box else 0.0
		var max_w = _level_config.get("max_weight", 30.0)
		_hud.update_hud(
			GameManager.current_score,
			GameManager.level_time,
			packed,
			_spawned_count,
			weight,
			max_w
		)
		_hud.set_undo_enabled(not GameManager.undo_stack.is_empty())

func _input(event: InputEvent) -> void:
	if not GameManager.is_level_active or GameManager.is_paused:
		return
	if event is InputEventMouseButton:
		var world_pos = _screen_to_world(event.position)
		_handle_mouse_event(event, world_pos)
	elif event is InputEventTouchScreenTouch:
		var world_pos = _screen_to_world(event.position)
		_handle_touch_event(event, world_pos)
	elif event is InputEventTouchScreenDrag:
		var world_pos = _screen_to_world(event.position)
		_handle_touch_drag(event, world_pos)
	elif event is InputEventMouseMotion:
		if _dragging and _dragged_item and is_instance_valid(_dragged_item):
			var world_pos = _screen_to_world(event.position)
			_dragged_item.drag_to(world_pos)

func _screen_to_world(screen_pos: Vector2) -> Vector2:
	var canvas_transform = get_canvas_transform()
	var world_pos = canvas_transform.affine_inverse() * screen_pos
	return world_pos

func _handle_mouse_event(event: InputEventMouseButton, world_pos: Vector2) -> void:
	if event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			var item = _get_item_at(world_pos)
			if item:
				_start_drag(item, world_pos)
		else:
			if _dragging:
				_end_drag()
	elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
		var item = _get_item_at(world_pos)
		if item:
			item.rotate_item(true)

func _handle_touch_event(event: InputEventTouchScreenTouch, world_pos: Vector2) -> void:
	if event.pressed:
		if _touch_id == -1:
			_touch_id = event.index
			var item = _get_item_at(world_pos)
			if item:
				if _double_tap_item == item and _double_tap_timer > 0:
					item.rotate_item(true)
					_double_tap_item = null
					_double_tap_timer = 0
				else:
					_double_tap_item = item
					_double_tap_timer = 0.3
					_start_drag(item, world_pos)
		else:
			_two_finger_count += 1
			_two_finger_timer = 0.3
	else:
		if event.index == _touch_id:
			_touch_id = -1
			if _dragging:
				_end_drag()
		_two_finger_count = max(0, _two_finger_count - 1)

func _handle_touch_drag(event: InputEventTouchScreenDrag, world_pos: Vector2) -> void:
	if _dragging and _dragged_item and is_instance_valid(_dragged_item) and event.index == _touch_id:
		_dragged_item.drag_to(world_pos)

func _start_drag(item: RigidBody2D, from_pos: Vector2) -> void:
	if _is_settling and _settle_item == item:
		_is_settling = false
		_settle_item = null
	_dragging = true
	_dragged_item = item
	item.grab(from_pos)
	InputManager.select_item(item)

func _end_drag() -> void:
	if _dragged_item and is_instance_valid(_dragged_item):
		_release_item(_dragged_item)
	InputManager.deselect_item()
	_dragging = false
	_dragged_item = null

func _release_item(item: RigidBody2D) -> void:
	var inside_box = _is_inside_box(item)
	if inside_box:
		item.release_in_box()
		_is_settling = true
		_settle_item = item
		_settle_timer = 1.5
		AudioManager.play_sfx("place")
	else:
		item.release_outside()

func _is_inside_box(item: RigidBody2D) -> bool:
	if not _box or not is_instance_valid(_box):
		return false
	var box_rect = Rect2(
		_box.global_position.x - _box.box_width / 2.0,
		_box.global_position.y - _box.box_height / 2.0,
		_box.box_width,
		_box.box_height
	)
	return box_rect.has_point(item.global_position)

func _finalize_placement(item: RigidBody2D) -> void:
	if not is_instance_valid(item):
		return
	item.finalize_placement()
	var still_inside = _is_inside_box(item)
	if still_inside:
		GameManager.push_undo_action({
			"type": "place",
			"item_id": item.item_id,
			"prev_position": item._original_pos,
			"prev_rotation": item._original_rot
		})
		GameManager.add_item_to_box(item)
		if _feedback:
			_feedback.spawn_place_feedback(item.global_position, Color.GREEN)
	else:
		item.set_meta("in_box", false)
		item.is_placed = false
		if _feedback:
			_feedback.spawn_floating_text(item.global_position, "Missed!", Color.RED)

func _get_item_at(pos: Vector2) -> RigidBody2D:
	var space_state = get_world_2d().direct_space_state
	var query = PhysicsPointQueryParameters2D.new()
	query.position = pos
	query.collision_mask = 1 | 2
	query.collide_with_areas = false
	query.collide_with_bodies = true
	var results = space_state.intersect_point(query)
	for result in results:
		var collider = result.get("collider")
		if collider and collider.has_meta("item_id"):
			return collider
	return null

func _handle_rotate(clockwise: bool) -> void:
	var item = InputManager.get_selected_item()
	if item and is_instance_valid(item):
		item.rotate_item(clockwise)
		if _feedback:
			_feedback.spawn_rotate_feedback(item.global_position)

func _handle_confirm() -> void:
	if _dragging and _dragged_item and is_instance_valid(_dragged_item):
		_end_drag()

func _on_item_entered(item: Node2D) -> void:
	AudioManager.play_sfx("place")

func _on_item_exited(item: Node2D) -> void:
	if item.get_meta("in_box", false):
		GameManager.remove_item_from_box(item)

func _on_weight_warning(ratio: float) -> void:
	if _feedback:
		_feedback.spawn_weight_warning_feedback(_box.global_position if _box else Vector2.ZERO)
	AudioManager.play_sfx("collision")

func _on_overflow() -> void:
	if _hud:
		_hud.show_pulsing_hint("Box is overflowing!")

func _on_fragile_damaged(item: Node2D, damage: float) -> void:
	if _feedback:
		_feedback.spawn_break_feedback(item.global_position)

func _on_undo() -> void:
	GameManager.perform_undo()

func _on_pause() -> void:
	if GameManager.is_paused:
		GameManager.resume_game()
	else:
		GameManager.pause_game()

func _on_complete() -> void:
	if GameManager.items_in_box.is_empty():
		if _hud:
			_hud.show_pulsing_hint("Pack at least one item!")
		return
	GameManager.complete_level()
	var result = GameManager.calculate_score()
	if _feedback:
		_feedback.spawn_success_feedback(Vector2.ZERO)
	AudioManager.play_sfx("success")
	await get_tree().create_timer(1.0).timeout
	get_tree().change_scene_to_file("res://scenes/result.tscn")
