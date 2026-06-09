extends Node2D

class_name PatrolLight

@export var patrol_points: Array = []
@export var move_speed: float = 60.0
@export var wait_time: float = 1.5
@export var view_distance: float = 250.0
@export var view_angle: float = 45.0
@export var rotate_speed: float = 1.5
@export var noise_threshold: float = 0.6
@export var noise_detect_range: float = 180.0
@export var alert_duration: float = 0.8

enum State {
	PATROLLING,
	WAITING,
	ALERT,
	INVESTIGATING
}

var current_state: int = State.PATROLLING
var current_point_index: int = 0
var wait_timer: float = 0.0
var alert_timer: float = 0.0
var investigate_point: Vector2 = Vector2.ZERO
var investigate_timer: float = 0.0
var target_rotation: float = 0.0
var current_rotation: float = 0.0
var player: Node2D = null
var is_player_detected: bool = false
var direction: Vector2 = Vector2.RIGHT

@onready var vision_cone: Polygon2D = $VisionCone
@onready var vision_area: Area2D = $VisionArea
@onready var light_sprite: ColorRect = $LightSprite

func _ready():
	_setup_vision_cone()
	_connect_signals()
	if patrol_points.size() > 0:
		global_position = patrol_points[0]
	DebugLog.debug("巡逻灯初始化 - %d 个巡逻点" % patrol_points.size())

func _setup_vision_cone():
	if not vision_cone:
		return
	var segments = 24
	var points_arr: PackedVector2Array = PackedVector2Array()
	points_arr.append(Vector2.ZERO)
	var start_angle = -deg_to_rad(view_angle / 2)
	var end_angle = deg_to_rad(view_angle / 2)
	for i in range(segments + 1):
		var angle = lerp(start_angle, end_angle, float(i) / segments)
		var point = Vector2(cos(angle), sin(angle)) * view_distance
		points_arr.append(point)
	vision_cone.polygon = points_arr
	vision_cone.color = Color(1.0, 0.9, 0.2, 0.25)

func _connect_signals():
	if vision_area:
		vision_area.body_entered.connect(_on_body_entered_vision)
		vision_area.body_exited.connect(_on_body_exited_vision)

func _process(delta):
	if not GameManager.is_playing():
		return
	_update_state(delta)
	_update_rotation(delta)
	_update_vision_cone_visuals()
	_check_noise_detection()
	_check_raycast_to_player()

func _update_state(delta):
	match current_state:
		State.PATROLLING:
			_do_patrol(delta)
		State.WAITING:
			wait_timer -= delta
			if wait_timer <= 0:
				_advance_patrol_point()
		State.ALERT:
			alert_timer -= delta
			vision_cone.color = Color(1.0, 0.2, 0.2, 0.4)
			if player and is_instance_valid(player):
				var to_p = player.global_position - global_position
				target_rotation = atan2(to_p.y, to_p.x)
			if alert_timer <= 0:
				if is_player_detected and player:
					_trigger_detection()
				else:
					current_state = State.INVESTIGATING
					investigate_point = player.global_position if player else global_position + direction * 100
					investigate_timer = 3.0
		State.INVESTIGATING:
			_do_investigate(delta)
			investigate_timer -= delta
			if investigate_timer <= 0:
				current_state = State.PATROLLING
				vision_cone.color = Color(1.0, 0.9, 0.2, 0.25)

func _do_investigate(delta):
	var to_target = investigate_point - global_position
	var dist = to_target.length()
	if dist > 8.0:
		direction = to_target.normalized()
		global_position += direction * move_speed * 0.8 * delta
		target_rotation = atan2(direction.y, direction.x)

func _do_patrol(delta):
	if patrol_points.size() < 2:
		return
	var target_point = patrol_points[current_point_index]
	var to_target = target_point - global_position
	var dist = to_target.length()
	if dist < 5.0:
		current_state = State.WAITING
		wait_timer = wait_time
	else:
		direction = to_target.normalized()
		global_position += direction * move_speed * delta
		target_rotation = atan2(direction.y, direction.x)

func _advance_patrol_point():
	current_point_index = (current_point_index + 1) % patrol_points.size()
	current_state = State.PATROLLING

