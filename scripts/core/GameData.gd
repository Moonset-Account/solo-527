extends Node

var settlement_data: Dictionary = {}
var fail_replay_data: Dictionary = {}

func store_settlement(data: Dictionary) -> void:
	settlement_data = data.duplicate(true)

func get_settlement() -> Dictionary:
	return settlement_data.duplicate(true)

func store_fail_replay(settlement: Dictionary, replay: Dictionary) -> void:
	fail_replay_data = {
		"settlement": settlement.duplicate(true),
		"replay": replay.duplicate(true)
	}

func get_fail_replay() -> Dictionary:
	return fail_replay_data.duplicate(true)

func clear_all() -> void:
	settlement_data.clear()
	fail_replay_data.clear()
