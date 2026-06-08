extends Area2D
class_name PackableItem

signal state_changed(new_state: int)
signal fragile_warning(weight_on_item: float)
signal fragile_broken()
signal collision_detected()
signal placed_in_container()
signal removed_from_container()

enum ItemState {
	IN_TRAY,
	BEING_DRAGGED,
	IN_CONTAINER,
	INVALID,
	BROKEN
}

@export var config_id: String = "box_small"
@export var item_name: String = "小箱子"
@export var weight: float = 15.0
@export var is_fragile: bool = false
@export var fragile_weight_limit: float = 20.0
@export var max_stack_weight: float = 50.0
@export var dimensions: Vector2 = Vector2(60, 60)
@export var base_color: Color = Color(0.85, 0.65, 0.4)
@export var accent_color: Color = Color(0.7, 0.5, 0.3)
@export var category_icon: String = "📦"
@export var rotation_snapping: float = 15.0
@export var place_bonus: int = 50
@export var item_uid: int = 0

var item_state: int = ItemState.IN_TRAY
var original_position: Vector2 = Vector2.ZERO
var original_rotation: float = 0.0
var original_z_index: int = 0
var is_selected: bool = false
var weight_above: float = 0.0
var overlaps_with: Array = []
var is_within_container: bool = false
var spawn_index: int = 0

var _sprite: Node2D = null
var _collision: CollisionPolygon2D = null
var _highlight: Polygon2D = null
var _fragile_border: Line2D = null
var _icon_label: Label = null
var _weight_label: Label = null
var _break_particles: CPUParticles2D = null
var _tween: Tween = null

func _ready() -> void:
	_build_visuals()
	_build_collision()
	input_pickable = true
	input_event.connect(_on_input_event)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)
	area_exited.connect(_on_area_exited)
	z_index = original_z_index

func _build_visuals() -> void:
	var sprite_container := Node2D.new()
	sprite_container.name = "VisualRoot"
	add_child(sprite_container)
	_sprite = _create_item_shape()
	_sprite.name = "Shape"
	sprite_container.add_child(_sprite)
	var shadow := ColorRect.new()
	shadow.color = Color(0, 0, 0, 0.25)
	shadow.size = dimensions * 1.05
	shadow.position = -dimensions * 0.5 + Vector2(4, 6)
	shadow.z_index = -1
	sprite_container.add_child(shadow)
	_create_highlight()
	if is_fragile:
		_create_fragile_border()
	_create_labels()
	_create_particles()

func _create_item_shape() -> Node2D:
	var container := Node2D.new()
	var poly := Polygon2D.new()
	var hw: float = dimensions.x * 0.5
	var hh: float = dimensions.y * 0.5
	var points: PackedVector2Array
	if config_id == "mirror":
		points = PackedVector2Array([
			Vector2(-hw*0.7, -hh), Vector2(hw*0.7, -hh),
			Vector2(hw, -hh*0.95), Vector2(hw*0.85, hh*0.6),
			Vector2(hw*0.6, hh), Vector2(-hw*0.6, hh),
			Vector2(-hw*0.85, hh*0.6), Vector2(-hw, -hh*0.95)
		])
	elif config_id == "cylinder_pot" or config_id == "plant_pot":
		points = PackedVector2Array([
			Vector2(-hw, -hh*0.7), Vector2(hw, -hh*0.7),
			Vector2(hw*1.02, 0), Vector2(hw, hh),
			Vector2(-hw, hh), Vector2(-hw*1.02, 0)
		])
	elif config_id == "irregular_guitar":
		points = PackedVector2Array([
			Vector2(-hw*0.25, -hh), Vector2(hw*0.15, -hh*0.5),
			Vector2(hw*0.45, -hh*0.2), Vector2(hw, 0),
			Vector2(hw*0.6, hh*0.45), Vector2(hw*0.2, hh),
			Vector2(-hw*0.55, hh*0.85), Vector2(-hw, hh*0.3),
			Vector2(-hw*0.55, -hh*0.1), Vector2(-hw*0.5, -hh*0.6)
		])
	elif config_id == "furniture_chair":
		points = PackedVector2Array([
			Vector2(-hw*0.8, -hh), Vector2(hw*0.8, -hh),
			Vector2(hw, -hh*0.2), Vector2(hw*0.95, hh), Vector2(-hw*0.95, hh),
			Vector2(-hw, -hh*0.2)
		])
	elif config_id == "furniture_large" or config_id == "appliance_fridge" or config_id == "appliance_washing":
		points = PackedVector2Array([
			Vector2(-hw, -hh), Vector2(hw, -hh),
			Vector2(hw, hh), Vector2(-hw, hh)
		])
	else:
		points = PackedVector2Array([
			Vector2(-hw, -hh), Vector2(hw, -hh),
			Vector2(hw, hh), Vector2(-hw, hh)
		])
	poly.polygon = points
	poly.color = base_color
	container.add_child(poly)
	var inner := Polygon2D.new()
	var inner_points: PackedVector2Array = PackedVector2Array()
	for p in points:
		inner_points.append(p * 0.86)
	inner.polygon = inner_points
	inner.color = accent_color
	container.add_child(inner)
	if config_id.begins_with("electronics") or config_id == "mirror":
		var screen := ColorRect.new()
		screen.color = Color(0.12, 0.14, 0.18)
		screen.size = dimensions * Vector2(0.7, 0.55)
		screen.position = -dimensions * Vector2(0.35, 0.28)
		container.add_child(screen)
	if config_id.begins_with("furniture") or config_id.begins_with("appliance"):
		var handle1 := ColorRect.new()
		handle1.color = accent_color.darkened(0.25)
		handle1.size = Vector2(dimensions.x * 0.12, dimensions.y * 0.06)
		handle1.position = Vector2(-dimensions.x * 0.35, -dimensions.y * 0.1)
		container.add_child(handle1)
	return container

