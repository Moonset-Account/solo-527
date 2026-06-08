extends Control

func _ready() -> void:
	GameManager.game_state_changed.connect(_on_game_state_changed)
	_navigate_to_state(GameManager.current_state)

func _navigate_to_state(state: GameManager.GameState) -> void:
	match state:
		GameManager.GameState.MENU:
			get_tree().change_scene_to_file("res://scenes/start_menu.tscn")
		GameManager.GameState.TUTORIAL:
			get_tree().change_scene_to_file("res://scenes/game_board.tscn")
		GameManager.GameState.PLAYING:
			get_tree().change_scene_to_file("res://scenes/game_board.tscn")
		GameManager.GameState.EVENT:
			pass
		GameManager.GameState.SETTLEMENT:
			get_tree().change_scene_to_file("res://scenes/settlement.tscn")

func _on_game_state_changed(new_state: GameManager.GameState) -> void:
	_navigate_to_state(new_state)
