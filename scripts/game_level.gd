extends Node2D

var box_node: StaticBody2D
var undo_system: Node
var weight_system: Node

var level_timer: float = 0.0
var level_time_limit: float = 120.0
var items_total_count: int = 0
var is_level_active: bool = false
var _lose_triggered: bool = false

var score_label: Label
var timer_label: Label
var weight_label: Label
var hint_label: Label
var undo_button: Button
var pause_button: Button
var hud_layer: CanvasLayer

var level_config: Dictionary = {}
var level_id: String = ""
var spawned_items: Array = []
var box_items_inside: Dictionary = {}
var box_detection_area: Area2D
var box_width: float = 300.0
var box_height: float = 400.0
var box_max_weight: float = 20.0

func _ready() -> void:
	undo_system = UndoSystem.new()
	add_child(undo_system)
	weight_system = WeightSystem.new()
	add_child(weight_system)
	_load_level_data()
	_create_box()
	_create_hud()
	spawn_items_from_config(level_config)
	ScoreManager.start_scoring(level_id)
	is_level_active = true

func get_packed_count() -> int:
	var count := 0
	for item in box_items_inside:
		if box_items_inside[item]:
			count += 1
	return count

func get_packed_items() -> Array:
	var result: Array = []
	for item in box_items_inside:
		if box_items_inside[item]:
			result.append(item)
	return result

func _process(delta: float) -> void:
	if not is_level_active:
		return
	level_timer += delta
	_update_hud()
	if level_time_limit > 0 and level_timer >= level_time_limit:
		_on_level_failed("时间到!")
		return
	_check_lose_condition()
	_check_win_condition()

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and is_level_active:
		_on_pause_pressed()
	elif event.is_action_pressed("undo") and is_level_active:
		_on_undo_pressed()

func _load_level_data() -> void:
	level_id = GameManager.current_level_id
	level_config = LevelManager.get_level_data(level_id)
	if level_config.is_empty():
		DebugLogger.warn("Level data not found for id: " + level_id)
		return
	level_time_limit = float(level_config.get("par_time", 120))
	items_total_count = level_config.get("items", []).size()
	box_width = float(level_config.get("box_width", 300))
	box_height = float(level_config.get("box_height", 400))
	box_max_weight = float(level_config.get("max_weight", 20))

func _create_box() -> void:
	box_node = StaticBody2D.new()
	add_child(box_node)
	box_node.position = Vector2(200, 450)

	var wall_thickness := 10.0
	var wall_color := Color(0.55, 0.35, 0.15)

	var left_wall_body = StaticBody2D.new()
	var left_shape = CollisionShape2D.new()
	var left_rect = RectangleShape2D.new()
	left_rect.size = Vector2(wall_thickness, box_height + wall_thickness * 2.0)
	left_shape.shape = left_rect
	left_shape.position = Vector2(-box_width / 2.0 - wall_thickness / 2.0, 0.0)
	left_wall_body.add_child(left_shape)
	var left_visual = ColorRect.new()
	left_visual.size = Vector2(wall_thickness, box_height + wall_thickness * 2.0)
	left_visual.position = Vector2(-box_width / 2.0 - wall_thickness, -box_height / 2.0 - wall_thickness)
	left_visual.color = wall_color
	left_wall_body.add_child(left_visual)
	box_node.add_child(left_wall_body)

	var right_wall_body = StaticBody2D.new()
	var right_shape = CollisionShape2D.new()
	var right_rect = RectangleShape2D.new()
	right_rect.size = Vector2(wall_thickness, box_height + wall_thickness * 2.0)
	right_shape.shape = right_rect
	right_shape.position = Vector2(box_width / 2.0 + wall_thickness / 2.0, 0.0)
	right_wall_body.add_child(right_shape)
	var right_visual = ColorRect.new()
	right_visual.size = Vector2(wall_thickness, box_height + wall_thickness * 2.0)
	right_visual.position = Vector2(box_width / 2.0, -box_height / 2.0 - wall_thickness)
	right_visual.color = wall_color
	right_wall_body.add_child(right_visual)
	box_node.add_child(right_wall_body)

	var bottom_wall_body = StaticBody2D.new()
	var bottom_shape = CollisionShape2D.new()
	var bottom_rect = RectangleShape2D.new()
	bottom_rect.size = Vector2(box_width + wall_thickness * 2.0, wall_thickness)
	bottom_shape.shape = bottom_rect
	bottom_shape.position = Vector2(0.0, box_height / 2.0 + wall_thickness / 2.0)
	bottom_wall_body.add_child(bottom_shape)
	var bottom_visual = ColorRect.new()
	bottom_visual.size = Vector2(box_width + wall_thickness * 2.0, wall_thickness)
	bottom_visual.position = Vector2(-box_width / 2.0 - wall_thickness, box_height / 2.0)
	bottom_visual.color = wall_color
	bottom_wall_body.add_child(bottom_visual)
	box_node.add_child(bottom_wall_body)

	var floor_visual = ColorRect.new()
	floor_visual.size = Vector2(box_width, box_height)
	floor_visual.position = Vector2(-box_width / 2.0, -box_height / 2.0)
	floor_visual.color = Color(0.95, 0.92, 0.85, 0.5)
	floor_visual.z_index = -1
	box_node.add_child(floor_visual)

	box_detection_area = Area2D.new()
	var area_shape = CollisionShape2D.new()
	var area_rect = RectangleShape2D.new()
	area_rect.size = Vector2(box_width, box_height)
	area_shape.shape = area_rect
	box_detection_area.add_child(area_shape)
	box_detection_area.body_entered.connect(_on_body_entered_box)
	box_detection_area.body_exited.connect(_on_body_exited_box)
	box_detection_area.collision_mask = 2
	box_node.add_child(box_detection_area)

