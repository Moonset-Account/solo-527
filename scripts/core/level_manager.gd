extends Node

signal level_loaded(level_id: String)
signal segment_advanced(segment_id: String)
signal segment_reset(segment_id: String)
signal level_completed

var current_level_id: String = ""
var current_segment_index: int = 0
var _level_data: Dictionary = {}
var _original_segment_states: Dictionary = {}
var _last_checkpoint: Dictionary = {}

func load_level(level_id: String) -> Dictionary:
	var file_path = "res://data/levels/" + level_id + ".json"
	if not FileAccess.file_exists(file_path):
		push_error("Level file not found: " + file_path)
		return {}
	var file = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		push_error("Failed to open level file: " + file_path)
		return {}
	var json = JSON.new()
	var err = json.parse(file.get_as_text())
	file.close()
	if err != OK:
		push_error("JSON parse error in " + file_path + ": " + json.get_error_message())
		return {}
	var data = json.get_data()
	if not data is Dictionary:
		push_error("Invalid level data format in " + file_path)
		return {}
	current_level_id = level_id
	current_segment_index = 0
	_level_data = data
	_store_original_state()
	var segments = _level_data.get("segments", [])
	if segments.size() > 0:
		var first_seg = segments[0]
		_last_checkpoint = first_seg.get("player_start", {}).duplicate()
		for cp in first_seg.get("checkpoints", []):
			_last_checkpoint = cp.get("position", _last_checkpoint).duplicate()
			break
	level_loaded.emit(level_id)
	return _level_data

func _store_original_state() -> void:
	_original_segment_states.clear()
	var segments = _level_data.get("segments", [])
	for i in range(segments.size()):
		var seg = segments[i]
		var seg_id = seg.get("id", "seg_" + str(i))
		var state: Dictionary = {}
		state["shelves"] = []
		for shelf in seg.get("shelves", []):
			state["shelves"].append({
				"id": shelf.get("id", ""),
				"current_label": shelf.get("current_label", ""),
				"is_fixed": shelf.get("is_fixed", false)
			})
		state["guards"] = []
		for guard in seg.get("guards", []):
			var patrol = guard.get("patrol_points", [])
			var start_pos = patrol[0] if patrol.size() > 0 else {x = 0.0, y = 0.0}
			state["guards"].append({
				"id": guard.get("id", ""),
				"start_position": start_pos.duplicate()
			})
		state["player_start"] = seg.get("player_start", {}).duplicate()
		_original_segment_states[seg_id] = state

func get_level_data() -> Dictionary:
	return _level_data

func get_current_segment() -> Dictionary:
	var segments = _level_data.get("segments", [])
	if current_segment_index < 0 or current_segment_index >= segments.size():
		return {}
	return segments[current_segment_index]

func advance_segment() -> void:
	var segments = _level_data.get("segments", [])
	if current_segment_index >= segments.size() - 1:
		level_completed.emit()
		return
	current_segment_index += 1
	var seg = get_current_segment()
	_last_checkpoint = seg.get("player_start", {}).duplicate()
	for cp in seg.get("checkpoints", []):
		_last_checkpoint = cp.get("position", _last_checkpoint).duplicate()
		break
	segment_advanced.emit(seg.get("id", ""))

func reset_current_segment() -> void:
	var seg = get_current_segment()
	if seg.is_empty():
		return
	var seg_id = seg.get("id", "")
	var state = _original_segment_states.get(seg_id, {})
	if state.is_empty():
		return
	var shelves = seg.get("shelves", [])
	var original_shelves = state.get("shelves", [])
	for i in range(min(shelves.size(), original_shelves.size())):
		shelves[i]["current_label"] = original_shelves[i]["current_label"]
		shelves[i]["is_fixed"] = original_shelves[i]["is_fixed"]
	var guards = seg.get("guards", [])
	var original_guards = state.get("guards", [])
	for i in range(min(guards.size(), original_guards.size())):
		guards[i]["patrol_points"][0] = original_guards[i]["start_position"].duplicate()
	segment_reset.emit(seg_id)

func get_level_list() -> Array:
	var dir = DirAccess.open("res://data/levels/")
	if dir == null:
		return []
	var levels: Array = []
	dir.list_dir_begin()
	var file_name = dir.get_next()
	while file_name != "":
		if file_name.ends_with(".json"):
			var level_id = file_name.replace(".json", "")
			var file_path = "res://data/levels/" + file_name
			var file = FileAccess.open(file_path, FileAccess.READ)
			if file != null:
				var json = JSON.new()
				if json.parse(file.get_as_text()) == OK:
					var data = json.get_data()
					if data is Dictionary:
						levels.append({
							"id": data.get("id", level_id),
							"name": data.get("name", level_id)
						})
				file.close()
		file_name = dir.get_next()
	dir.list_dir_end()
	return levels

func save_level(level_data: Dictionary, file_name: String) -> void:
	var dir = DirAccess.open("user://")
	if dir != null and not dir.dir_exists("custom_levels"):
		dir.make_dir("custom_levels")
	var file_path = "user://custom_levels/" + file_name
	if not file_path.ends_with(".json"):
		file_path += ".json"
	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		push_error("Failed to save level to: " + file_path)
		return
	var json_string = JSON.stringify(level_data, "\t")
	file.store_string(json_string)
	file.close()
