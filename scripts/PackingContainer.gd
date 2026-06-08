extends Area2D
class_name PackingContainer

signal item_entered(item: PackableItem)
signal item_exited(item: PackableItem)
signal weight_warning(current_ratio: float)
signal weight_over_limit()
signal bounds_warning(item: PackableItem)

@export var container_size: Vector2 = Vector2(500, 400)
@export var max_weight: float = 500.0
@export var warning_threshold: float = 0.9
@export var wood_color: Color = Color(0.55, 0.38, 0.22)
@export var wood_color_dark: Color = Color(0.38, 0.24, 0.12)
@export var board_count: int = 5

var current_weight: float = 0.0
var items_inside: Array[PackableItem] = []
var is_weight_warning: bool = false
var is_overweight: bool = false
var _boundary_shape: CollisionShape2D = null
var _visual_container: Node2D = null
var _grid_overlay: TextureRect = null
var _weight_bar: ProgressBar = null

func _ready() -> void:
	_build_visuals()
	_build_boundary()
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)
	area_exited.connect(_on_area_exited)
	collision_layer = 0
	collision_mask = 0
	set_collision_layer_value(2, true)
	set_collision_mask_value(1, true)

func _build_visuals() -> void:
	_visual_container = Node2D.new()
	add_child(_visual_container)
	var outer := ColorRect.new()
	outer.size = container_size + Vector2(40, 50)
	outer.position = -container_size * 0.5 - Vector2(20, 15)
	outer.color = wood_color_dark
	_visual_container.add_child(outer)
	var board_height: float = container_size.y / float(board_count)
	for i in range(board_count):
		var board := ColorRect.new()
		board.size = Vector2(container_size.x, board_height + 1)
		board.position = Vector2(-container_size.x * 0.5, -container_size.y * 0.5 + i * board_height)
		var t: float = float(i) / max(1, board_count - 1)
		board.color = wood_color.lerp(wood_color_dark, t * 0.35)
		_visual_container.add_child(board)
	var inner_shadow := ColorRect.new()
	inner_shadow.size = container_size - Vector2(14, 14)
	inner_shadow.position = -container_size * 0.5 + Vector2(7, 7)
	inner_shadow.color = Color(0, 0, 0, 0.18)
	_visual_container.add_child(inner_shadow)
	var inner_bg := ColorRect.new()
	inner_bg.size = container_size - Vector2(20, 20)
	inner_bg.position = -container_size * 0.5 + Vector2(10, 10)
	inner_bg.color = wood_color.lightened(0.22)
	_visual_container.add_child(inner_bg)
	var grid_tex := _create_grid_texture()
	_grid_overlay = TextureRect.new()
	_grid_overlay.custom_minimum_size = container_size - Vector2(24, 24)
	_grid_overlay.position = -container_size * 0.5 + Vector2(12, 12)
	_grid_overlay.texture = grid_tex
	_grid_overlay.stretch_mode = TextureRect.STRETCH_TILE
	_grid_overlay.modulate = Color(1, 1, 1, 0.12)
	_visual_container.add_child(_grid_overlay)
	_create_corners()

func _create_grid_texture() -> ImageTexture:
	var grid_size: int = 20
	var img := Image.create(grid_size, grid_size, false, Image.FORMAT_RGBA8)
	img.fill(Color(1, 1, 1, 0))
	for x in range(grid_size):
		img.set_pixel(x, 0, Color(0.5, 0.4, 0.3, 0.5))
	for y in range(grid_size):
		img.set_pixel(0, y, Color(0.5, 0.4, 0.3, 0.5))
	return ImageTexture.create_from_image(img)

func _create_corners() -> void:
	var corner_color: Color = wood_color_dark.darkened(0.3)
	var thickness: int = 6
	var positions: Array = [
		Vector2(-container_size.x * 0.5 - 2, -container_size.y * 0.5 - 2),
		Vector2(container_size.x * 0.5 - thickness + 2, -container_size.y * 0.5 - 2),
		Vector2(-container_size.x * 0.5 - 2, container_size.y * 0.5 - thickness + 2),
		Vector2(container_size.x * 0.5 - thickness + 2, container_size.y * 0.5 - thickness + 2)
	]
	for pos in positions:
		var corner := ColorRect.new()
		corner.size = Vector2(thickness, thickness)
		corner.position = pos
		corner.color = corner_color
		_visual_container.add_child(corner)

func _build_boundary() -> void:
	_boundary_shape = CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = container_size * 0.98
	_boundary_shape.shape = shape
	add_child(_boundary_shape)

func _on_body_entered(_body: Node) -> void:
	pass

