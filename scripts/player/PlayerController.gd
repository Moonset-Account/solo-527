extends CharacterBody2D
## 维护机器人玩家控制器

@export var move_speed: float = 180.0
@export var crouch_speed_multiplier: float = 0.45
@export var run_speed_multiplier: float = 1.5
@export var acceleration: float = 1200.0
@export var friction: float = 2000.0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var body_collision: CollisionShape2D = $BodyCollision
@onready var scan_origin: Node2D = $ScanOrigin
@onready var noise_spawn_point: Node2D = $NoiseSpawnPoint

var noise_system: Node = null
var energy_system: Node = null
var scan_system: Node = null

var is_crouching: bool = false
var is_running: bool = false
var direction: Vector2 = Vector2.RIGHT
var facing: Vector2 = Vector2.RIGHT
var move_input: Vector2 = Vector2.ZERO
var is_moving: bool = false
var scan_targets_ref: Array = []

var _step_timer: float = 0.0
var _step_interval: float = 0.28
var _spawn_position: Vector2 = Vector2.ZERO

var _segment_restore_data: Dictionary = {}

func _ready() -> void:
	_init_systems()
	_connect_events()
	_spawn_position = global_position
	_save_segment_state()
	_update_crouch_visuals()
	if sprite:
		sprite.play("idle")

func _init_systems() -> void:
	var parent := get_tree().current_scene
	if parent:
		noise_system = parent.get_node_or_null("Systems/NoiseSystem")
		energy_system = parent.get_node_or_null("Systems/EnergySystem")
		scan_system = parent.get_node_or_null("Systems/ScanSystem")
	if not noise_system:
		noise_system = load("res://scripts/systems/NoiseSystem.gd").new()
		get_tree().root.add_child(noise_system)
	if not energy_system:
		energy_system = load("res://scripts/systems/EnergySystem.gd").new()
		get_tree().root.add_child(energy_system)
	if not scan_system:
		scan_system = load("res://scripts/systems/ScanSystem.gd").new()
		get_tree().root.add_child(scan_system)
		scan_system.setup(self, energy_system)

func _connect_events() -> void:
	EventBus.segment_reset.connect(_on_segment_reset)
	EventBus.player_caught.connect(_on_player_caught)

func _unhandled_input(event: InputEvent) -> void:
	if not GameManager.is_playing():
		return
	if event.is_action_pressed("pause"):
		GameManager.pause_game()
		return
	if event.is_action_pressed("scan"):
		if scan_system:
			if scan_system.is_scanning_active():
				scan_system.cancel_scan()
			else:
				if scan_system.try_start_scan():
					pass
	if event.is_action_pressed("crouch"):
		if SaveManager.get_setting("crouch_toggle"):
			is_crouching = not is_crouching
		else:
			is_crouching = true
		_update_crouch_visuals()
	elif event.is_action_released("crouch") and not SaveManager.get_setting("crouch_toggle"):
		is_crouching = false
		_update_crouch_visuals()

func _physics_process(delta: float) -> void:
	if not GameManager.is_playing():
		return
	_handle_input()
	_process_movement(delta)
	_update_animation_state(delta)
	_update_systems(delta)
	_update_step_effects(delta)

func _handle_input() -> void:
	move_input = Vector2(
		Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
		Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
	)
	if move_input.length() > 0.01:
		move_input = move_input.normalized()
		direction = move_input
		facing = direction
	is_running = Input.is_key_pressed(KEY_SHIFT) and not is_crouching
	if scan_system and scan_system.is_scanning_active():
		move_input *= 0.3
		is_running = false

func _process_movement(delta: float) -> void:
	var current_speed := move_speed
	if is_crouching:
		current_speed *= crouch_speed_multiplier
	elif is_running:
		current_speed *= run_speed_multiplier
	var target_velocity: Vector2 = move_input * current_speed
	is_moving = move_input.length() > 0.01
	if is_moving:
		velocity = velocity.move_toward(target_velocity, acceleration * delta)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
	var collision_info := move_and_slide()

