extends Node2D
class_name GameController

@onready var level_container: Node2D = $LevelContainer
@onready var player: CharacterBody2D = $Player
@onready var hud: CanvasLayer = $HUD
@onready var scan_effect: Node2D = $ScanEffect

var _play_time: float = 0.0
var _current_segment_index: int = 0
var _level_data: Dictionary = {}
var _fixed_count: int = 0
var _total_labels: int = 0
var _spawn_position: Vector2 = Vector2(100, 360)
var _is_resetting: bool = false

signal segment_completed(segment_index: int)
signal level_completed()

func _ready() -> void:
	_level_data = LevelManager.get_level_data()
	if _level_data.is_empty():
		push_warning("No level data available")
		return
	_current_segment_index = LevelManager.current_segment_index
	AnalyticsManager.start_level_tracking(LevelManager.current_level_id)
	_spawn_level_objects()
	_connect_player_signals()

func _process(delta: float) -> void:
	_play_time += delta
	if hud and hud.has_method("update_timer"):
		hud.update_timer(_play_time)

func _spawn_level_objects() -> void:
	clear_level_objects()
	var segment: Dictionary = LevelManager.get_current_segment()
	if segment.is_empty():
		return
	_fixed_count = 0
	_total_labels = 0
	if segment.has("player_start"):
		var ps = segment["player_start"]
		_spawn_position = Vector2(float(ps.get("x", 100)), float(ps.get("y", 360)))
		player.global_position = _spawn_position
	if segment.has("walls"):
		for wall_data in segment["walls"]:
			var w := _create_wall(wall_data)
			level_container.add_child(w)
	if segment.has("shelves"):
		for shelf_data in segment["shelves"]:
			var s := _create_shelf(shelf_data)
			level_container.add_child(s)
			s.label_fixed.connect(_on_label_fixed)
			_total_labels += 1
	if segment.has("guards"):
		for guard_data in segment["guards"]:
			var g := _create_guard(guard_data)
			level_container.add_child(g)
			g.player_spotted.connect(_on_player_spotted)
	if segment.has("checkpoints"):
		for cp_data in segment["checkpoints"]:
			var cp := _create_checkpoint(cp_data)
			level_container.add_child(cp)
			cp.checkpoint_reached.connect(_on_checkpoint_reached)
	_update_hud()

func clear_level_objects() -> void:
	for child in level_container.get_children():
		child.queue_free()

func reset_segment() -> void:
	LevelManager.reset_current_segment()
	_spawn_level_objects()
	player.reset_to_checkpoint(_spawn_position)

func _on_player_spotted(_pos: Vector2) -> void:
	player.apply_discovery()

func _on_player_discovered() -> void:
	if _is_resetting:
		return
	_is_resetting = true
	AnalyticsManager.record_discovery("seg_%d" % _current_segment_index)
	await get_tree().create_timer(1.5).timeout
	reset_segment()
	_is_resetting = false

func _on_checkpoint_reached(_cp_id: String, _pos: Vector2) -> void:
	LevelManager.advance_segment()
	_current_segment_index = LevelManager.current_segment_index
	SaveManager.save_game({
		"current_level": LevelManager.current_level_id,
		"current_segment": _current_segment_index,
		"fixed_labels": _fixed_count,
		"total_labels": _total_labels,
		"play_time": _play_time
	})
	var segments = _level_data.get("segments", [])
	if _current_segment_index >= segments.size():
		_on_level_completed()
	else:
		_spawn_level_objects()

func _on_label_fixed(shelf_id: String) -> void:
	_fixed_count += 1
	AnalyticsManager.record_label_fixed(shelf_id)
	_update_hud()

func _on_level_completed() -> void:
	AnalyticsManager.end_level_tracking()
	level_completed.emit()
	SceneManager.request_scene("level_select")

func _connect_player_signals() -> void:
	player.energy_changed.connect(_on_energy_changed)
	player.noise_made.connect(_on_noise_made)
	player.discovered.connect(_on_player_discovered)

func _on_energy_changed(current: float, max_val: float) -> void:
	if hud and hud.has_method("update_energy"):
		hud.update_energy(current, max_val)

func _on_noise_made(radius: float, _pos: Vector2) -> void:
	if hud and hud.has_method("update_noise_level"):
		hud.update_noise_level(radius)
	if scan_effect and scan_effect.has_method("play"):
		scan_effect.play(player.global_position)

func _update_hud() -> void:
	if hud and hud.has_method("update_labels"):
		hud.update_labels(_fixed_count, _total_labels)
	if hud and hud.has_method("update_segment"):
		var total = _level_data.get("segments", []).size()
		hud.update_segment(_current_segment_index + 1, total)

func _create_wall(data: Dictionary) -> StaticBody2D:
	var w := Wall.new()
	var pos = data.get("position", {"x": 0, "y": 0})
	w.global_position = Vector2(float(pos.get("x", 0)), float(pos.get("y", 0)))
	var size = data.get("size", {"w": 64, "h": 64})
	w.wall_size = Vector2(float(size.get("w", 64)), float(size.get("h", 64)))
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = w.wall_size
	shape.shape = rect
	w.add_child(shape)
	return w

func _create_shelf(data: Dictionary) -> StaticBody2D:
	var s := Shelf.new()
	var pos = data.get("position", {"x": 0, "y": 0})
	s.global_position = Vector2(float(pos.get("x", 0)), float(pos.get("y", 0)))
	s.shelf_id = data.get("id", "")
	s.correct_label = data.get("correct_label", "")
	s.current_label = data.get("current_label", "")
	s.is_fixed = data.get("is_fixed", false)
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(48, 64)
	shape.shape = rect
	s.add_child(shape)
	return s

func _create_guard(data: Dictionary) -> CharacterBody2D:
	var g := PatrolGuard.new()
	var patrol_raw = data.get("patrol_points", [])
	var points: Array[Vector2] = []
	for pt in patrol_raw:
		points.append(Vector2(float(pt.get("x", 0)), float(pt.get("y", 0))))
	if points.size() > 0:
		g.global_position = points[0]
	g.patrol_points = points
	g.guard_id = data.get("id", "")
	g.patrol_speed = float(data.get("speed", 80))
	g.vision_range = float(data.get("vision_range", 200))
	g.vision_angle = float(data.get("vision_angle", 45))
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(28, 28)
	shape.shape = rect
	g.add_child(shape)
	return g

func _create_checkpoint(data: Dictionary) -> Area2D:
	var cp := Checkpoint.new()
	var pos = data.get("position", {"x": 0, "y": 0})
	cp.global_position = Vector2(float(pos.get("x", 0)), float(pos.get("y", 0)))
	cp.checkpoint_id = data.get("id", "")
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(32, 32)
	shape.shape = rect
	cp.add_child(shape)
	return cp
