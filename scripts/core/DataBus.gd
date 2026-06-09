extends Node

signal settlement_data_changed(data: Dictionary)
signal fail_replay_data_changed(data: Dictionary)

var settlement_data: Dictionary = {}
var fail_replay_data: Dictionary = {}

func set_settlement_data(data: Dictionary) -> void:
	settlement_data = data.duplicate(true)
	emit_signal("settlement_data_changed", settlement_data)

func get_settlement_data() -> Dictionary:
	return settlement_data

func set_fail_replay_data(data: Dictionary) -> void:
	fail_replay_data = data.duplicate(true)
	emit_signal("fail_replay_data_changed", fail_replay_data)

func get_fail_replay_data() -> Dictionary:
	return fail_replay_data

func clear_all() -> void:
	settlement_data.clear()
	fail_replay_data.clear()
