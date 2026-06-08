extends Node2D

var box_node: StaticBody2D
var undo_system: UndoSystem
var weight_system: WeightSystem

var level_timer: float = 0.0
var level_time_limit: float = 120.0
var items_total_count: int = 0
var is_level_active: bool = false
var _lose_triggered: bool = false
var _overweight_timer: float = 0.0
var _overweight_grace: float = 2.0

var score_label: Label
var timer_label: Label
var weight_label: Label
var hint_label: Label
var undo_button: Button
var pause_button: Button
var finish_button: Button
var hud_layer: CanvasLayer

var level_config: Dictionary = {}
var level_id: String = ""
var spawned_items: Array = []
var item_staging_positions: Dictionary = {}
var _item_pickup_info: Dictionary = {}
var box_detection_area: Area2D
var box_width: float = 300.0
var box_height: float = 400.0
var box_max_weight: float = 20.0
var par_time: float = 120.0

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

func _is_position_in_box(pos: Vector2) -> bool:
	var box_pos := box_node.global_position
	var half_w := box_width / 2.0
	var half_h := box_height / 2.0
	return pos.x > box_pos.x - half_w and pos.x < box_pos.x + half_w and pos.y > box_pos.y - half_h and pos.y < box_pos.y + half_h

func _is_item_in_box(item: Node2D) -> bool:
	if not is_instance_valid(item):
		return false
	if item.is_dragging:
		return false
	return _is_position_in_box(item.global_position)

func get_packed_items() -> Array:
	var result: Array = []
	for item in spawned_items:
		if _is_item_in_box(item):
			result.append(item)
	return result

func get_packed_count() -> int:
	return get_packed_items().size()

func get_total_weight() -> float:
	var total: float = 0.0
	for item in get_packed_items():
		if "item_data" in item and item.item_data:
			total += item.item_data.weight
	return total

func is_overweight() -> bool:
	return get_total_weight() > box_max_weight

func check_fragile_under_pressure() -> Array:
	return weight_system.check_fragile_integrity(get_packed_items())

func _process(delta: float) -> void:
	if not is_level_active:
		return
	level_timer += delta
	_update_hud()
	if level_time_limit > 0 and level_timer >= level_time_limit:
		_on_level_failed("时间到!")
		return
	_check_lose_condition()

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
	level_time_limit = float(level_config.get("par_time", 120)) * 1.5
	par_time = float(level_config.get("par_time", 120))
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
	box_detection_area.collision_mask = 2
	box_node.add_child(box_detection_area)

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
	undo_button.custom_minimum_size = Vector2(70, 40)
	undo_button.pressed.connect(_on_undo_pressed)
	button_bar.add_child(undo_button)

	var spacer2 = Control.new()
	spacer2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button_bar.add_child(spacer2)

	pause_button = Button.new()
	pause_button.text = "暂停"
	pause_button.custom_minimum_size = Vector2(70, 40)
	pause_button.pressed.connect(_on_pause_pressed)
	button_bar.add_child(pause_button)

	finish_button = Button.new()
	finish_button.text = "完成装箱"
	finish_button.custom_minimum_size = Vector2(90, 40)
	finish_button.pressed.connect(_on_finish_pressed)
	button_bar.add_child(finish_button)

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
		if _overweight_timer > 0.0:
			weight_label.text = "重量: " + str(snappedf(current_w, 0.1)) + "/" + str(snappedf(box_max_weight, 0.1)) + " ⚠"
	else:
		weight_label.add_theme_color_override("font_color", Color.WHITE)
	GameManager.last_time = level_timer

func _on_item_picked_up(item: RigidBody2D) -> void:
	var was_in_box = _is_position_in_box(item.global_position)
	_item_pickup_info[item] = {
		"was_in_box": was_in_box,
		"pickup_pos": item.global_position
	}

func _on_item_dropped(item: RigidBody2D) -> void:
	var is_in_box = _is_position_in_box(item.global_position)
	var info = _item_pickup_info.get(item, {"was_in_box": false, "pickup_pos": Vector2.ZERO})
	var was_in_box = info.get("was_in_box", false)

	if is_in_box and not was_in_box:
		var staging_pos = item_staging_positions.get(item.get_instance_id(), Vector2(550, 100))
		undo_system.push_action({"type": "place", "item": item, "staging_pos": staging_pos})
	elif not is_in_box and was_in_box:
		var prev_pos: Vector2 = info.get("pickup_pos", item.global_position)
		undo_system.push_action({"type": "remove", "item": item, "prev_pos": prev_pos})

	_item_pickup_info.erase(item)

