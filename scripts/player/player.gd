extends CharacterBody2D
class_name Player

enum State { IDLE, MOVING, SCANNING, DISCOVERED }

@export var move_speed: float = 150
@export var sneak_speed: float = 70
@export var scan_range: float = 80
@export var interact_range: float = 60
@export var max_energy: float = 100

signal noise_made(radius: float, position: Vector2)
signal shelf_scanned(shelf_id: String)
signal label_fix_attempted(shelf_id: String)
signal energy_changed(current: float, max_val: float)
signal discovered
signal state_changed(new_state: String)

var current_state: State = State.IDLE
var energy: float
var is_scanning: bool = false
var _scan_requested: bool = false
var _interact_requested: bool = false

var _noise_area: Area2D
var _noise_shape: CollisionShape2D

var _nearby_shelves: Array = []
var _nearest_shelf: Shelf = null
var _scanned_shelves: Array = []
var _fix_target: Shelf = null

const _SCAN_ENERGY_COST: float = 15
const _ENERGY_REGEN_RATE: float = 8
const _NORMAL_NOISE_RADIUS: float = 60
const _SNEAK_NOISE_RADIUS: float = 20
const _SCAN_NOISE_RADIUS: float = 100

func _ready():
	energy = max_energy
	_noise_area = Area2D.new()
	_noise_shape = CollisionShape2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 0
	_noise_shape.shape = circle
	_noise_area.add_child(_noise_shape)
	_noise_area.monitorable = false
	add_child(_noise_area)
	collision_layer = 1
	collision_mask = 0
	set_collision_mask_value(3, true)
	set_collision_mask_value(4, true)
	set_collision_mask_value(7, true)

func _unhandled_input(event: InputEvent):
	if current_state == State.DISCOVERED:
		return
	if event is InputEventKey:
		if event.keycode == KEY_E and event.pressed and not event.echo:
			_scan_requested = true
		elif event.keycode == KEY_F and event.pressed and not event.echo:
			_interact_requested = true

func _physics_process(delta):
	if current_state == State.DISCOVERED:
		return

	var direction = Vector2.ZERO
	if Input.is_key_pressed(KEY_W):
		direction.y -= 1
	if Input.is_key_pressed(KEY_S):
		direction.y += 1
	if Input.is_key_pressed(KEY_A):
		direction.x -= 1
	if Input.is_key_pressed(KEY_D):
		direction.x += 1
	direction = direction.normalized()

	var is_sneaking = Input.is_key_pressed(KEY_SHIFT)
	var speed = sneak_speed if is_sneaking else move_speed
	velocity = direction * speed
	move_and_slide()

	if is_scanning:
		_update_noise_area(_SCAN_NOISE_RADIUS)
		emit_signal("noise_made", _SCAN_NOISE_RADIUS, global_position)
	elif direction != Vector2.ZERO:
		var noise_radius = _SNEAK_NOISE_RADIUS if is_sneaking else _NORMAL_NOISE_RADIUS
		_set_state(State.MOVING)
		emit_signal("noise_made", noise_radius, global_position)
		_update_noise_area(noise_radius)
		var nc = get_node_or_null("NoiseComponent")
		if nc and nc.has_method("emit_noise"):
			nc.emit_noise(noise_radius)
	else:
		if current_state != State.SCANNING:
			_set_state(State.IDLE)
			_update_noise_area(0)

	if not is_scanning:
		energy = min(max_energy, energy + _ENERGY_REGEN_RATE * delta)
		emit_signal("energy_changed", energy, max_energy)

	_update_nearby_shelves()

	if _scan_requested:
		_scan_requested = false
		if not is_scanning and energy >= _SCAN_ENERGY_COST:
			_start_scanning()

	if _interact_requested:
		_interact_requested = false
		_try_fix_label()

	queue_redraw()

