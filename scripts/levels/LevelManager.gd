extends Node2D

class_name LevelManager

signal level_loaded(level_id: int)

var player: CharacterBody2D = null
var goal: Area2D = null
var shelves_container: Node2D = null
var patrols_container: Node2D = null
var checkpoints_container: Node2D = null
var walls_container: StaticBody2D = null

var current_level_data: Dictionary = {}

func _ready():
	DebugLog.info("关卡管理器就绪")

func load_level(level_id: int):
	_clear_level()
	current_level_data = LevelConfig.get_level(level_id)
	if current_level_data.is_empty():
		DebugLog.error("找不到关卡: %d" % level_id)
		return
	_build_walls(current_level_data["walls"])
	_spawn_shelves(current_level_data["shelves"])
	_spawn_patrols(current_level_data["patrols"])
	_spawn_checkpoints(current_level_data["checkpoints"])
	_setup_player()
	_setup_goal()
	_setup_objectives()
	GameManager.start_game(level_id)
	emit_signal("level_loaded", level_id)
	DebugLog.success("关卡 %d [%s] 加载完成" % [level_id, current_level_data["name"]])

func _clear_level():
	if shelves_container:
		for child in shelves_container.get_children():
			child.queue_free()
	if patrols_container:
		for child in patrols_container.get_children():
			child.queue_free()
	if checkpoints_container:
		for child in checkpoints_container.get_children():
			child.queue_free()
	if walls_container:
		for child in walls_container.get_children():
			child.queue_free()

func _build_walls(walls: Array):
	for wall in walls:
		var wall_shape = _create_wall_collision(wall["start"], wall["end"])
		walls_container.add_child(wall_shape)

func _create_wall_collision(start: Vector2, end: Vector2) -> Node:
	var collision = CollisionShape2D.new()
	var center = (start + end) / 2
	var direction = end - start
	var length = direction.length()
	var angle = direction.angle()
	collision.position = center
	collision.rotation = angle
	var rect = RectangleShape2D.new()
	rect.size = Vector2(length + 10, 20)
	collision.shape = rect
	var visual = ColorRect.new()
	visual.position = center - Vector2((length + 10) / 2, 10)
	visual.size = Vector2(length + 10, 20)
	visual.color = Color(0.25, 0.25, 0.32)
	walls_container.add_child(visual)
	return collision

func _spawn_shelves(shelves_data: Array):
	for data in shelves_data:
		var shelf = _build_shelf(data)
		shelves_container.add_child(shelf)

func _build_shelf(data: Dictionary) -> StaticBody2D:
	var shelf = StaticBody2D.new()
	shelf.set_script(preload("res://scripts/interactables/Shelf.gd"))
	shelf.position = data["pos"]
	shelf.set("shelf_id", data["id"])
	shelf.set("has_error", data["has_error"])
	shelf.set("expected_label", data["expected"])
	shelf.set("actual_label", data["actual"])
	var collision = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(70, 90)
	collision.shape = rect
	collision.position = Vector2(0, 0)
	shelf.add_child(collision)
	var visual_bg = ColorRect.new()
	visual_bg.size = Vector2(70, 90)
	visual_bg.position = Vector2(-35, -45)
	var col = Color(0.55, 0.45, 0.3)
	if data["has_error"]:
		col = Color(0.65, 0.4, 0.3)
	visual_bg.color = col
	shelf.add_child(visual_bg)
	for i in range(3):
		var shelf_line = ColorRect.new()
		shelf_line.size = Vector2(66, 4)
		shelf_line.position = Vector2(-33, -40 + i * 30)
		shelf_line.color = Color(0.35, 0.28, 0.18)
		shelf.add_child(shelf_line)
	var label_text = Label.new()
	label_text.name = "Label"
	label_text.text = "%s\n%s" % [data["id"], data["actual"]]
	label_text.custom_minimum_size = Vector2(80, 50)
	label_text.position = Vector2(-40, -35)
	label_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label_text.add_theme_font_size_override("font_size", 11)
	shelf.add_child(label_text)
	var status = ColorRect.new()
	status.name = "StatusIndicator"
	status.size = Vector2(14, 14)
	status.position = Vector2(25, -48)
	status.color = Color(0.8, 0.8, 0.8)
	shelf.add_child(status)
	var err_marker = ColorRect.new()
	err_marker.name = "ErrorMarker"
	err_marker.size = Vector2(18, 18)
	err_marker.position = Vector2(-40, -48)
	err_marker.color = Color(1, 0.3, 0.3)
	err_marker.visible = data["has_error"]
	shelf.add_child(err_marker)
	var hl = ColorRect.new()
	hl.name = "Highlight"
	hl.size = Vector2(76, 96)
	hl.position = Vector2(-38, -48)
	hl.color = Color(1, 1, 1, 0)
	hl.visible = false
	shelf.add_child(hl)
	var prompt = Label.new()
	prompt.name = "InteractPrompt"
	prompt.text = "[E]修复"
	prompt.custom_minimum_size = Vector2(70, 20)
	prompt.position = Vector2(-35, -75)
	prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt.add_theme_font_size_override("font_size", 11)
	prompt.modulate = Color(0.5, 1, 0.5)
	prompt.visible = false
	shelf.add_child(prompt)
	return shelf

