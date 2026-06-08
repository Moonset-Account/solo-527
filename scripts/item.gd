extends RigidBody2D

signal grabbed(item: RigidBody2D)
signal released(item: RigidBody2D, in_box: bool)
signal rotated_signal(item: RigidBody2D)
signal damaged(item: RigidBody2D, amount: float)

var item_id: String = ""
var template_name: String = ""
var item_shape: String = "rect"
var item_width: float = 40.0
var item_height: float = 40.0
var weight: float = 1.0
var is_fragile: bool = false
var fragility: float = 1.0
var item_color: Color = Color("#4488CC")
var item_label: String = ""
var is_held: bool = false
var is_placed: bool = false
var is_settling: bool = false
var damage_amount: float = 0.0
var rotation_step: float = PI / 2.0
var _drag_offset: Vector2 = Vector2.ZERO
var _original_pos: Vector2 = Vector2.ZERO
var _original_rot: float = 0.0
var _visual: Node2D = null
var _label_node: Label = null
var _crack_overlay: ColorRect = null
var _glow: ColorRect = null
var _pulse_time: float = 0.0
var _collision_count: int = 0
var _last_collision_sound_time: float = 0.0
var _contacts_above: Array[RigidBody2D] = []
var _pressure_check_timer: float = 0.0
var _pressure_check_interval: float = 0.25

func _ready() -> void:
	add_to_group("items")
	freeze = true
	gravity_scale = 0.0
	contact_monitor = true
	max_contacts_reported = 8
	mass = max(weight, 0.1)
	collision_layer = 1
	collision_mask = 1 | 2
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	_setup_visual()
	_setup_meta()

func setup(data: Dictionary) -> void:
	item_id = data.get("id", str(randi()))
	template_name = data.get("template", "box")
	item_shape = data.get("shape", "rect")
	item_width = float(data.get("width", 40))
	item_height = float(data.get("height", 40))
	weight = float(data.get("weight", 1.0))
	is_fragile = data.get("is_fragile", false)
	fragility = float(data.get("fragility", 1.0))
	var color_str = data.get("color", "#4488CC")
	item_color = Color.from_string(color_str, Color("#4488CC"))
	item_label = data.get("label", "")
	_rebuild_visual()
	_setup_meta()
	mass = max(weight, 0.1)

func _setup_meta() -> void:
	set_meta("item_id", item_id)
	set_meta("template_name", template_name)
	set_meta("weight", weight)
	set_meta("is_fragile", is_fragile)
	set_meta("fragility", fragility)
	set_meta("in_box", false)
	set_meta("selected", false)

func _rebuild_visual() -> void:
	if _visual:
		_visual.queue_free()
	if _label_node:
		_label_node.queue_free()
	if _crack_overlay:
		_crack_overlay.queue_free()
	if _glow:
		_glow.queue_free()
	_remove_collision_shapes()
	_setup_visual()

func _setup_visual() -> void:
	_visual = Node2D.new()
	_visual.name = "Visual"
	add_child(_visual)
	match item_shape:
		"rect", "box":
			_create_rect_visual()
		"circle":
			_create_circle_visual()
		"l_shape":
			_create_l_shape_visual()
		"t_shape":
			_create_t_shape_visual()
		"long":
			_create_long_visual()
		_:
			_create_rect_visual()
	_glow = ColorRect.new()
	_glow.name = "Glow"
	var glow_size = Vector2(item_width + 8, item_height + 8)
	_glow.size = glow_size
	_glow.position = -glow_size / 2
	_glow.color = Color(1, 1, 0, 0)
	_glow.z_index = -1
	_visual.add_child(_glow)
	if item_label != "":
		_label_node = Label.new()
		_label_node.text = item_label
		_label_node.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		_label_node.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		_label_node.add_theme_font_size_override("font_size", 10)
		_label_node.add_theme_color_override("font_color", Color.WHITE)
		_label_node.add_theme_color_override("font_shadow_color", Color.BLACK)
		_label_node.add_theme_constant_override("shadow_offset_x", 1)
		_label_node.add_theme_constant_override("shadow_offset_y", 1)
		_label_node.size = Vector2(item_width, item_height)
		_label_node.position = -Vector2(item_width, item_height) / 2
		_visual.add_child(_label_node)
	if is_fragile:
		_crack_overlay = ColorRect.new()
		_crack_overlay.name = "CrackOverlay"
		_crack_overlay.size = Vector2(item_width, item_height)
		_crack_overlay.position = -Vector2(item_width, item_height) / 2
		_crack_overlay.color = Color(1, 0, 0, 0)
		_visual.add_child(_crack_overlay)