func _update_nearby_shelves():
	_nearby_shelves = _detect_shelves(scan_range)
	_scanned_shelves = _detect_shelves(interact_range)

	var old_nearest = _nearest_shelf
	_nearest_shelf = null
	_fix_target = null

	var min_dist: float = scan_range
	for shelf in _nearby_shelves:
		var dist = global_position.distance_to(shelf.global_position)
		if dist < min_dist:
			min_dist = dist
			_nearest_shelf = shelf

	for shelf in _scanned_shelves:
		if shelf._scanned and not shelf.is_fixed:
			_fix_target = shelf
			break

	if old_nearest != _nearest_shelf:
		if old_nearest and is_instance_valid(old_nearest):
			old_nearest.set_highlight(false)
		if _nearest_shelf:
			_nearest_shelf.set_highlight(true)

func _detect_shelves(range_val: float) -> Array:
	var results: Array = []
	var space_state = get_world_2d().direct_space_state
	var shape_query = PhysicsShapeQueryParameters2D.new()
	var circle = CircleShape2D.new()
	circle.radius = range_val
	shape_query.shape = circle
	shape_query.transform = Transform2D(0, global_position)
	shape_query.collision_mask = 4
	shape_query.collide_with_areas = false
	shape_query.collide_with_bodies = true
	var intersections = space_state.intersect_shape(shape_query)
	for intersection in intersections:
		var collider = intersection["collider"]
		if collider is Shelf:
			results.append(collider)
	return results

func _start_scanning():
	is_scanning = true
	_set_state(State.SCANNING)
	energy -= _SCAN_ENERGY_COST
	emit_signal("energy_changed", energy, max_energy)
	emit_signal("noise_made", _SCAN_NOISE_RADIUS, global_position)
	_update_noise_area(_SCAN_NOISE_RADIUS)
	var nc = get_node_or_null("NoiseComponent")
	if nc and nc.has_method("emit_noise"):
		nc.emit_noise(_SCAN_NOISE_RADIUS)

	var shelves_in_range = _detect_shelves(scan_range)
	for shelf in shelves_in_range:
		shelf.scan()
		emit_signal("shelf_scanned", shelf.shelf_id)

	await get_tree().create_timer(0.5).timeout
	is_scanning = false
	_update_noise_area(0)
	if current_state != State.DISCOVERED:
		_set_state(State.IDLE)

func _try_fix_label():
	var target := _fix_target
	if target and target._scanned and not target.is_fixed:
		var sid := target.shelf_id
		target.fix_label()
		emit_signal("label_fix_attempted", sid)
		_fix_target = null
		AnalyticsManager.record_choice("fix_label", {
			"shelf_id": sid,
			"position": {"x": global_position.x, "y": global_position.y}
		})
	elif _nearest_shelf and not _nearest_shelf._scanned:
		UIManager.show_notification("按 E 扫描货架再修复", 1.5)

func get_scan_area() -> Array:
	return _detect_shelves(scan_range)

func _update_noise_area(radius: float):
	(_noise_shape.shape as CircleShape2D).radius = radius

func apply_discovery():
	_set_state(State.DISCOVERED)
	velocity = Vector2.ZERO
	emit_signal("discovered")

func reset_to_checkpoint(pos: Vector2):
	global_position = pos
	energy = max_energy
	is_scanning = false
	_scan_requested = false
	_interact_requested = false
	_scanned_shelves.clear()
	_nearby_shelves.clear()
	_nearest_shelf = null
	_fix_target = null
	_update_noise_area(0)
	_set_state(State.IDLE)
	emit_signal("energy_changed", energy, max_energy)

func _draw():
	draw_rect(Rect2(-12, -12, 24, 24), Color(0.5, 0.7, 1.0))
	draw_line(Vector2(0, -12), Vector2(0, -20), Color(0.5, 0.7, 1.0), 2.0)
	if is_scanning:
		draw_circle(Vector2.ZERO, scan_range, Color(0.3, 0.8, 1.0, 0.15))
	if _fix_target and not is_scanning:
		draw_circle(Vector2.ZERO, interact_range, Color(0, 1, 0, 0.1))
