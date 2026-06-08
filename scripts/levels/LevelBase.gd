extends Node2D
## 关卡基础场景 - 整合所有系统和游戏实体

@export var level_id: String = "level_01"
@export var is_tutorial: bool = false
@export var player_spawn: Vector2 = Vector2(200, 500)

@onready var systems: Node2D = $Systems
@onready var world_root: Node2D = $World
@onready var shelves_container: Node2D = $World/Shelves
@onready var patrol_lights_container: Node2D = $World/PatrolLights
@onready var checkpoints_container: Node2D = $World/Checkpoints
@onready var walls_container: Node2D = $World/Walls
@onready var decor_container: Node2D = $World/Decor
@onready var player_spawn_marker: Marker2D = $World/PlayerSpawnMarker

var player: Node = null
var noise_system: Node = null
var energy_system: Node = null
var scan_system: Node = null

var all_shelves: Array = []
var all_patrol_lights: Array = []
var all_checkpoints: Array = []

var hud_overlay: CanvasLayer = null
var pause_overlay: CanvasLayer = null
var tutorial_overlay: CanvasLayer = null

var _level_setup_completed: bool = false

func _ready() -> void:
	await get_tree().process_frame
	_setup_systems()
	_collect_entities()
	_setup_player()
	_setup_ui()
	_setup_level_meta()
	_connect_events()
	_replace_textures()
	_level_setup_completed = true

func _setup_systems() -> void:
	var noise_script := load("res://scripts/systems/NoiseSystem.gd")
	noise_system = noise_script.new()
	noise_system.name = "NoiseSystem"
	systems.add_child(noise_system)
	var energy_script := load("res://scripts/systems/EnergySystem.gd")
	energy_system = energy_script.new()
	energy_system.name = "EnergySystem"
	systems.add_child(energy_system)
	var scan_script := load("res://scripts/systems/ScanSystem.gd")
	scan_system = scan_script.new()
	scan_system.name = "ScanSystem"
	systems.add_child(scan_system)

func _collect_entities() -> void:
	all_shelves.clear()
	all_patrol_lights.clear()
	all_checkpoints.clear()
	if shelves_container:
		for shelf in shelves_container.get_children():
			all_shelves.append(shelf)
			shelf.add_to_group("scan_target")
			shelf.add_to_group("shelf")
	if patrol_lights_container:
		for light in patrol_lights_container.get_children():
			all_patrol_lights.append(light)
			light.add_to_group("patrol_light")
	if checkpoints_container:
		for cp in checkpoints_container.get_children():
			all_checkpoints.append(cp)
			cp.add_to_group("checkpoint")
	GameManager.set_total_shelves(all_shelves.size())

func _setup_player() -> void:
	var player_scene := load("res://scenes/player/Player.tscn")
	player = player_scene.instantiate()
	player.add_to_group("player")
	if player_spawn_marker:
		player.global_position = player_spawn_marker.global_position
	else:
		player.global_position = player_spawn
	world_root.add_child(player)
	player.set_scan_targets(all_shelves)
	if player.noise_system == null:
		player.noise_system = noise_system
	if player.energy_system == null:
		player.energy_system = energy_system
	if player.scan_system == null:
		player.scan_system = scan_system
		scan_system.setup(player, energy_system)
	for light in all_patrol_lights:
		light.player_ref = player

func _setup_ui() -> void:
	var hud_scene := load("res://scenes/ui/HUD.tscn")
	hud_overlay = hud_scene.instantiate()
	add_child(hud_overlay)
	var pause_scene := load("res://scenes/ui/PauseMenu.tscn")
	pause_overlay = pause_scene.instantiate()
	add_child(pause_overlay)
	if is_tutorial and not GameManager.tutorial_completed:
		var tutorial_scene := load("res://scenes/ui/TutorialOverlay.tscn")
		tutorial_overlay = tutorial_scene.instantiate()
		add_child(tutorial_overlay)

func _setup_level_meta() -> void:
	if is_tutorial and not GameManager.tutorial_completed:
		GameManager.current_state = GameManager.GameState.TUTORIAL
	else:
		GameManager.current_state = GameManager.GameState.PLAYING
	GameManager.alert_level = 0

func _connect_events() -> void:
	EventBus.level_completed.connect(_on_level_completed)
	EventBus.segment_reset.connect(_on_segment_reset)
	EventBus.checkpoint_reached.connect(_on_checkpoint_reached)
	EventBus.alert_level_changed.connect(_on_alert_changed)

func _process(delta: float) -> void:
	if not GameManager.is_playing() and not is_tutorial:
		return
	_debug_draw_noise()

func _debug_draw_noise() -> void:
	pass

func _on_level_completed(_lvl_id: String) -> void:
	pass

func _on_segment_reset() -> void:
	if player and player.has_method("restore_segment_position"):
		pass

func _on_checkpoint_reached(cp_id: String) -> void:
	pass

func _on_alert_changed(level: int) -> void:
	pass

func get_player_position() -> Vector2:
	if player:
		return player.global_position
	return Vector2.ZERO

func get_energy_system() -> Node:
	return energy_system

func get_noise_system() -> Node:
	return noise_system

func get_scan_system() -> Node:
	return scan_system

func get_all_shelves() -> Array:
	return all_shelves

func get_all_patrol_lights() -> Array:
	return all_patrol_lights

func _replace_textures() -> void:
	if TextureReplacer:
		TextureReplacer.replace_all(self)
