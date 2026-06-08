extends Node
class_name GameManager

enum GameState { MENU, TUTORIAL, PLAYING, PAUSED, LEVEL_COMPLETE, LEVEL_FAILED, SETTINGS }

signal game_state_changed(new_state: GameState)

var current_state: GameState = GameState.MENU
var current_level: int = 0
var max_unlocked_level: int = 0
var satisfaction: float = 50.0
var total_score: int = 0

func _ready() -> void:
	pass

func change_state(new_state: GameState) -> void:
	current_state = new_state
	game_state_changed.emit(new_state)

func reset_run() -> void:
	satisfaction = 50.0
	current_level = 0

func unlock_next_level() -> void:
	var next_level: int = current_level + 1
	if next_level > max_unlocked_level:
		max_unlocked_level = next_level