func _on_finish_pressed() -> void:
	if not is_level_active:
		return
	var packed := get_packed_count()
	if packed == 0:
		_on_level_failed("没有装入任何物品!")
		return
	var crushed = check_fragile_under_pressure()
	if crushed.size() > 0:
		var crushed_names: Array = []
		for c in crushed:
			if "item_data" in c and c.item_data:
				crushed_names.append(c.item_data.item_name)
		_on_level_failed("易碎品被压碎了: " + ", ".join(crushed_names))
		return
	if is_overweight():
		_on_level_failed("箱子超重了! 当前:" + str(snappedf(get_total_weight(), 0.1)) + "kg 上限:" + str(snappedf(box_max_weight, 0.1)) + "kg")
		return
	if packed < items_total_count:
		_on_level_failed("还有 " + str(items_total_count - packed) + " 件物品未装箱!")
		return
	_on_level_complete()

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
		_overweight_timer += get_process_delta_time()
		if _overweight_timer >= _overweight_grace:
			_on_level_failed("箱子超重了! 当前:" + str(snappedf(get_total_weight(), 0.1)) + "kg 上限:" + str(snappedf(box_max_weight, 0.1)) + "kg")
			return true
	else:
		_overweight_timer = 0.0
	return false

func _on_level_complete() -> void:
	is_level_active = false
	var packed := get_packed_count()
	var stars := _calculate_stars(packed, level_timer)
	var score := packed * 100 + int(maxf(par_time - level_timer, 0.0)) * 10
	LevelManager.complete_level(level_id, stars)
	var next_level_id = str(int(level_id) + 1)
	if LevelManager.get_level_data(next_level_id).size() > 0:
		LevelManager.unlock_level(next_level_id)
	GameManager.last_score = score
	GameManager.last_stars = stars
	GameManager.last_time = level_timer
	GameManager.last_packed = packed
	GameManager.change_state(GameManager.GameState.RESULTS)

func _calculate_stars(packed: int, time: float) -> int:
	if packed < items_total_count:
		return 0
	if time <= par_time:
		return 3
	if time <= par_time * 1.25:
		return 2
	return 1

func _on_level_failed(reason: String) -> void:
	if _lose_triggered:
		return
	_lose_triggered = true
	is_level_active = false
	GameManager.failure_reason = reason
	GameManager.last_packed = get_packed_count()
	GameManager.last_time = level_timer
	GameManager.change_state(GameManager.GameState.FAILURE)

func _on_pause_pressed() -> void:
	get_tree().paused = true
	var pause_menu = preload("res://scenes/pause_menu.tscn").instantiate()
	hud_layer.add_child(pause_menu)

func _on_undo_pressed() -> void:
	if not undo_system or not undo_system.can_undo():
		return
	var action = undo_system.undo()
	if action.is_empty():
		return
	var action_type = action.get("type", "")
	var item_ref = action.get("item", null)
	if action_type == "place" and is_instance_valid(item_ref):
		var staging_pos = action.get("staging_pos", item_staging_positions.get(item_ref.get_instance_id(), Vector2(550, 100)))
		item_ref.global_position = staging_pos
		item_ref.linear_velocity = Vector2.ZERO
		item_ref.angular_velocity = 0.0
		item_ref.freeze = true
		await get_tree().create_timer(0.05).timeout
		if is_instance_valid(item_ref):
			item_ref.freeze = false
	elif action_type == "remove" and is_instance_valid(item_ref):
		var prev_pos = action.get("prev_pos", Vector2.ZERO)
		if prev_pos != Vector2.ZERO:
			item_ref.global_position = prev_pos
			item_ref.linear_velocity = Vector2.ZERO
			item_ref.angular_velocity = 0.0
			item_ref.freeze = true
			await get_tree().create_timer(0.05).timeout
			if is_instance_valid(item_ref):
				item_ref.freeze = false

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
		var spawn_pos = Vector2(staging_x, staging_y + i * 100.0)
		item.position = spawn_pos
		add_child(item)
		item.setup_from_data(data)
		item_staging_positions[item.get_instance_id()] = spawn_pos
		if item.has_signal("item_dropped") and not item.item_dropped.is_connected(_on_item_dropped):
			item.item_dropped.connect(_on_item_dropped)
		if item.has_signal("item_picked_up") and not item.item_picked_up.is_connected(_on_item_picked_up):
			item.item_picked_up.connect(_on_item_picked_up)
		spawned_items.append(item)
