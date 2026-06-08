extends Node

enum GameState {
	MENU,
	TUTORIAL,
	LEVEL_SELECT,
	PLAYING,
	PAUSED,
	RESULTS,
	FAILURE,
}

signal state_changed(old_state: GameState, new_state: GameState)

var _current_state: GameState = GameState.MENU
var current_level_id: String = ""
var failure_reason: String = ""
var last_score: int = 0
var last_stars: int = 0
var last_time: float = 0.0
var last_packed: int = 0


func change_state(new_state: GameState) -> void:
	if _current_state == new_state:
		return
	var old_state := _current_state
	_current_state = new_state
	state_changed.emit(old_state, new_state)


func get_current_state() -> GameState:
	return _current_state
