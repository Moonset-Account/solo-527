class_name TurnManager
extends Node

signal turn_started(turn_number: int)
signal turn_ended(turn_number: int)
signal all_turns_ended()

var current_turn: int = 0
var turn_limit: int = 5
var is_player_turn: bool = true

func start_new_game(limit: int) -> void:
	current_turn = 0
	turn_limit = limit
	is_player_turn = true
	start_next_turn()

func start_next_turn() -> void:
	current_turn += 1
	if current_turn > turn_limit:
		all_turns_ended.emit()
		return
	is_player_turn = true
	turn_started.emit(current_turn)

func end_current_turn() -> void:
	if not is_player_turn:
		return
	is_player_turn = false
	turn_ended.emit(current_turn)
	start_next_turn()

func get_remaining_turns() -> int:
	return turn_limit - current_turn

func is_game_over() -> bool:
	return current_turn > turn_limit
