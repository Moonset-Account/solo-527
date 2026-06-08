extends Node2D
## 巡逻灯控制器 - 带巡逻路线、视野检测、噪音感知

@export var patrol_points: PackedVector2Array = []
@export var patrol_speed: float = 60.0
@export var idle_time_at_point: float = 1.5
@export var rotation_speed_deg: float = 90.0
@export var base_view_distance: float = 220.0
@export var base_view_angle: float = 65.0
@export var alerted_view_distance: float = 300.0
@export var alerted_view_angle: float = 85.0
@export var noise_sensitivity: float = 0.4
@export var noise_turn_duration: float = 1.2
@export var catch_delay: float = 0.8

enum PatrolState { PATROLLING, IDLE, INVESTIGATING_NOISE, ALERTED, CAUGHT }

var current_state: PatrolState = PatrolState.PATROLLING
var current_patrol_index: int = 0
var current_target_point: Vector2 = Vector2.ZERO
var idle_timer: float = 0.0
var target_rotation: float = 0.0
var current_direction: Vector2 = Vector2.RIGHT

var vision_cone: Node = null
var noise_system: Node = null
var player_ref: Node2D = null

var _investigation_timer: float = 0.0
var _investigation_target: Vector2 = Vector2.ZERO
var _catch_timer: float = 0.0
var _is_catching: bool = false
var _noise_cue_timer: float = 0.0

var _segment_restore_data: Dictionary = {}

@onready var light_base_sprite: Sprite2D = $LightBaseSprite
@onready var light_indicator: Node2D = $LightIndicator

func _ready() -> void:
	_setup_vision_cone()
	_connect_events()
	if patrol_points.size() > 0:
		current_patrol_index = 0
		current_target_point = patrol_points[0]
		global_position = patrol_points[0] if global_position == Vector2.ZERO else global_position
	_save_segment_state()

func _setup_vision_cone() -> void:
	var vision_script := load("res://scripts/enemies/VisionCone.gd")
	vision_cone = vision_script.new()
	vision_cone.view_distance = base_view_distance
	vision_cone.view_angle_degrees = base_view_angle
	vision_cone.set_color(Color(1.0, 0.85, 0.2, 0.22))
	vision_cone.alert_color = Color(1.0, 0.2, 0.15, 0.5)
	add_child(vision_cone)
	vision_cone.detection_callback = Callable(self, "_on_player_detected_direct")
	_setup_noise_sensor()

func _setup_noise_sensor() -> void:
	var noise_area := Area2D.new()
	noise_area.name = "NoiseSensorArea"
	noise_area.collision_layer = 32
	noise_area.collision_mask = 32
	add_child(noise_area)
	var sensor_shape := CircleShape2D.new()
	sensor_shape.radius = base_view_distance * 1.5
	var col := CollisionShape2D.new()
	col.shape = sensor_shape
	noise_area.add_child(col)

func _connect_events() -> void:
	EventBus.noise_triggered.connect(_on_noise_triggered)
	EventBus.segment_reset.connect(_on_segment_reset)

func _process(delta: float) -> void:
	if not GameManager.is_playing():
		return
	_locate_systems()
	_update_state_machine(delta)
	_update_light_visual(delta)
	_check_noise_sensor(delta)

func _locate_systems() -> void:
	if not noise_system:
		var parent_scene := get_tree().current_scene
		if parent_scene:
			noise_system = parent_scene.get_node_or_null("Systems/NoiseSystem")

func _update_state_machine(delta: float) -> void:
	match current_state:
		PatrolState.PATROLLING:
			_process_patrolling(delta)
		PatrolState.IDLE:
			_process_idle(delta)
		PatrolState.INVESTIGATING_NOISE:
			_process_investigating(delta)
		PatrolState.ALERTED:
			_process_alerted(delta)
		PatrolState.CAUGHT:
			_process_caught(delta)

func _process_patrolling(delta: float) -> void:
	if patrol_points.size() < 2:
		return
	if global_position.distance_to(current_target_point) < 5.0:
		current_patrol_index = (current_patrol_index + 1) % patrol_points.size()
		current_target_point = patrol_points[current_patrol_index]
		current_state = PatrolState.IDLE
		idle_timer = idle_time_at_point
		return
	var to_target := current_target_point - global_position
	var move_dir := to_target.normalized()
	current_direction = move_dir
	target_rotation = move_dir.angle()
	global_position += move_dir * patrol_speed * delta
	_smooth_rotate(delta)

func _process_idle(delta: float) -> void:
	idle_timer -= delta
	_smooth_rotate(delta)
	if idle_timer <= 0.0:
		current_state = PatrolState.PATROLLING

func _process_investigating(delta: float) -> void:
	_investigation_timer -= delta
	_smooth_rotate(delta)
	if _investigation_timer <= 0.0:
		current_state = PatrolState.PATROLLING
		_reset_vision_normal()