func _create_rect_visual() -> void:
	var rect = ColorRect.new()
	rect.size = Vector2(item_width, item_height)
	rect.position = -Vector2(item_width, item_height) / 2
	rect.color = item_color
	_visual.add_child(rect)
	var border = ColorRect.new()
	border.size = Vector2(item_width + 2, item_height + 2)
	border.position = -Vector2(item_width + 2, item_height + 2) / 2
	border.color = Color(item_color, 0.5)
	border.z_index = -1
	_visual.add_child(border)
	var shape = CollisionShape2D.new()
	shape.name = "CollisionShape2D"
	var rect_shape = RectangleShape2D.new()
	rect_shape.size = Vector2(item_width, item_height)
	shape.shape = rect_shape
	add_child(shape)

func _create_circle_visual() -> void:
	var crect = ColorRect.new()
	crect.size = Vector2(item_width, item_width)
	crect.position = -Vector2(item_width, item_width) / 2
	crect.color = item_color
	_visual.add_child(crect)
	var shape = CollisionShape2D.new()
	shape.name = "CollisionShape2D"
	var circ = CircleShape2D.new()
	circ.radius = item_width / 2.0
	shape.shape = circ
	add_child(shape)

func _create_l_shape_visual() -> void:
	var arm_w = item_width / 3.0
	var arm_h = item_height
	var leg_w = item_width
	var leg_h = item_height / 3.0
	var r1 = ColorRect.new()
	r1.size = Vector2(arm_w, arm_h)
	r1.position = Vector2(-item_width / 2.0, -item_height / 2.0)
	r1.color = item_color
	_visual.add_child(r1)
	var r2 = ColorRect.new()
	r2.size = Vector2(leg_w, leg_h)
	r2.position = Vector2(-item_width / 2.0, -item_height / 2.0 + arm_h - leg_h)
	r2.color = item_color
	_visual.add_child(r2)
	var shape1 = CollisionShape2D.new()
	shape1.name = "CollisionShape2D_Arm"
	var rect1 = RectangleShape2D.new()
	rect1.size = Vector2(arm_w, arm_h)
	shape1.shape = rect1
	shape1.position = Vector2(-item_width / 2.0 + arm_w / 2.0, 0)
	add_child(shape1)
	var shape2 = CollisionShape2D.new()
	shape2.name = "CollisionShape2D_Leg"
	var rect2 = RectangleShape2D.new()
	rect2.size = Vector2(leg_w - arm_w, leg_h)
	shape2.shape = rect2
	shape2.position = Vector2(-item_width / 2.0 + arm_w + (leg_w - arm_w) / 2.0, -item_height / 2.0 + arm_h - leg_h / 2.0)
	add_child(shape2)

func _create_t_shape_visual() -> void:
	var top_w = item_width
	var top_h = item_height / 3.0
	var stem_w = item_width / 3.0
	var stem_h = item_height
	var r1 = ColorRect.new()
	r1.size = Vector2(top_w, top_h)
	r1.position = Vector2(-item_width / 2.0, -item_height / 2.0)
	r1.color = item_color
	_visual.add_child(r1)
	var r2 = ColorRect.new()
	r2.size = Vector2(stem_w, stem_h - top_h)
	r2.position = Vector2(-stem_w / 2.0, -item_height / 2.0 + top_h)
	r2.color = item_color
	_visual.add_child(r2)
	var shape1 = CollisionShape2D.new()
	shape1.name = "CollisionShape2D_Top"
	var rect1 = RectangleShape2D.new()
	rect1.size = Vector2(top_w, top_h)
	shape1.shape = rect1
	shape1.position = Vector2(0, -item_height / 2.0 + top_h / 2.0)
	add_child(shape1)
	var shape2 = CollisionShape2D.new()
	shape2.name = "CollisionShape2D_Stem"
	var rect2 = RectangleShape2D.new()
	rect2.size = Vector2(stem_w, stem_h - top_h)
	shape2.shape = rect2
	shape2.position = Vector2(0, -item_height / 2.0 + top_h + (stem_h - top_h) / 2.0)
	add_child(shape2)

