extends Node2D
class_name GameRoot

@onready var level_manager_node: LevelManager = null
@onready var hud_node: GameHUD = $HUD
@onready var debug_panel_node: DebugPanel = $DebugPanel
@onready var result_screen_node: ResultScreen = $ResultScreen
@onready var pause_panel_node: Control = $PausePanel
@onready var bg_particles_node: CPUParticles2D = $BackgroundParticles

var current_level_id: int = 0

func _ready() -> void:
	_setup_background()
	_setup_pause()
	GameManager.game_state_changed.connect(_on_state_changed)
	GameManager.level_completed.connect(_on_level_completed)
	GameManager.level_failed.connect(_on_level_failed)
	GameManager.level_started.connect(_on_level_started)
	InputManager.pause_pressed.connect(_on_pause_pressed)
	if GameManager.pending_start_level_id > 0:
		start_level(GameManager.pending_start_level_id)
		GameManager.pending_start_level_id = 0

func _process(delta: float) -> void:
	if hud_node and hud_node.is_inside_tree():
		hud_node.update_hud_periodic()

func start_level(level_id_param: int) -> void:
	current_level_id = level_id_param
	if level_manager_node:
		level_manager_node.queue_free()
		level_manager_node = null
	GameManager.start_level(level_id_param)
	var new_lm = load("res://scripts/LevelManager.gd").new()
	new_lm.name = "LevelManager"
	new_lm.level_id = level_id_param
	add_child(new_lm)
	level_manager_node = new_lm
	call_deferred("_bind_managers")
	if pause_panel_node:
		pause_panel_node.visible = false
	if result_screen_node:
		result_screen_node.visible = false
	if hud_node:
		hud_node.visible = true
		hud_node._reset_ui()

func _bind_managers() -> void:
	await get_tree().process_frame
	if hud_node and level_manager_node:
		hud_node.bind_level_manager(level_manager_node)
	if debug_panel_node and level_manager_node:
		debug_panel_node.bind_level_manager(level_manager_node)

func _setup_background() -> void:
	if bg_particles_node:
		bg_particles_node.emitting = true
		bg_particles_node.amount = 60
		bg_particles_node.lifetime = 12
		bg_particles_node.color = Color(0.55, 0.75, 1.0, 0.15)
		bg_particles_node.gravity = Vector2(0, -15)
		bg_particles_node.spread = 360
		bg_particles_node.initial_velocity_min = 10
		bg_particles_node.initial_velocity_max = 40

func _setup_pause() -> void:
	if not pause_panel_node:
		return
	if pause_panel_node.has_node("%ResumeBtn"):
		pause_panel_node.get_node("%ResumeBtn").pressed.connect(_on_resume)
	if pause_panel_node.has_node("%RetryBtn"):
		pause_panel_node.get_node("%RetryBtn").pressed.connect(_on_pause_retry)
	if pause_panel_node.has_node("%MenuBtn"):
		pause_panel_node.get_node("%MenuBtn").pressed.connect(_on_pause_menu)
	if pause_panel_node.has_node("%QuitBtn"):
		pause_panel_node.get_node("%QuitBtn").pressed.connect(_on_pause_quit)

func _on_state_changed(new_state: int) -> void:
	match new_state:
		GameManager.GameState.PAUSED:
			if pause_panel_node:
				pause_panel_node.visible = true
				get_tree().paused = true
		GameManager.GameState.PLAYING:
			if pause_panel_node:
				pause_panel_node.visible = false
			get_tree().paused = false
		GameManager.GameState.MAIN_MENU:
			get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")
		GameManager.GameState.LEVEL_SELECT:
			get_tree().change_scene_to_file("res://scenes/LevelSelect.tscn")
		GameManager.GameState.RESULT_SCREEN:
			pass

func _on_level_started(level_data: Dictionary) -> void:
	if hud_node:
		hud_node._reset_ui()
		hud_node.update_level_info(
			level_data.get("name", "关卡"),
			level_data.get("difficulty", 1)
		)
		hud_node.show_tutorial(level_data.get("tutorial_hints", []))
	if level_manager_node:
		level_manager_node.container_position = Vector2(680, 400)
	AudioManager.play_music("game")

func _on_level_completed(result: Dictionary) -> void:
	if result_screen_node:
		result_screen_node.show_result(result)

func _on_level_failed(reason: String) -> void:
	if result_screen_node:
		var fail := {
			"success": false,
			"fail_reason": reason,
			"score": GameManager.score,
			"time_elapsed": GameManager.time_elapsed,
			"items_placed": GameManager.items_placed_count,
			"items_total": GameManager.current_level.get("total_items", 0),
			"fragile_broken": GameManager.fragile_broken_count,
			"fragile_total": GameManager.current_level.get("fragile_count", 0),
			"mistakes": GameManager.mistakes_count,
			"weight_used": GameManager.current_container_weight,
			"weight_max": GameManager.max_container_weight,
			"stars": 0,
			"level_id": GameManager.current_level_id
		}
		result_screen_node.show_result(fail)

func _on_pause_pressed() -> void:
	if GameManager.game_state == GameManager.GameState.PLAYING:
		GameManager.toggle_pause()
	elif GameManager.game_state == GameManager.GameState.PAUSED:
		GameManager.toggle_pause()

func _on_resume() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	GameManager.toggle_pause()

func _on_pause_retry() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	GameManager.toggle_pause()
	start_level(current_level_id)

func _on_pause_menu() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	GameManager.toggle_pause()
	GameManager.go_to_level_select()

func _on_pause_quit() -> void:
	AudioManager.play_sfx(AudioManager.SFX.BUTTON_CLICK)
	UIManager.confirm_dialog("退出游戏", "确定退出吗？", Callable(self, "_do_quit"))

func _do_quit() -> void:
	get_tree().quit()
