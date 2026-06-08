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
var _failure_count: int = 0
var _guards: Array[PatrolGuard] = []

signal segment_completed(segment_index: int)
signal level_completed()

var _level_completed_flag: bool = false

func _ready() -> void:
	_level_data = LevelManager.get_level_data()
	if _level_data.is_empty():
		push_warning("No level data available")
		return
	_current_segment_index = LevelManager.current_segment_index
	AnalyticsManager.start_level_tracking(LevelManager.current_level_id)
	LevelManager.level_completed.connect(_on_level_manager_completed)
	_spawn_level_objects()
	_connect_player_signals()

func _process(delta: float) -> void:
	_play_time += delta
	if hud and hud.has_method("update_timer"):
		hud.update_timer(_play_time)
	if hud and hud.has_method("set_alert"):
		var any_alert := false
		for g in _guards:
			if g.current_state == PatrolGuard.State.ALERT or g.current_state == PatrolGuard.State.CHASING:
				any_alert = true
				break
		hud.set_alert(any_alert)

func _spawn_level_objects() -> void:
	clear_level_objects()
	_guards.clear()
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
			_guards.append(g)
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
	_failure_count += 1
	_is_resetting = false
	_level_completed_flag = false
	AnalyticsManager.record_failure("seg_%d" % _current_segment_index)

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
	if _level_completed_flag:
		return
	var segments = _level_data.get("segments", [])
	if _current_segment_index >= segments.size() - 1:
		SaveManager.save_game({
			"current_level": LevelManager.current_level_id,
			"current_segment": _current_segment_index,
			"fixed_labels": _fixed_count,
			"total_labels": _total_labels,
			"play_time": _play_time,
			"failure_count": _failure_count
		})
		_on_level_completed()
	else:
		LevelManager.advance_segment()
		_current_segment_index = LevelManager.current_segment_index
		SaveManager.save_game({
			"current_level": LevelManager.current_level_id,
			"current_segment": _current_segment_index,
			"fixed_labels": _fixed_count,
			"total_labels": _total_labels,
			"play_time": _play_time,
			"failure_count": _failure_count
		})
		_spawn_level_objects()

func _on_label_fixed(shelf_id: String) -> void:
	_fixed_count += 1
	AnalyticsManager.record_label_fixed(shelf_id)
	_update_hud()
	UIManager.show_notification("标签已修复: %s" % shelf_id, 1.5)

func _on_level_manager_completed() -> void:
	pass

func _on_level_completed() -> void:
	if _level_completed_flag:
		return
	_level_completed_flag = true
	AnalyticsManager.end_level_tracking()
	AnalyticsManager.record_choice("level_complete", {
		"level_id": LevelManager.current_level_id,
		"play_time": _play_time,
		"failure_count": _failure_count,
		"labels_fixed": _fixed_count,
		"total_labels": _total_labels
	})
	UIManager.show_notification("关卡完成! 用时: %.1fs 失败: %d次" % [_play_time, _failure_count], 3.0)
	level_completed.emit()
	await get_tree().create_timer(3.0).timeout
	SceneManager.request_scene("level_select")

func _connect_player_signals() -> void:
	player.energy_changed.connect(_on_energy_changed)
	player.noise_made.connect(_on_noise_made)
	player.discovered.connect(_on_player_discovered)
	player.shelf_scanned.connect(_on_shelf_scanned)

func _on_energy_changed(current: float, max_val: float) -> void:
	if hud and hud.has_method("update_energy"):
		hud.update_energy(current, max_val)

func _on_noise_made(radius: float, pos: Vector2) -> void:
	if hud and hud.has_method("update_noise_level"):
		hud.update_noise_level(radius)
	if scan_effect and scan_effect.has_method("play"):
		scan_effect.play(player.global_position)
	_alert_guards_by_noise(radius, pos)

func _alert_guards_by_noise(radius: float, noise_pos: Vector2) -> void:
	for guard in _guards:
		if not is_instance_valid(guard):
			continue
		var dist: float = guard.global_position.distance_to(noise_pos)
		if dist <= radius:
			guard.alert(noise_pos)

func _on_shelf_scanned(shelf_id: String) -> void:
	UIManager.show_notification("扫描到: %s" % shelf_id, 1.0)

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