func _on_body_entered_box(body: Node2D) -> void:
	if body is RigidBody2D and not box_items_inside.has(body):
		box_items_inside[body] = false

func _on_body_exited_box(body: Node2D) -> void:
	if box_items_inside.has(body):
		if box_items_inside[body]:
			box_items_inside[body] = false

func get_total_weight() -> float:
	var total: float = 0.0
	for item in box_items_inside:
		if box_items_inside[item] and "item_data" in item and item.item_data:
			total += item.item_data.weight
	return total

func is_overweight() -> bool:
	return get_total_weight() > box_max_weight

func check_fragile_under_pressure() -> Array:
	var packed = get_packed_items()
	return weight_system.check_fragile_integrity(packed)

func _create_hud() -> void:
	hud_layer = CanvasLayer.new()
	add_child(hud_layer)

	var hud_root = VBoxContainer.new()
	hud_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	hud_root.add_theme_constant_override("separation", 8)
	hud_layer.add_child(hud_root)

	var top_bar = HBoxContainer.new()
	hud_root.add_child(top_bar)

	score_label = Label.new()
	score_label.text = "已装箱: 0/" + str(items_total_count)
	score_label.add_theme_font_size_override("font_size", 20)
	top_bar.add_child(score_label)

	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(spacer)

	timer_label = Label.new()
	timer_label.text = "时间: 0.0s"
	timer_label.add_theme_font_size_override("font_size", 20)
	top_bar.add_child(timer_label)

	weight_label = Label.new()
	weight_label.text = "重量: 0/" + str(box_max_weight)
	weight_label.add_theme_font_size_override("font_size", 20)
	top_bar.add_child(weight_label)

	var button_bar = HBoxContainer.new()
	hud_root.add_child(button_bar)

	undo_button = Button.new()
	undo_button.text = "撤销"
	undo_button.custom_minimum_size = Vector2(80, 40)
	undo_button.pressed.connect(_on_undo_pressed)
	button_bar.add_child(undo_button)

	var spacer2 = Control.new()
	spacer2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button_bar.add_child(spacer2)

	pause_button = Button.new()
	pause_button.text = "暂停"
	pause_button.custom_minimum_size = Vector2(80, 40)
	pause_button.pressed.connect(_on_pause_pressed)
	button_bar.add_child(pause_button)

	var hints = level_config.get("tutorial_hints", [])
	if hints.size() > 0:
		hint_label = Label.new()
		hint_label.text = hints[0]
		hint_label.add_theme_font_size_override("font_size", 18)
		hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		hint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		hud_root.add_child(hint_label)

func _update_hud() -> void:
	var packed := get_packed_count()
	score_label.text = "已装箱: " + str(packed) + "/" + str(items_total_count)
	var remaining := maxf(level_time_limit - level_timer, 0.0)
	timer_label.text = "时间: " + str(snappedf(remaining, 0.1)) + "s"
	var current_w := get_total_weight()
	weight_label.text = "重量: " + str(snappedf(current_w, 0.1)) + "/" + str(snappedf(box_max_weight, 0.1))
	if current_w > box_max_weight:
		weight_label.add_theme_color_override("font_color", Color.RED)
	else:
		weight_label.add_theme_color_override("font_color", Color.WHITE)
	GameManager.last_time = level_timer