func _process_alerted(delta: float) -> void:
	if player_ref:
		var to_player := player_ref.global_position - global_position
		target_rotation = to_player.angle()
		current_direction = to_player.normalized()
	_smooth_rotate(delta)
	if not vision_cone.has_detected_player():
		_catch_timer -= delta
		if _catch_timer <= 0.0:
			current_state = PatrolState.INVESTIGATING_NOISE
			_investigation_timer = 2.0
			if player_ref:
				_investigation_target = player_ref.global_position
			_reset_vision_normal()

func _process_caught(delta: float) -> void:
	if _catch_timer > 0.0:
		_catch_timer -= delta
		if _catch_timer <= 0.0 and not _is_catching:
			_is_catching = true
			EventBus.emit_player_caught()

func _smooth_rotate(delta: float) -> void:
	var rot_diff := wrapf(target_rotation - rotation, -PI, PI)
	var max_step := deg_to_rad(rotation_speed_deg) * delta
	if abs(rot_diff) < max_step:
		rotation = target_rotation
	else:
		rotation += sign(rot_diff) * max_step
	current_direction = Vector2.RIGHT.rotated(rotation)

func _update_light_visual(delta: float) -> void:
	if light_indicator:
		var indicator_color: Color
		match current_state:
			PatrolState.ALERTED, PatrolState.CAUGHT:
				indicator_color = Color(1, 0.2, 0.2)
			PatrolState.INVESTIGATING_NOISE:
				indicator_color = Color(1, 0.7, 0.2)
			_:
				indicator_color = Color(1, 0.95, 0.3)
		if light_indicator is ColorRect:
			light_indicator.color = indicator_color
		elif light_indicator is Polygon2D:
			var pulse := 1.0 + 0.1 * sin(Time.get_ticks_msec() * 0.005)
			light_indicator.scale = Vector2(pulse, pulse)
	if _noise_cue_timer > 0.0:
		_noise_cue_timer -= delta
		if noise_cue_visible:
			pass

func _check_noise_sensor(delta: float) -> void:
	if not noise_system:
		return
	if current_state == PatrolState.ALERTED or current_state == PatrolState.CAUGHT:
		return
	var noise_range := base_view_distance * 1.5
	var strongest_noise := noise_system.get_strongest_noise_in_range(global_position, noise_range)
	if not strongest_noise.is_empty():
		var str: float = strongest_noise.get("strength", 0.0)
		if str > noise_sensitivity:
			var pos: Vector2 = strongest_noise.get("position", global_position)
			_investigate_noise(pos, str)

func _investigate_noise(noise_pos: Vector2, strength: float) -> void:
	if current_state == PatrolState.INVESTIGATING_NOISE:
		return
	var prev_state := current_state
	current_state = PatrolState.INVESTIGATING_NOISE
	_investigation_timer = noise_turn_duration * (0.5 + strength)
	_investigation_target = noise_pos
	var to_noise := noise_pos - global_position
	target_rotation = to_noise.angle()
	vision_cone.view_distance = lerp(vision_cone.view_distance, base_view_distance * 1.2, 0.3)
	_noise_cue_timer = 0.5

func _on_player_detected_direct(_body: Node2D) -> void:
	if current_state == PatrolState.CAUGHT:
		return
	var was_alerted := current_state == PatrolState.ALERTED
	current_state = PatrolState.ALERTED
	_catch_timer = catch_delay
	vision_cone.view_distance = alerted_view_distance
	vision_cone.view_angle_degrees = alerted_view_angle
	if not was_alerted:
		EventBus.emit_alert_level_changed(min(3, GameManager.alert_level + 1))
		GameManager.alert_level = min(3, GameManager.alert_level + 1)
		EventBus.emit_player_detected()
		EventBus.emit_sfx_play("detected")

func _reset_vision_normal() -> void:
	if vision_cone:
		vision_cone.view_distance = base_view_distance
		vision_cone.view_angle_degrees = base_view_angle

func _on_noise_triggered(pos: Vector2, strength: float) -> void:
	pass

func set_player(player: Node2D) -> void:
	player_ref = player

func _save_segment_state() -> void:
	_segment_restore_data = {
		"position": global_position,
		"rotation": rotation,
		"patrol_index": current_patrol_index,
		"state": PatrolState.PATROLLING,
	}
	if patrol_points.size() > 0:
		_segment_restore_data["target_point"] = patrol_points[current_patrol_index]

func _on_segment_reset() -> void:
	if _segment_restore_data.is_empty():
		return
	if _segment_restore_data.has("position"):
		global_position = _segment_restore_data["position"]
	if _segment_restore_data.has("rotation"):
		rotation = _segment_restore_data["rotation"]
		target_rotation = rotation
		current_direction = Vector2.RIGHT.rotated(rotation)
	if _segment_restore_data.has("patrol_index"):
		current_patrol_index = _segment_restore_data["patrol_index"]
		if patrol_points.size() > 0:
			current_target_point = patrol_points[current_patrol_index]
	current_state = PatrolState.PATROLLING
	_is_catching = false
	_catch_timer = 0.0
	idle_timer = 0.0
	_reset_vision_normal()

func checkpoint_reached() -> void:
	_save_segment_state()
