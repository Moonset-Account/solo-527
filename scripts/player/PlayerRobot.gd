extends CharacterBody2D

class_name PlayerRobot

@export var move_speed: float = 180.0
@export var crouch_speed: float = 90.0
@export var sprint_speed: float = 280.0
@export var scan_range: float = 100.0
@export var scan_cost: float = 5.0
@export var scan_duration: float = 1.0
@export var energy_drain_rate: float = 2.0
@export var crouch_energy_regen: float = 1.0
@export var noise_normal: float = 0.5
@export var noise_crouch: float = 0.1
@export var noise_sprint: float = 1.0

signal energy_changed(current: float, max: float)
signal noise_changed(level: float)
signal scan_started(target: Node2D)
signal scan_completed(target: Node2D, success: bool)
signal player_detected()
signal checkpoint_reached(checkpoint_data: Dictionary)

var max_energy: float = 100.0
var current_energy: float = 100.0
var noise_level: float = 0.0
var is_crouching: bool = false
var is_sprinting: bool = false
var is_scanning: bool = false
var scan_timer: float = 0.0
var scan_target: Node2D = null
var direction: Vector2 = Vector2.ZERO
var facing: Vector2 = Vector2.RIGHT
var nearby_interactables: Array = []
var respawn_position: Vector2 = Vector2.ZERO
var alert_timer: float = 0.0
var is_hidden: bool = false

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var scan_area: Area2D = $ScanArea
@onready var noise_indicator: ColorRect = $NoiseIndicator
@onready var scan_progress: ProgressBar = $ScanProgress

func _ready():
	respawn_position = global_position
	current_energy = max_energy
	GameManager.remaining_energy = current_energy
	emit_signal("energy_changed", current_energy, max_energy)
	scan_progress.visible = false
	var collision_shape: CollisionShape2D = scan_area.get_child(0) if scan_area.get_child_count() > 0 else null
	if collision_shape and collision_shape.shape is CircleShape2D:
		collision_shape.shape.radius = scan_range
	_connect_signals()
	DebugLog.info("玩家机器人初始化完成")

func _connect_signals():
	if scan_area:
		scan_area.body_entered.connect(_on_scan_body_entered)
		scan_area.body_exited.connect(_on_scan_body_exited)
		scan_area.area_entered.connect(_on_scan_area_entered)
		scan_area.area_exited.connect(_on_scan_area_exited)

func _process(delta):
	if not GameManager.is_playing():
		return
	GameManager.update_time(delta)
	_update_energy(delta)
	_update_scan(delta)
	_update_alert(delta)
	_update_animation()

func _physics_process(delta):
	if not GameManager.is_playing():
		return
	_handle_input(delta)
	_move(delta)

func _handle_input(delta):
	var input_dir = Vector2(
		Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
		Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
	)
	direction = input_dir.normalized()
	if direction.length() > 0:
		facing = direction
	is_crouching = Input.is_action_pressed("crouch")
	is_sprinting = Input.is_action_pressed("scan") == false and Input.is_key_pressed(KEY_SHIFT) and not is_crouching
	if Input.is_action_just_pressed("pause"):
		GameManager.pause_game()
	if Input.is_action_just_pressed("interact"):
		_try_interact()
	if Input.is_action_pressed("scan") and not is_scanning:
		_try_start_scan()
	elif not Input.is_action_pressed("scan") and is_scanning:
		_cancel_scan()

func _move(delta):
	var speed = move_speed
	var current_noise = noise_normal
	if is_crouching:
		speed = crouch_speed
		current_noise = noise_crouch
	elif is_sprinting and current_energy > 0:
		speed = sprint_speed
		current_noise = noise_sprint
		current_energy = max(0, current_energy - energy_drain_rate * delta * 1.5)
	var moving = direction.length() > 0
	if moving:
		noise_level = lerp(noise_level, current_noise, delta * 10)
	else:
		noise_level = lerp(noise_level, 0.0, delta * 5)
	emit_signal("noise_changed", noise_level)
	velocity = direction * speed
	move_and_slide()

func _update_energy(delta):
	if is_crouching and not _is_moving():
		current_energy = min(max_energy, current_energy + crouch_energy_regen * delta)
	if GameManager:
		GameManager.remaining_energy = current_energy
	emit_signal("energy_changed", current_energy, max_energy)
	noise_indicator.color = Color(noise_level, 1.0 - noise_level * 0.5, 0, noise_level * 0.7)

