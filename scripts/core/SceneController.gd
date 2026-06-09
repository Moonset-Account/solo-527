extends Node
class_name SceneController

const MAIN_MENU := preload("res://scenes/MainMenu.tscn")
const TUTORIAL_SCREEN := preload("res://scenes/TutorialScreen.tscn")
const GAME_SCENE := preload("res://scenes/GameScene.tscn")
const SETTINGS_PANEL_SCRIPT := preload("res://scripts/ui/SettingsPanel.gd")

var current_scene_root: Control = null
var settings_overlay: Control = null
var main_menu_instance: Control = null
var tutorial_instance: Control = null
var game_scene_instance: Control = null
var last_known_state: int = -1

func _ready() -> void:
	_display_main_menu()
	_setup_settings_overlay()
	_save_configs_initialize()
	GameManager.state_changed.connect(_on_game_state_changed)

func _process(_delta: float) -> void:
	var cur_state := GameManager.current_state
	if cur_state != last_known_state:
		last_known_state = cur_state

func _save_configs_initialize() -> void:
	var tmpgc: Dictionary = ConfigManager.game_config
	var tmpsc: Dictionary = ConfigManager.scoring_config
	var tmplc: Dictionary = ConfigManager.level_configs
	if tmpgc.is_empty() or tmpsc.is_empty() or tmplc.is_empty():
		push_warning("Configs may not have loaded correctly")

func _setup_settings_overlay() -> void:
	settings_overlay = SETTINGS_PANEL_SCRIPT.new()
	settings_overlay.name = "SettingsOverlay"
	add_child(settings_overlay)
	settings_overlay.settings_applied.connect(_on_settings_applied)
	settings_overlay.settings_cancelled.connect(_on_settings_cancelled)

func _display_main_menu() -> void:
	_clear_current_scene()
	main_menu_instance = MAIN_MENU.instantiate() as Control
	main_menu_instance.start_selected.connect(_on_start_selected)
	main_menu_instance.tutorial_requested.connect(_on_tutorial_requested)
	main_menu_instance.settings_requested.connect(_on_settings_requested)
	main_menu_instance.quit_requested.connect(_on_quit)
	add_child(main_menu_instance)
	current_scene_root = main_menu_instance
	GameManager.change_state(GameManager.GameState.MENU)

func _clear_current_scene() -> void:
	if current_scene_root and current_scene_root.is_inside_tree():
		current_scene_root.queue_free()
	current_scene_root = null
	main_menu_instance = null
	tutorial_instance = null

func _display_tutorial() -> void:
	_clear_current_scene()
	tutorial_instance = TUTORIAL_SCREEN.instantiate() as Control
	tutorial_instance.tutorial_completed.connect(_on_tutorial_completed)
	tutorial_instance.back_requested.connect(_on_back_to_menu)
	add_child(tutorial_instance)
	current_scene_root = tutorial_instance
	GameManager.change_state(GameManager.GameState.TUTORIAL)

func _display_game(level_id: String) -> void:
	_clear_current_scene()
	if level_id == "__continue__":
		var ok := GameManager.resume_from_auto_save()
		if not ok:
			EventBus.emit_signal("feedback_shown", "无法加载存档失败，开始新游戏。", "warning", 2.0)
			GameManager.start_level("tutorial")
	else:
		GameManager.start_level(level_id)
	var gs: Control = GAME_SCENE.instantiate()
	add_child(gs)
	current_scene_root = gs

func _on_start_selected(level_id: String) -> void:
	if level_id == "__continue__":
		_display_game(level_id)
	else:
		_display_game(level_id)

func _on_level_selected(level_id: String) -> void:
	_display_game(level_id)

func _on_tutorial_requested() -> void:
	_display_tutorial()

func _on_settings_requested() -> void:
	if settings_overlay:
		settings_overlay.show_panel()

func _on_settings_applied() -> void:
	pass

func _on_settings_cancelled() -> void:
	pass

func _on_tutorial_completed() -> void:
	_display_game("tutorial")

func _on_back_to_menu() -> void:
	_display_main_menu()

func _on_quit() -> void:
	get_tree().quit()

func _on_game_state_changed(new_state: int, old_state: int) -> void:
	if new_state == 0: # GameState.MENU
		if not main_menu_instance or not main_menu_instance.is_inside_tree():
			_display_main_menu()
	elif new_state == 2: # GameState.TUTORIAL
		if not tutorial_instance or not tutorial_instance.is_inside_tree():
			_display_tutorial()
	elif new_state == 3 or new_state == 6 or new_state == 7: # PLAYING, LEVEL_COMPLETE, LEVEL_FAILED
		pass

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		_on_quit()
