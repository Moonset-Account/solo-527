extends RigidBody2D

signal item_picked_up(item)
signal item_dropped(item)
signal item_rotated(item, angle)

var is_dragging: bool = false
var pickup_offset: Vector2 = Vector2.ZERO
var item_data: ItemData
var double_tap_threshold: float = 0.3
var last_tap_time: float = 0.0

func _ready() -> void:
	input_pickable = true
	gravity_scale = 1.0
	linear_damp = 2.0
	angular_damp = 5.0

func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton:
		if event.pressed:
			var current_time = Time.get_ticks_msec() / 1000.0
			if current_time - last_tap_time < double_tap_threshold:
				_rotate_90()
				last_tap_time = 0.0
			else:
				last_tap_time = current_time
				_start_drag(get_global_mouse_position())
		else:
			if is_dragging:
				_stop_drag()
	elif event is InputEventScreenTouch:
		if event.pressed:
			var current_time = Time.get_ticks_msec() / 1000.0
			if current_time - last_tap_time < double_tap_threshold:
				_rotate_90()
				last_tap_time = 0.0
			else:
				last_tap_time = current_time
				_start_drag(event.position)
		else:
			if is_dragging:
				_stop_drag()

func _input(event: InputEvent) -> void:
	if not is_dragging:
		return
	if event is InputEventMouseMotion:
		global_position = get_global_mouse_position() - pickup_offset
	elif event is InputEventScreenDrag:
		global_position = event.position - pickup_offset
	if event.is_action_pressed("rotate_cw"):
		_rotate_90()
	elif event.is_action_pressed("rotate_ccw"):
		rotation_degrees = snappedf(rotation_degrees - 90.0, 90.0)
		item_rotated.emit(self, rotation_degrees)

func _process(_delta: float) -> void:
	if is_dragging:
		if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
			global_position = get_global_mouse_position() - pickup_offset

func _start_drag(global_click: Vector2) -> void:
	is_dragging = true
	pickup_offset = global_click - global_position
	freeze = true
	z_index = 100
	linear_velocity = Vector2.ZERO
	angular_velocity = 0.0
	modulate = Color(1.0, 1.0, 1.0, 0.8)
	item_picked_up.emit(self)

func _stop_drag() -> void:
	is_dragging = false
	freeze = false
	z_index = 0
	modulate = Color.WHITE
	item_dropped.emit(self)

func _rotate_90() -> void:
	rotation_degrees = snappedf(rotation_degrees + 90.0, 90.0)
	item_rotated.emit(self, rotation_degrees)

func setup_from_data(data: ItemData) -> void:
	item_data = data
	match data.shape_type:
		"rect":
			var cs = CollisionShape2D.new()
			var shape = RectangleShape2D.new()
			shape.size = Vector2(data.width, data.height)
			cs.shape = shape
			add_child(cs)
		"circle":
			var cs = CollisionShape2D.new()
			var shape = CircleShape2D.new()
			shape.radius = data.width / 2.0
			cs.shape = shape
			add_child(cs)
		"l_shape":
			var cs1 = CollisionShape2D.new()
			var s1 = RectangleShape2D.new()
			s1.size = Vector2(data.width / 2.0, data.height)
			cs1.shape = s1
			cs1.position = Vector2(-data.width / 4.0, 0.0)
			add_child(cs1)
			var cs2 = CollisionShape2D.new()
			var s2 = RectangleShape2D.new()
			s2.size = Vector2(data.width / 2.0, data.height / 2.0)
			cs2.shape = s2
			cs2.position = Vector2(data.width / 4.0, data.height / 4.0)
			add_child(cs2)
		"t_shape":
			var cs1 = CollisionShape2D.new()
			var s1 = RectangleShape2D.new()
			s1.size = Vector2(data.width, data.height / 2.0)
			cs1.shape = s1
			cs1.position = Vector2(0.0, -data.height / 4.0)
			add_child(cs1)
			var cs2 = CollisionShape2D.new()
			var s2 = RectangleShape2D.new()
			s2.size = Vector2(data.width / 2.0, data.height / 2.0)
			cs2.shape = s2
			cs2.position = Vector2(0.0, data.height / 4.0)
			add_child(cs2)

	var visual = Node2D.new()
	match data.shape_type:
		"rect":
			var cr = ColorRect.new()
			cr.size = Vector2(data.width, data.height)
			cr.position = Vector2(-data.width / 2.0, -data.height / 2.0)
			cr.color = data.color
			visual.add_child(cr)
		"circle":
			var cr = ColorRect.new()
			cr.size = Vector2(data.width, data.width)
			cr.position = Vector2(-data.width / 2.0, -data.width / 2.0)
			cr.color = data.color
			visual.add_child(cr)
		"l_shape":
			var cr1 = ColorRect.new()
			cr1.size = Vector2(data.width / 2.0, data.height)
			cr1.position = Vector2(-data.width / 2.0, -data.height / 2.0)
			cr1.color = data.color
			visual.add_child(cr1)
			var cr2 = ColorRect.new()
			cr2.size = Vector2(data.width / 2.0, data.height / 2.0)
			cr2.position = Vector2(0.0, 0.0)
			cr2.color = data.color
			visual.add_child(cr2)
		"t_shape":
			var cr1 = ColorRect.new()
			cr1.size = Vector2(data.width, data.height / 2.0)
			cr1.position = Vector2(-data.width / 2.0, -data.height / 2.0)
			cr1.color = data.color
			visual.add_child(cr1)
			var cr2 = ColorRect.new()
			cr2.size = Vector2(data.width / 2.0, data.height / 2.0)
			cr2.position = Vector2(-data.width / 4.0, 0.0)
			cr2.color = data.color
			visual.add_child(cr2)
	add_child(visual)

	if data.is_fragile:
		var name_label = Label.new()
		name_label.text = "!" + data.item_name
		name_label.add_theme_font_size_override("font_size", 14)
		name_label.position = Vector2(-data.width / 2.0, -data.height / 2.0 - 18)
		name_label.z_index = 10
		add_child(name_label)
	else:
		var name_label = Label.new()
		name_label.text = data.item_name
		name_label.add_theme_font_size_override("font_size", 14)
		name_label.position = Vector2(-data.width / 2.0, -data.height / 2.0 - 18)
		name_label.z_index = 10
		add_child(name_label)