func _create_highlight() -> void:
	_highlight = Polygon2D.new()
	var hw: float = dimensions.x * 0.5 + 8
	var hh: float = dimensions.y * 0.5 + 8
	_highlight.polygon = PackedVector2Array([
		Vector2(-hw, -hh), Vector2(hw, -hh),
		Vector2(hw, hh), Vector2(-hw, hh)
	])
	_highlight.color = Color(1, 1, 1, 0)
	_highlight.z_index = 5
	add_child(_highlight)

func _create_fragile_border() -> void:
	_fragile_border = Line2D.new()
	_fragile_border.width = 4.0
	_fragile_border.closed = true
	_fragile_border.default_color = Color(0.78, 0.4, 0.88, 0)
	var hw: float = dimensions.x * 0.5 + 2
	var hh: float = dimensions.y * 0.5 + 2
	var pts: PackedVector2Array = PackedVector2Array([
		Vector2(-hw, -hh), Vector2(hw, -hh),
		Vector2(hw, hh), Vector2(-hw, hh)
	])
	_fragile_border.points = pts
	_fragile_border.z_index = 6
	add_child(_fragile_border)

func _create_labels() -> void:
	var icon := Label.new()
	icon.text = category_icon
	icon.add_theme_font_size_override("font_size", int(max(16, min(dimensions.x * 0.35))))
	icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	icon.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	icon.custom_minimum_size = dimensions
	icon.position = -dimensions * 0.5
	icon.z_index = 8
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(icon)
	_icon_label = icon
	var wlabel := Label.new()
	wlabel.text = "%dkg" % int(weight)
	wlabel.add_theme_font_size_override("font_size", 12)
	wlabel.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wlabel.add_theme_color_override("font_color", Color(0.2, 0.2, 0.2, 0.9))
	wlabel.position = Vector2(dimensions.x * 0.5 - wlabel.size.x - 6, -dimensions.y * 0.5 + 2)
	wlabel.z_index = 9
	wlabel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(wlabel)
	_weight_label = wlabel

func _create_particles() -> void:
	_break_particles = CPUParticles2D.new()
	_break_particles.amount = 20
	_break_particles.emitting = false
	_break_particles.lifetime = 0.8
	_break_particles.preprocess = 0.0
	_break_particles.direction = Vector2.DOWN
	_break_particles.spread = 45.0
	_break_particles.gravity = Vector2(0, 200)
	_break_particles.initial_velocity_min = 50.0
	_break_particles.initial_velocity_max = 180.0
	_break_particles.scale_amount = randomize()
	_break_particles.color = base_color
	_break_particles.z_index = 20
	add_child(_break_particles)

func _build_collision() -> void:
	_collision = CollisionPolygon2D.new()
	var hw: float = dimensions.x * 0.48
	var hh: float = dimensions.y * 0.48
	_collision.polygon = PackedVector2Array([
		Vector2(-hw, -hh), Vector2(hw, -hh),
		Vector2(hw, hh), Vector2(-hw, hh)
	])
	add_child(_collision)
	collision_layer = 1
	collision_mask = 1 + 2 + 4
	set_collision_layer_value(1, true)
	set_collision_mask_value(1, true)
	set_collision_mask_value(2, true)

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if item_state == ItemState.BROKEN:
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			select()
		else:
			deselect()

func _on_mouse_entered() -> void:
	if item_state == ItemState.BROKEN:
		return
	set_highlight(true, "hover")

func _on_mouse_exited() -> void:
	if not is_selected:
		set_highlight(false)

func _on_body_entered(_body: Node) -> void:
	pass

func _on_area_entered(area: Area2D) -> void:
	if area is PackableItem:
		if not overlaps_with.has(area):
			overlaps_with.append(area)
		collision_detected.emit()

func _on_area_exited(area: Area2D) -> void:
	if overlaps_with.has(area):
		overlaps_with.erase(area)

func select() -> void:
	is_selected = true
	set_state(ItemState.BEING_DRAGGED)
	original_z_index = z_index
	z_index = 100
	set_highlight(true, "selected")
	AudioManager.play_sfx(AudioManager.SFX.GRAB)