func _create_long_visual() -> void:
	item_width = max(item_width, 80)
	var rect = ColorRect.new()
	rect.size = Vector2(item_width, item_height)
	rect.position = -Vector2(item_width, item_height) / 2
	rect.color = item_color
	_visual.add_child(rect)
	var shape = CollisionShape2D.new()
	shape.name = "CollisionShape2D"
	var rect_shape = RectangleShape2D.new()
	rect_shape.size = Vector2(item_width, item_height)
	shape.shape = rect_shape
	add_child(shape)

func _remove_collision_shapes() -> void:
	for child in get_children():
		if child is CollisionShape2D:
			remove_child(child)
			child.queue_free()

func grab(from_pos: Vector2) -> void:
	is_held = true
	is_settling = false
	freeze = true
	gravity_scale = 0.0
	linear_velocity = Vector2.ZERO
	angular_velocity = 0.0
	_drag_offset = global_position - from_pos
	_original_pos = global_position
	_original_rot = global_rotation
	z_index = 10
	if _glow:
		_glow.color = Color(1, 1, 0, 0.3)
	grabbed.emit(self)
	AudioManager.play_sfx("pickup")

func drag_to(pos: Vector2) -> void:
	if not is_held:
		return
	global_position = pos + _drag_offset

func release_in_box() -> void:
	is_held = false
	is_settling = true
	z_index = 0
	if _glow:
		_glow.color = Color(1, 1, 0, 0)
	freeze = false
	gravity_scale = 2.0
	linear_velocity = Vector2.ZERO
	angular_velocity = 0.0
	set_meta("in_box", true)
	released.emit(self, true)

func release_outside() -> void:
	is_held = false
	is_settling = false
	z_index = 0
	if _glow:
		_glow.color = Color(1, 1, 0, 0)
	freeze = true
	gravity_scale = 0.0
	linear_velocity = Vector2.ZERO
	angular_velocity = 0.0
	set_meta("in_box", false)
	released.emit(self, false)

func finalize_placement() -> void:
	is_settling = false
	freeze = true
	gravity_scale = 0.0
	linear_velocity = Vector2.ZERO
	angular_velocity = 0.0
	is_placed = true

func unplace() -> void:
	is_placed = false
	is_settling = false
	freeze = true
	gravity_scale = 0.0
	linear_velocity = Vector2.ZERO
	angular_velocity = 0.0
	set_meta("in_box", false)
	remove_from_group("packed_items")
	_contacts_above.clear()

func rotate_item(clockwise: bool = true) -> void:
	var prev_rot = global_rotation
	if clockwise:
		global_rotation += rotation_step
	else:
		global_rotation -= rotation_step
	GameManager.push_undo_action({
		"type": "rotate",
		"item_id": item_id,
		"prev_rotation": prev_rot
	})
	rotated_signal.emit(self)
	AudioManager.play_sfx("rotate")

func apply_damage(amount: float) -> void:
	damage_amount += amount
	_update_crack_visual()
	_create_crack_particles()
	damaged.emit(self, amount)
	if damage_amount >= fragility:
		_break_item()

func _update_crack_visual() -> void:
	if is_fragile and _crack_overlay:
		var alpha = clampf(damage_amount / fragility, 0.0, 0.8)
		_crack_overlay.color = Color(1, 0, 0, alpha)

func _break_item() -> void:
	if _visual:
		var tw = create_tween()
		tw.tween_property(_visual, "modulate", Color(1, 0.3, 0.3, 0.5), 0.3)
	if _crack_overlay:
		_crack_overlay.color = Color(1, 0, 0, 0.9)

func _create_crack_particles() -> void:
	var particles = CPUParticles2D.new()
	particles.emitting = true
	particles.amount = 6
	particles.lifetime = 0.3
	particles.explosiveness = 0.8
	particles.direction = Vector2(0, -1)
	particles.spread = 60
	particles.gravity = Vector2(0, 200)
	particles.initial_velocity_min = 50
	particles.initial_velocity_max = 100
	particles.scale_amount_min = 1
	particles.scale_amount_max = 2
	add_child(particles)
	get_tree().create_timer(0.5).timeout.connect(particles.queue_free)

