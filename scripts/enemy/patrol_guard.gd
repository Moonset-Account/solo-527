extends CharacterBody2D
class_name PatrolGuard

enum State { PATROLLING, ALERT, CHASING, RETURNING }

@export var patrol_speed: float = 80
@export var vision_range: float = 200
@export var vision_angle: float = 45.0
@export var vision_color: Color = Color(1, 0.8, 0, 0.3)
@export var patrol_points: Array[Vector2] = []
@export var guard_id: String = ""

signal player_spotted(position: Vector2)
signal lost_sight

var current_state: State = State.PATROLLING
var current_patrol_index: int = 0
var alert_timer: float = 0.0
var last_known_position: Vector2 = Vector2.ZERO
var move_direction: Vector2 = Vector2.RIGHT
var vision_cone: VisionCone

func _ready() -> void:
	collision_layer = 0
	set_collision_layer_value(2, true)
	collision_mask = 0
	set_collision_mask_value(1, true)
	set_collision_mask_value(3, true)
	set_collision_mask_value(4, true)
	vision_cone = VisionCone.new()
	vision_cone.vision_range = vision_range
	vision_cone.vision_angle = vision_angle
	vision_cone.vision_color = vision_color
	vision_cone.player_detected.connect(_on_vision_cone_player_detected)
	add_child(vision_cone)
	if patrol_points.size() > 0:
		global_position = patrol_points[0]

func _physics_process(delta: float) -> void:
	match current_state:
		State.PATROLLING:
			_process_patrolling()
		State.ALERT:
			_process_alert(delta)
		State.CHASING:
			_process_chasing()
		State.RETURNING:
			_process_returning()
	if current_state == State.ALERT:
		var look_angle: float = move_direction.angle() + sin(alert_timer * PI * 2.0) * PI * 0.5
		vision_cone.set_direction(look_angle)
	else:
		vision_cone.set_direction(move_direction.angle())
	queue_redraw()

func _process_patrolling() -> void:
	if patrol_points.is_empty():
		velocity = Vector2.ZERO
		move_and_slide()
		return
	var target: Vector2 = patrol_points[current_patrol_index]
	var direction: Vector2 = target - global_position
	if direction.length() < 5.0:
		current_patrol_index = (current_patrol_index + 1) % patrol_points.size()
		target = patrol_points[current_patrol_index]
		direction = target - global_position
	if direction.length() > 0:
		move_direction = direction.normalized()
	velocity = move_direction * patrol_speed
	move_and_slide()

func _process_alert(delta: float) -> void:
	velocity = Vector2.ZERO
	move_and_slide()
	alert_timer -= delta
	if alert_timer <= 0.0:
		if vision_cone.is_player_visible:
			current_state = State.CHASING
		else:
			current_state = State.RETURNING
			emit_signal("lost_sight")

func _process_chasing() -> void:
	if vision_cone.is_player_visible:
		last_known_position = vision_cone.player_position
	var direction: Vector2 = last_known_position - global_position
	var distance: float = direction.length()
	if distance < 5.0:
		if not vision_cone.is_player_visible:
			current_state = State.RETURNING
			emit_signal("lost_sight")
			velocity = Vector2.ZERO
			move_and_slide()
			return
	if direction.length() > 0:
		move_direction = direction.normalized()
	velocity = move_direction * patrol_speed * 1.5
	move_and_slide()

func _process_returning() -> void:
	if patrol_points.is_empty():
		velocity = Vector2.ZERO
		move_and_slide()
		return
	var nearest_index: int = _get_nearest_patrol_index()
	var target: Vector2 = patrol_points[nearest_index]
	var direction: Vector2 = target - global_position
	if direction.length() < 5.0:
		current_patrol_index = nearest_index
		current_state = State.PATROLLING
		velocity = Vector2.ZERO
		move_and_slide()
		return
	if direction.length() > 0:
		move_direction = direction.normalized()
	velocity = move_direction * patrol_speed
	move_and_slide()

func _get_nearest_patrol_index() -> int:
	var nearest: int = 0
	var min_dist: float = INF
	for i in patrol_points.size():
		var dist: float = global_position.distance_to(patrol_points[i])
		if dist < min_dist:
			min_dist = dist
			nearest = i
	return nearest

func alert(position: Vector2) -> void:
	if current_state == State.CHASING:
		last_known_position = position
		return
	last_known_position = position
	current_state = State.ALERT
	alert_timer = 2.0

func reset_to_start() -> void:
	current_state = State.PATROLLING
	current_patrol_index = 0
	alert_timer = 0.0
	velocity = Vector2.ZERO
	if patrol_points.size() > 0:
		global_position = patrol_points[0]
	move_direction = Vector2.RIGHT

func _on_vision_cone_player_detected(position: Vector2) -> void:
	last_known_position = position
	if current_state != State.CHASING:
		current_state = State.CHASING
		emit_signal("player_spotted", position)

func _draw() -> void:
	var color: Color = Color.RED if current_state == State.ALERT or current_state == State.CHASING else Color.BLUE
	var angle: float = move_direction.angle()
	var size: float = 14.0
	var tip: Vector2 = Vector2(cos(angle), sin(angle)) * size
	var left: Vector2 = Vector2(cos(angle + PI * 0.8), sin(angle + PI * 0.8)) * size
	var right: Vector2 = Vector2(cos(angle - PI * 0.8), sin(angle - PI * 0.8)) * size
	draw_polygon(PackedVector2Array([tip, left, right]), PackedColorArray([color]))