func deselect() -> void:
	is_selected = false
	z_index = original_z_index
	if item_state == ItemState.BEING_DRAGGED:
		set_state(ItemState.IN_CONTAINER if is_within_container else ItemState.IN_TRAY)
	set_highlight(false)

func set_state(new_state: int) -> void:
	if item_state == new_state:
		return
	item_state = new_state
	state_changed.emit(new_state)
	match new_state:
		ItemState.IN_CONTAINER:
			placed_in_container.emit()
		ItemState.IN_TRAY:
			removed_from_container.emit()
		ItemState.BROKEN:
			_on_broken()

func set_highlight(enabled: bool, mode: String = "none") -> void:
	if _highlight == null:
		return
	if not enabled:
		_highlight.color = Color(1, 1, 1, 0)
		if _fragile_border:
			_fragile_border.default_color = Color(0.78, 0.4, 0.88, 0)
		return
	var c: Color = Color.WHITE
	match mode:
		"hover":
			c = Color(0.9, 0.95, 1, 0.45)
		"selected":
			c = Color(0.5, 0.85, 1, 0.55)
		"valid":
			c = Color(0.35, 0.9, 0.45, 0.5)
		"invalid":
			c = Color(1, 0.35, 0.35, 0.6)
		"warning":
			c = Color(0.95, 0.8, 0.2, 0.6)
		_:
			c = Color.WHITE
	_highlight.color = c
	if _fragile_border:
		var bc: Color = _fragile_border.default_color
		bc.a = 0.9
		_fragile_border.default_color = bc

func set_fragile_warn(current_weight: float) -> void:
	fragile_warning.emit(current_weight)
	AudioManager.play_sfx(AudioManager.SFX.FRAGILE_WARN)
	UIManager.show_toast("易碎品受压警告：%.1f / %.1fkg" % [current_weight, fragile_weight_limit], 1.5, "fragile")
	_shake_item(0.2, 0.15)

func _on_broken() -> void:
	fragile_broken.emit()
	if _break_particles:
		_break_particles.emitting = true
	AudioManager.play_sfx(AudioManager.SFX.FRAGILE_BREAK)
	UIManager.show_toast("%s 已破碎！" % item_name, 3.0, "error")
	GameManager.damage_fragile(self)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "modulate:a", 0.2, 0.5)
	tween.tween_property(self, "scale", Vector2(0.7, 0.7), 0.4).set_trans(Tween.TRANS_ELASTIC)
	tween.chain().tween_callback(func():
		queue_free()
	)

func _shake_item(duration: float, strength: float) -> void:
	var original_pos: Vector2 = Vector2.ZERO
	if _sprite:
		original_pos = _sprite.position
		var tween := create_tween()
		tween.set_loops()
		var counter: int = 0
		tween.tween_callback(func():
			if _sprite:
				_sprite.position = original_pos + Vector2(randf_range(-strength * 30, strength * 30), randf_range(-strength * 30, strength * 30))
				counter += 1
				if counter > int(duration * 60):
					tween.kill()
					_sprite.position = original_pos
		)
		tween.tween_interval(1.0 / 60.0)
		tween.chain()

func animate_to_position(target: Vector2, duration: float = 0.2) -> void:
	if _tween and _tween.is_valid():
		_tween.kill()
	_tween = create_tween()
	_tween.set_trans(Tween.TRANS_CUBIC)
	_tween.set_ease(Tween.EASE_OUT)
	_tween.tween_property(self, "position", target, duration)

func animate_rotation_to(target_deg: float) -> void:
	if _tween and _tween.is_valid():
		_tween.kill()
	_tween = create_tween()
	_tween.set_trans(Tween.TRANS_CUBIC)
	_tween.set_ease(Tween.EASE_OUT)
	_tween.tween_property(self, "rotation_degrees", target_deg, 0.15)

func get_bounds_rect() -> Rect2:
	return Rect2(global_position - dimensions * 0.5, dimensions)

func overlaps_item(other: PackableItem) -> bool:
	var a: Rect2 = get_bounds_rect()
	var b: Rect2 = other.get_bounds_rect()
	return a.intersects(b)

func get_weight_on_top(other_item: PackableItem) -> float:
	var total: float = 0.0
	var my_rect: Rect2 = get_bounds_rect()
	var other_rect: Rect2 = other_item.get_bounds_rect()
	var overlap: Rect2 = my_rect.intersection(other_rect)
	if not overlap.has_area():
		return 0.0
	if other.position.y < position.y - dimensions.y * 0.2:
		return other_item.weight * 1.2
	elif other.position.y < position.y:
		return other_item.weight * 0.8
	return 0.0

func reset_to_original() -> void:
	position = original_position
	rotation_degrees = original_rotation
	z_index = original_z_index
	set_state(ItemState.IN_TRAY)
	is_within_container = false
	modulate.a = 1.0
	scale = Vector2.ONE
	if _tween and _tween.is_valid():
		_tween.kill()