func _update_animation_state(delta: float) -> void:
	if not sprite:
		return
	var anim_name: String
	if is_crouching:
		if is_moving:
			anim_name = "crouch_walk"
		else:
			anim_name = "crouch_idle"
	elif scan_system and scan_system.is_scanning_active():
		anim_name = "scan"
	elif is_running:
		anim_name = "run"
	elif is_moving:
		anim_name = "walk"
	else:
		anim_name = "idle"
	if sprite.animation != anim_name:
		sprite.play(anim_name)
	if facing.x < -0.1:
		sprite.flip_h = true
	elif facing.x > 0.1:
		sprite.flip_h = false

func _update_systems(delta: float) -> void:
	if energy_system:
		energy_system.update_states(is_crouching, is_moving)
	if scan_system:
		scan_system.update_nearby_targets(global_position, facing, scan_targets_ref)
		if scan_system.is_scanning_active():
			scan_system.process_scan(delta)
	if noise_system and is_moving:
		var speed_factor := velocity.length() / move_speed
		var noise_strength := noise_system.calculate_movement_noise(velocity.length(), is_crouching, is_running)
		if noise_strength > 0.02:
			_step_timer -= delta
			if _step_timer <= 0.0:
				_step_timer = _step_interval * (0.5 + 0.5 * (1.0 / max(0.5, speed_factor)))
				if noise_system:
					var noise_radius: float = 60.0 + noise_strength * 100.0
					noise_system.spawn_noise(noise_spawn_point.global_position, noise_strength, noise_radius)
				EventBus.emit_sfx_play("step_crouch" if is_crouching else "step")

func _update_step_effects(delta: float) -> void:
	if is_moving and noise_system:
		EventBus.emit_player_moved(global_position, noise_system.calculate_movement_noise(velocity.length(), is_crouching, is_running))

func set_scan_targets(targets: Array) -> void:
	scan_targets_ref = targets

func _update_crouch_visuals() -> void:
	if body_collision:
		var shape := body_collision.shape as RectangleShape2D
		if shape:
			if is_crouching:
				shape.size = Vector2(28, 32)
				body_collision.position = Vector2(0, 8)
			else:
				shape.size = Vector2(28, 48)
				body_collision.position = Vector2(0, 0)
	if sprite:
		var tween := create_tween()
		if is_crouching:
			tween.tween_property(sprite, "scale", Vector2(0.9, 0.75), 0.15)
			tween.parallel().tween_property(sprite, "position", Vector2(0, 8), 0.15)
		else:
			tween.tween_property(sprite, "scale", Vector2(1.0, 1.0), 0.2)
			tween.parallel().tween_property(sprite, "position", Vector2.ZERO, 0.2)

func _save_segment_state() -> void:
	_segment_restore_data = {
		"position": global_position,
		"energy": energy_system.current_energy if energy_system else 100.0,
		"facing": facing,
	}

func restore_segment_position() -> void:
	if _segment_restore_data.has("position"):
		global_position = _segment_restore_data["position"]
		velocity = Vector2.ZERO
	if _segment_restore_data.has("facing"):
		facing = _segment_restore_data["facing"]
	if energy_system and _segment_restore_data.has("energy"):
		energy_system.current_energy = _segment_restore_data["energy"]
		energy_system.reset()

func set_segment_spawn(pos: Vector2) -> void:
	_segment_restore_data["position"] = pos
	_spawn_position = pos
	global_position = pos

func get_scan_facing() -> Vector2:
	return facing.normalized()

func get_scan_origin_global() -> Vector2:
	return scan_origin.global_position if scan_origin else global_position

func _on_segment_reset() -> void:
	restore_segment_position()

func _on_player_caught() -> void:
	if sprite:
		var tween := create_tween()
		tween.tween_property(sprite, "modulate", Color(1, 0.3, 0.3), 0.2)
		tween.tween_property(sprite, "modulate", Color.WHITE, 0.3)
		tween.parallel().tween_property(sprite, "rotation", 0.1, 0.05)
		tween.tween_property(sprite, "rotation", -0.1, 0.05)
		tween.tween_property(sprite, "rotation", 0.0, 0.1)

func checkpoint_reached(cp_id: String, pos: Vector2) -> void:
	_segment_restore_data["position"] = pos
	_segment_restore_data["energy"] = energy_system.current_energy if energy_system else 100.0
	EventBus.emit_checkpoint_reached(cp_id)