func _on_item_dropped(item: RigidBody2D) -> void:
	if not box_items_inside.has(item):
		return
	if box_items_inside[item]:
		return
	box_items_inside[item] = true
	ScoreManager.add_score("item_packed", 100)
	undo_system.push_action({"type": "place", "item_id": item.get_instance_id()})

func _on_item_picked_up(item: RigidBody2D) -> void:
	if not box_items_inside.has(item):
		return
	if box_items_inside[item]:
		box_items_inside[item] = false
		ScoreManager.add_score("item_removed", -100)
		undo_system.push_action({"type": "remove", "item_id": item.get_instance_id()})

func _check_win_condition() -> bool:
	var packed := get_packed_count()
	if packed < items_total_count:
		return false
	var crushed = check_fragile_under_pressure()
	if crushed.size() > 0:
		return false
	if is_overweight():
		return false
	_on_level_complete()
	return true

func _check_lose_condition() -> bool:
	if _lose_triggered:
		return true
	var crushed = check_fragile_under_pressure()
	if crushed.size() > 0:
		var crushed_names: Array = []
		for c in crushed:
			if "item_data" in c and c.item_data:
				crushed_names.append(c.item_data.item_name)
		_on_level_failed("易碎品被压碎了: " + ", ".join(crushed_names))
		return true
	if is_overweight():
		_on_level_failed("箱子超重了!")
		return true
	return false

func _on_level_complete() -> void:
	is_level_active = false
	var time_bonus := int(maxf(level_time_limit - level_timer, 0.0)) * 10
	if time_bonus > 0:
		ScoreManager.add_score("time_bonus", time_bonus)
	var packed := get_packed_count()
	var stars := _calculate_stars_from_packed(packed, items_total_count)
	var score := ScoreManager.get_current_score()
	LevelManager.complete_level(level_id, stars)
	var next_level_id = str(int(level_id) + 1)
	if LevelManager.get_level_data(next_level_id).size() > 0:
		LevelManager.unlock_level(next_level_id)
	GameManager.last_score = score
	GameManager.last_stars = stars
	GameManager.last_time = level_timer
	GameManager.last_packed = packed
	GameManager.change_state(GameManager.GameState.RESULTS)

func _calculate_stars_from_packed(packed: int, total: int) -> int:
	if total <= 0:
		return 0
	if packed >= total:
		return 3
	var ratio: float = float(packed) / float(total)
	if ratio >= 0.66:
		return 2
	if ratio >= 0.33:
		return 1
	return 0

func _on_level_failed(reason: String) -> void:
	if _lose_triggered:
		return
	_lose_triggered = true
	is_level_active = false
	GameManager.failure_reason = reason
	GameManager.last_packed = get_packed_count()
	GameManager.change_state(GameManager.GameState.FAILURE)

func _on_pause_pressed() -> void:
	get_tree().paused = true
	var pause_menu = preload("res://scenes/pause_menu.tscn").instantiate()
	hud_layer.add_child(pause_menu)

func _on_undo_pressed() -> void:
	if undo_system and undo_system.can_undo():
		var action = undo_system.undo()
		if action.is_empty():
			return
		ScoreManager.undo_last_score()

func spawn_items_from_config(config: Dictionary) -> void:
	var items_data = config.get("items", [])
	var staging_x := 550.0
	var staging_y := 100.0
	var item_script = preload("res://scripts/gameplay/draggable_item.gd")
	for i in range(items_data.size()):
		var item_dict = items_data[i]
		var data := ItemData.new()
		data.item_name = item_dict.get("item_name", "")
		data.shape_type = item_dict.get("shape_type", "rect")
		data.width = float(item_dict.get("width", 32))
		data.height = float(item_dict.get("height", 32))
		data.weight = float(item_dict.get("weight", 1))
		data.is_fragile = item_dict.get("is_fragile", false)
		var color_str: String = item_dict.get("color", "#FFFFFF")
		data.color = Color.from_string(color_str, Color.WHITE)
		var item := RigidBody2D.new()
		item.set_script(item_script)
		item.collision_layer = 2
		item.collision_mask = 1 | 2
		item.position = Vector2(staging_x, staging_y + i * 100.0)
		add_child(item)
		item.setup_from_data(data)
		if item.has_signal("item_dropped") and not item.item_dropped.is_connected(_on_item_dropped):
			item.item_dropped.connect(_on_item_dropped)
		if item.has_signal("item_picked_up") and not item.item_picked_up.is_connected(_on_item_picked_up):
			item.item_picked_up.connect(_on_item_picked_up)
		spawned_items.append(item)