func _on_body_entered(body: Node2D) -> void:
	_collision_count += 1
	var now = Time.get_ticks_msec() / 1000.0
	if now - _last_collision_sound_time > 0.1:
		_last_collision_sound_time = now
		var impact = linear_velocity.length() if not freeze else 0.0
		if impact > 20.0:
			AudioManager.play_sfx("collision")
	if body is RigidBody2D and body.has_meta("weight"):
		if body.global_position.y < global_position.y - 2.0:
			if not _contacts_above.has(body):
				_contacts_above.append(body)
			if is_fragile and get_meta("in_box", false) and body.get_meta("in_box", false):
				_check_pressure_from(body)
	if _glow and not is_held:
		_glow.color = Color(0, 1, 0, 0.15)

func _on_body_exited(body: Node2D) -> void:
	_collision_count = max(0, _collision_count - 1)
	if body is RigidBody2D:
		_contacts_above.erase(body)
	if _collision_count == 0 and _glow and not is_held:
		_glow.color = Color(1, 1, 0, 0)

func _check_pressure_from(source: RigidBody2D) -> void:
	var total_weight_above = source.get_meta("weight", 1.0)
	for contact in _contacts_above:
		if contact != source and is_instance_valid(contact):
			total_weight_above += contact.get_meta("weight", 0.0)
	if total_weight_above > fragility:
		var damage_amount = total_weight_above - fragility
		apply_damage(damage_amount)
		GameManager.fragile_broken_count += 1
		AudioManager.play_sfx("glass_break")

func _process(delta: float) -> void:
	if is_held:
		_pulse_time += delta * 4.0
		if _glow:
			var pulse = 0.2 + 0.1 * sin(_pulse_time)
			_glow.color = Color(1, 1, 0, pulse)
	if get_meta("selected", false) and not is_held:
		_pulse_time += delta * 3.0
		if _glow:
			var pulse = 0.15 + 0.1 * sin(_pulse_time)
			_glow.color = Color(0.5, 0.8, 1.0, pulse)
	if is_fragile and is_placed and not is_held:
		_pressure_check_timer += delta
		if _pressure_check_timer >= _pressure_check_interval:
			_pressure_check_timer = 0.0
			_recheck_pressure()

func _recheck_pressure() -> void:
	_contacts_above.clear()
	var bodies = get_colliding_bodies()
	for body in bodies:
		if body is RigidBody2D and body.has_meta("weight"):
			if body.global_position.y < global_position.y - 2.0:
				_contacts_above.append(body)
	if _contacts_above.is_empty():
		return
	var total_weight = 0.0
	for contact in _contacts_above:
		if is_instance_valid(contact):
			total_weight += contact.get_meta("weight", 1.0)
	if total_weight > fragility and get_meta("in_box", false):
		var excess = total_weight - fragility
		if damage_amount < fragility:
			apply_damage(excess * 0.5)
			GameManager.fragile_broken_count += 1
			AudioManager.play_sfx("glass_break")

func get_bounds() -> Rect2:
	var bounds = Rect2(global_position, Vector2.ZERO)
	var found = false
	for child in get_children():
		if child is CollisionShape2D and child.shape:
			var rect = child.shape.get_rect()
			var world_rect = Rect2(global_position + rect.position + child.position, rect.size)
			if not found:
				bounds = world_rect
				found = true
			else:
				bounds = bounds.merge(world_rect)
	if not found:
		bounds = Rect2(global_position - Vector2(item_width, item_height)/2, Vector2(item_width, item_height))
	return bounds

func serialize() -> Dictionary:
	return {
		"item_id": item_id,
		"template": template_name,
		"shape": item_shape,
		"width": item_width,
		"height": item_height,
		"weight": weight,
		"is_fragile": is_fragile,
		"fragility": fragility,
		"color": "#" + item_color.to_html(false),
		"label": item_label,
		"position": {"x": global_position.x, "y": global_position.y},
		"rotation": global_rotation,
		"damage": damage_amount,
		"in_box": get_meta("in_box", false),
		"is_placed": is_placed
	}