func _update_rotation(delta):
	var delta_angle = wrapf(target_rotation - current_rotation, -PI, PI)
	current_rotation += delta_angle * rotate_speed * delta
	rotation = current_rotation

func _update_vision_cone_visuals():
	if vision_cone:
		if current_state == State.ALERT:
			vision_cone.color = Color(1.0, 0.2, 0.2, 0.4)
		elif current_state == State.INVESTIGATING:
			vision_cone.color = Color(1.0, 0.6, 0.2, 0.3)
		else:
			vision_cone.color = Color(1.0, 0.9, 0.2, 0.25)

var _noise_log_throttle: float = 0.0
var _last_noise_logged: float = -1.0

func _check_noise_detection():
	if not player or not is_instance_valid(player):
		return
	var pl_noise: float = 0.0
	if "noise_level" in player:
		pl_noise = player.get("noise_level")
	var pl_sprinting: bool = false
	if "is_sprinting" in player:
		pl_sprinting = player.get("is_sprinting")
	var dist = global_position.distance_to(player.global_position)
	var effective_range = noise_detect_range * (1.0 + pl_noise * 0.8)
	var triggered = dist < effective_range and (pl_noise > noise_threshold or (pl_sprinting and dist < noise_detect_range * 1.2))
	if triggered:
		if current_state != State.ALERT and current_state != State.INVESTIGATING:
			current_state = State.INVESTIGATING
			investigate_point = player.global_position + Vector2(randf_range(-40, 40), randf_range(-40, 40))
			investigate_timer = 3.0
			DebugLog.warning("🔊 巡逻灯触发调查：噪音=%.1f(阈值%.1f) 距离=%d 冲刺=%s → 前往调查" % [pl_noise, noise_threshold, int(dist), str(pl_sprinting)])
		elif current_state == State.INVESTIGATING:
			investigate_timer = max(investigate_timer, 1.5)
			if dist < noise_detect_range * 0.5 and pl_noise > noise_threshold + 0.2:
				investigate_point = player.global_position
	else:
		_noise_log_throttle = max(0, _noise_log_throttle - 0.1)

func _trigger_alert():
	if current_state != State.ALERT:
		current_state = State.ALERT
		alert_timer = alert_duration
		AudioManager.play_sfx("alert", 1.0, 0.5)
		var dist = 0
		if player:
			dist = int(global_position.distance_to(player.global_position))
		DebugLog.error("👁 巡逻灯发现玩家！距离=%dpx，警报%.1f秒后触发检测" % [dist, alert_duration])

func _trigger_detection():
	DebugLog.error("⚠️ 玩家被发现！回退到最近检查点")
	if player and player.has_method("on_detected"):
		player.on_detected()
	current_state = State.WAITING
	wait_timer = 1.0
	vision_cone.color = Color(1.0, 0.9, 0.2, 0.25)

func _check_raycast_to_player():
	if not player or not is_instance_valid(player):
		return
	if not is_player_detected:
		return
	if not _is_player_in_view_cone():
		is_player_detected = false
		if current_state == State.ALERT:
			alert_timer = max(alert_timer, 0.3)
		return
	var space = get_world_2d().direct_space_state
	var query = PhysicsRayQueryParameters2D.create(
		global_position,
		player.global_position,
		1,
		[self, player]
	)
	var result = space.intersect_ray(query)
	if result.is_empty():
		_trigger_alert()

func _is_player_in_view_cone() -> bool:
	if not player:
		return false
	var to_player = (player.global_position - global_position)
	var dist = to_player.length()
	if dist > view_distance:
		return false
	var forward = Vector2(cos(current_rotation), sin(current_rotation))
	var angle_between = acos(clamp(forward.dot(to_player.normalized()), -1, 1))
	return angle_between < deg_to_rad(view_angle / 2)

func _on_body_entered_vision(body):
	if body.has_method("on_detected"):
		player = body
		is_player_detected = true

func _on_body_exited_vision(body):
	if body == player:
		is_player_detected = false

func set_patrol_points(points: Array):
	patrol_points = points
	if points.size() > 0:
		global_position = points[0]

func get_detection_status() -> bool:
	return current_state == State.ALERT