func _on_area_entered(area: Area2D) -> void:
	if area is PackableItem:
		var item: PackableItem = area
		if not items_inside.has(item):
			items_inside.append(item)
			item.is_within_container = true
			current_weight += item.weight
			item_entered.emit(item)
			_check_weight_status()

func _on_area_exited(area: Area2D) -> void:
	if area is PackableItem:
		var item: PackableItem = area
		if items_inside.has(item):
			items_inside.erase(item)
			item.is_within_container = false
			current_weight = max(0.0, current_weight - item.weight)
			item_exited.emit(item)
			_check_weight_status()

func _check_weight_status() -> void:
	var ratio: float = current_weight / max(1.0, max_weight)
	if ratio >= 1.0 and not is_overweight:
		is_overweight = true
		is_weight_warning = true
		weight_over_limit.emit()
		AudioManager.play_sfx(AudioManager.SFX.WEIGHT_WARN)
		UIManager.show_toast("超重警告！当前：%.0fkg / 上限：%.0fkg" % [current_weight, max_weight], 3.0, "error")
		_flash_background(Color(1, 0.3, 0.3, 0.25))
	elif ratio >= warning_threshold and not is_weight_warning:
		is_weight_warning = true
		weight_warning.emit(ratio)
		AudioManager.play_sfx(AudioManager.SFX.WEIGHT_WARN)
		UIManager.show_toast("接近重量上限：%.0f%%" % int(ratio * 100), 2.0, "warning")
		_flash_background(Color(1, 0.8, 0.2, 0.15))
	elif ratio < warning_threshold:
		is_weight_warning = false
		is_overweight = false

func is_item_within_bounds(item: PackableItem) -> bool:
	var item_rect: Rect2 = item.get_bounds_rect()
	var container_rect: Rect2 = get_bounds_rect()
	return container_rect.encloses(item_rect)

func is_item_partially_inside(item: PackableItem) -> bool:
	var item_rect: Rect2 = item.get_bounds_rect()
	var container_rect: Rect2 = get_bounds_rect()
	return container_rect.intersects(item_rect)

func get_bounds_rect() -> Rect2:
	return Rect2(global_position - container_size * 0.5, container_size)

func get_items_overlapping(item: PackableItem) -> Array[PackableItem]:
	var result: Array[PackableItem] = []
	for other in items_inside:
		if other != item and other.item_state != PackableItem.ItemState.BROKEN:
			if item.overlaps_item(other):
				result.append(other)
	return result

func has_item_collisions(item: PackableItem) -> bool:
	return get_items_overlapping(item).size() > 0

func recalculate_fragile_weights() -> void:
	for fragile in items_inside:
		if not fragile.is_fragile:
			continue
		if fragile.item_state == PackableItem.ItemState.BROKEN:
			continue
		var w: float = 0.0
		for other in items_inside:
			if other == fragile:
				continue
			if other.item_state == PackableItem.ItemState.BROKEN:
				continue
			w += fragile.get_weight_on_top(other)
		fragile.weight_above = w
		if w >= fragile.fragile_weight_limit * 1.25:
			fragile.set_state(PackableItem.ItemState.BROKEN)
		elif w >= fragile.fragile_weight_limit * 0.75:
			fragile.set_fragile_warn(w)

func remove_all_items() -> void:
	var items_copy: Array = items_inside.duplicate()
	for item in items_copy:
		if items_inside.has(item):
			items_inside.erase(item)
	current_weight = 0.0
	is_weight_warning = false
	is_overweight = false

func _flash_background(c: Color) -> void:
	if _grid_overlay == null:
		return
	var original_mod: Color = _grid_overlay.modulate
	var tween := create_tween()
	_grid_overlay.modulate = c
	tween.set_parallel(true)
	tween.tween_property(_grid_overlay, "modulate", original_mod, 0.5).set_trans(Tween.TRANS_SINE)

func get_fill_ratio() -> float:
	var total_area: float = container_size.x * container_size.y
	var used: float = 0.0
	for item in items_inside:
		if item.item_state != PackableItem.ItemState.BROKEN:
			used += item.dimensions.x * item.dimensions.y * 0.9
	return clamp(used / total_area, 0.0, 1.0)

func get_placement_quality_score(item: PackableItem) -> int:
	if not is_item_within_bounds(item):
		return -50
	if has_item_collisions(item):
		return -30
	if is_weight_warning or is_overweight:
		return -20
	var bonus: int = item.place_bonus
	if item.is_fragile:
		var top_space: float = container_size.y * 0.5 + global_position.y - item.position.y
		if top_space < container_size.y * 0.35:
			bonus += 60
	if item.position.y < global_position.y:
		bonus -= 20
	return bonus
