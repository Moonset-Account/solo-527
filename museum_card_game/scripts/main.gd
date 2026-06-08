extends Control

var _current_scene: Control = null
var _current_scene_path: String = ""

func _ready() -> void:
	GameManager.game_state_changed.connect(_on_game_state_changed)
	print("[MAIN] _ready, initial state: ", GameManager.current_state)
	_switch_scene(GameManager.current_state)

func _on_game_state_changed(new_state: GameManager.GameState) -> void:
	_switch_scene(new_state)

func _switch_scene(state: GameManager.GameState) -> void:
	var scene_path := ""
	match state:
		GameManager.GameState.MENU:
			scene_path = "res://scenes/start_menu.tscn"
		GameManager.GameState.TUTORIAL:
			scene_path = "res://scenes/game_board.tscn"
		GameManager.GameState.PLAYING:
			scene_path = "res://scenes/game_board.tscn"
		GameManager.GameState.EVENT:
			return
		GameManager.GameState.SETTLEMENT:
			scene_path = "res://scenes/settlement.tscn"

	if scene_path.is_empty():
		return

	if scene_path == _current_scene_path:
		print("[MAIN] Same scene, refreshing: ", scene_path)
		if _current_scene and _current_scene.has_method("_on_state_refresh"):
			_current_scene._on_state_refresh()
		return

	if _current_scene:
		remove_child(_current_scene)
		_current_scene.queue_free()
		_current_scene = null
		_current_scene_path = ""

	print("[MAIN] Switching to: ", scene_path)
	var packed := load(scene_path) as PackedScene
	if packed:
		_current_scene = packed.instantiate() as Control
		_current_scene.set_anchors_preset(Control.PRESET_FULL_RECT)
		add_child(_current_scene)
		_current_scene_path = scene_path
	else:
		push_error("[MAIN] Failed to load scene: " + scene_path)