func _spawn_patrols(patrols_data: Array):
	for data in patrols_data:
		var patrol = _build_patrol_light(data)
		patrols_container.add_child(patrol)
		patrol.set("player", player)

func _build_patrol_light(data: Dictionary) -> Node2D:
	var patrol = Node2D.new()
	patrol.set_script(preload("res://scripts/enemies/PatrolLight.gd"))
	patrol.set("move_speed", data.get("speed", 60))
	patrol.set("view_distance", data.get("view_dist", 200))
	patrol.set("view_angle", data.get("view_angle", 45))
	patrol.set("patrol_points", data.get("points", []))
	var light_sprite = ColorRect.new()
	light_sprite.name = "LightSprite"
	light_sprite.size = Vector2(28, 28)
	light_sprite.position = Vector2(-14, -14)
	light_sprite.color = Color(1, 0.85, 0.3)
	light_sprite.add_theme_color_override("font_color", Color.BLACK)
	patrol.add_child(light_sprite)
	var lbl = Label.new()
	lbl.text = "💡"
	lbl.custom_minimum_size = Vector2(28, 28)
	lbl.position = Vector2(-14, -12)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 16)
	patrol.add_child(lbl)
	var segments = 28
	var points_arr: PackedVector2Array = PackedVector2Array()
	points_arr.append(Vector2.ZERO)
	var vd = data.get("view_dist", 200)
	var va = data.get("view_angle", 45)
	var start_angle = -deg_to_rad(va / 2)
	var end_angle = deg_to_rad(va / 2)
	for i in range(segments + 1):
		var angle = lerp(start_angle, end_angle, float(i) / segments)
		var point = Vector2(cos(angle), sin(angle)) * vd
		points_arr.append(point)
	var vision_cone = Polygon2D.new()
	vision_cone.name = "VisionCone"
	vision_cone.polygon = points_arr
	vision_cone.color = Color(1.0, 0.9, 0.2, 0.25)
	patrol.add_child(vision_cone)
	var vision_area = Area2D.new()
	vision_area.name = "VisionArea"
	var vision_shape = CollisionPolygon2D.new()
	vision_shape.polygon = points_arr
	vision_area.add_child(vision_shape)
	patrol.add_child(vision_area)
	if data.get("points", []).size() > 0:
		patrol.global_position = data["points"][0]
	return patrol

func _spawn_checkpoints(checkpoints_data: Array):
	for data in checkpoints_data:
		var cp = _build_checkpoint(data)
		checkpoints_container.add_child(cp)

func _build_checkpoint(data: Dictionary) -> Area2D:
	var cp = Area2D.new()
	cp.set_script(preload("res://scripts/interactables/Checkpoint.gd"))
	cp.position = data["pos"]
	cp.set("checkpoint_id", data["id"])
	var collision = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(60, 60)
	collision.shape = rect
	cp.add_child(collision)
	var visual = ColorRect.new()
	visual.name = "Visual"
	visual.size = Vector2(60, 60)
	visual.position = Vector2(-30, -30)
	visual.color = Color(0.3, 0.3, 1.0, 0.4)
	cp.add_child(visual)
	var lbl = Label.new()
	lbl.name = "Label"
	lbl.text = "检查点 %d" % data["id"]
	lbl.custom_minimum_size = Vector2(80, 30)
	lbl.position = Vector2(-40, -15)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 12)
	cp.add_child(lbl)
	var flag = ColorRect.new()
	flag.size = Vector2(6, 40)
	flag.position = Vector2(18, -50)
	flag.color = Color(0.3, 0.3, 1.0)
	cp.add_child(flag)
	var flag_top = ColorRect.new()
	flag_top.size = Vector2(20, 14)
	flag_top.position = Vector2(21, -50)
	flag_top.color = Color(0.5, 0.5, 1.0)
	cp.add_child(flag_top)
	return cp

func _setup_player():
	if player:
		player.global_position = current_level_data.get("player_spawn", Vector2(100, 600))
		player.set("respawn_position", player.global_position)

func _setup_goal():
	if goal:
		goal.global_position = current_level_data.get("goal_position", Vector2(1200, 100))
		goal.set("required_scans", current_level_data.get("required_scans", 3))
		goal.set("required_fixes", current_level_data.get("required_fixes", 1))

func _setup_objectives():
	GameManager.set_objectives(
		current_level_data.get("required_scans", 3),
		current_level_data.get("required_fixes", 1)
	)

func reset_to_checkpoint():
	var cp = GameManager.get_current_checkpoint()
	if cp.has("position"):
		player.global_position = Vector2(cp["position"]["x"], cp["position"]["y"])
		player.set("current_energy", cp.get("energy", player.get("max_energy")))
	player.set("velocity", Vector2.ZERO)
	DebugLog.info("重置到检查点")