func _update_scan(delta):
	if is_scanning and scan_target:
		scan_timer += delta
		scan_progress.value = (scan_timer / scan_duration) * 100
		current_energy = max(0, current_energy - scan_cost * delta)
		if scan_timer >= scan_duration:
			_complete_scan()

func _update_alert(delta):
	if alert_timer > 0:
		alert_timer -= delta

func _update_animation():
	if is_scanning:
		if sprite.animation != "scan":
			sprite.play("scan")
	elif _is_moving():
		if is_crouching:
			if sprite.animation != "crouch_walk":
				sprite.play("crouch_walk")
		elif is_sprinting:
			if sprite.animation != "sprint":
				sprite.play("sprint")
		else:
			if sprite.animation != "walk":
				sprite.play("walk")
	else:
		if is_crouching:
			if sprite.animation != "crouch_idle":
				sprite.play("crouch_idle")
		else:
			if sprite.animation != "idle":
				sprite.play("idle")
	_flip_sprite()

func _flip_sprite():
	if facing.x < 0:
		sprite.flip_h = true
	elif facing.x > 0:
		sprite.flip_h = false

func _is_moving() -> bool:
	return velocity.length() > 5

func _try_start_scan():
	if current_energy < scan_cost:
		DebugLog.warning("能量不足，无法扫描")
		return
	var target = _find_scan_target()
	if target:
		is_scanning = true
		scan_timer = 0.0
		scan_target = target
		scan_progress.visible = true
		scan_progress.value = 0
		emit_signal("scan_started", target)
		AudioManager.play_sfx("scan_start", 1.0, 0.6)
		DebugLog.debug("开始扫描目标")

func _cancel_scan():
	is_scanning = false
	scan_target = null
	scan_timer = 0.0
	scan_progress.visible = false
	AudioManager.play_sfx("scan_cancel", 0.9, 0.4)

func _complete_scan():
	var success = false
	if scan_target and scan_target.has_method("on_scanned"):
		success = scan_target.on_scanned()
		if success:
			GameManager.increment_scan()
	emit_signal("scan_completed", scan_target, success)
	is_scanning = false
	scan_target = null
	scan_timer = 0.0
	scan_progress.visible = false
	AudioManager.play_sfx("scan_complete", 1.0, 0.6)

func _find_scan_target() -> Node2D:
	var best_target = null
	var best_dist = scan_range * 1.2
	for obj in nearby_interactables:
		if obj and is_instance_valid(obj):
			var dist = global_position.distance_to(obj.global_position)
			if dist < best_dist and obj.has_method("can_scan") and obj.can_scan():
				best_dist = dist
				best_target = obj
	return best_target

func _try_interact():
	for obj in nearby_interactables:
		if obj and is_instance_valid(obj):
			var dist = global_position.distance_to(obj.global_position)
			if dist < 60 and obj.has_method("on_interact") and obj.has_method("can_interact") and obj.can_interact():
				obj.on_interact(self)
				return

func on_detected():
	if alert_timer > 0:
		return
	alert_timer = 1.0
	GameManager.on_detected()
	emit_signal("player_detected")
	AudioManager.play_sfx("detected", 1.0, 0.8)
	_reset_to_checkpoint()

func _reset_to_checkpoint():
	var cp = GameManager.get_current_checkpoint()
	if cp.has("position"):
		global_position = Vector2(cp["position"]["x"], cp["position"]["y"])
		current_energy = cp.get("energy", max_energy)
		DebugLog.info("重置到检查点 %d" % GameManager.current_checkpoint)
	else:
		global_position = respawn_position
		current_energy = max_energy
		DebugLog.info("重置到出生点")
	velocity = Vector2.ZERO

func set_checkpoint(cp_data: Dictionary = {}):
	if cp_data.is_empty():
		cp_data = {
			"position": {"x": global_position.x, "y": global_position.y},
			"energy": current_energy
		}
	GameManager.add_checkpoint(cp_data)
	emit_signal("checkpoint_reached", cp_data)
	AudioManager.play_sfx("checkpoint", 1.0, 0.5)

func _on_scan_body_entered(body):
	if body.has_method("can_scan"):
		nearby_interactables.append(body)

func _on_scan_body_exited(body):
	nearby_interactables.erase(body)

func _on_scan_area_entered(area):
	if area.get_parent() and area.get_parent().has_method("can_scan"):
		nearby_interactables.append(area.get_parent())

func _on_scan_area_exited(area):
	if area.get_parent():
		nearby_interactables.erase(area.get_parent())

func get_nearby_interactables() -> Array:
	return nearby_interactables
