extends Node

signal action_undone(action)

var action_history: Array = []
var max_actions: int = 50

func push_action(action_dict: Dictionary) -> void:
	action_history.append(action_dict)
	if action_history.size() > max_actions:
		action_history.pop_front()

func undo() -> Dictionary:
	if action_history.is_empty():
		return {}
	var last_action: Dictionary = action_history.pop_back()
	action_undone.emit(last_action)
	return last_action

func can_undo() -> bool:
	return not action_history.is_empty()

func clear_history() -> void:
	action_history.clear()
