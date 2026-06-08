extends Node

var is_recording: bool = false
var current_session: Dictionary = {}
var event_buffer: Array = []
var session_start_time: int = 0
var last_event_time: int = 0
var max_events_per_session: int = 2000

func start_session(level_id: int) -> void:
	is_recording = true
	session_start_time = Time.get_ticks_msec()
	last_event_time = session_start_time
	event_buffer.clear()
	current_session = {
		"session_id": "session_%s_%d" % [Time.get_datetime_string_from_system(), level_id],
		"level_id": level_id,
		"timestamp": Time.get_datetime_string_from_system(),
		"duration_ms": 0,
		"events": event_buffer,
		"summary": {}
	}
	record_event("session_start", {"level_id": level_id})

func end_session() -> void:
	if not is_recording:
		return
	var end_time: int = Time.get_ticks_msec()
	current_session["duration_ms"] = end_time - session_start_time
	current_session["summary"] = _compute_summary()
	is_recording = false
	SaveManager.add_play_session(current_session.duplicate(true))

func record_event(event_type: String, data: Dictionary = {}) -> void:
	if not is_recording:
		return
	if event_buffer.size() >= max_events_per_session:
		return
	var now: int = Time.get_ticks_msec()
	var offset_ms: int = now - session_start_time
	var delta_ms: int = now - last_event_time
	last_event_time = now
	var event := {
		"type": event_type,
		"offset_ms": offset_ms,
		"delta_ms": delta_ms,
		"data": data.duplicate()
	}
	event_buffer.append(event)

func record_item_action(action: String, item_name: String, position: Vector2, rotation: float) -> void:
	record_event("item_%s" % action, {
		"item": item_name,
		"x": position.x,
		"y": position.y,
		"rotation_deg": rotation
	})

func record_decision(decision_type: String, context: Dictionary) -> void:
	record_event("decision_%s" % decision_type, context)

func get_current_session() -> Dictionary:
	return current_session.duplicate(true)

func get_event_count() -> int:
	return event_buffer.size()

func _compute_summary() -> Dictionary:
	var summary := {
		"total_events": event_buffer.size(),
		"place_count": 0,
		"remove_count": 0,
		"rotate_count": 0,
		"undo_count": 0,
		"redo_count": 0,
		"mistakes_count": 0,
		"timeouts_count": 0,
		"key_decisions": []
	}
	for event in event_buffer:
		var t: String = event.get("type", "")
		match t:
			"item_placed":
				summary["place_count"] += 1
				summary["key_decisions"].append({"offset_ms": event["offset_ms"], "action": "place", "detail": event.get("data", {})})
			"item_removed":
				summary["remove_count"] += 1
			"undo", "redo":
				if t == "undo":
					summary["undo_count"] += 1
				else:
					summary["redo_count"] += 1
			"mistake":
				summary["mistakes_count"] += 1
			"decision_":
				summary["key_decisions"].append({"offset_ms": event["offset_ms"], "type": t, "detail": event.get("data", {})})
	if summary["key_decisions"].size() > 10:
		var arr: Array = summary["key_decisions"]
		summary["key_decisions"] = arr.slice(arr.size() - 10, arr.size())
	return summary

func export_session_to_json() -> String:
	return JSON.stringify(current_session, "\t")

func get_last_sessions(count: int = 10) -> Array:
	return SaveManager.get_play_sessions(count)
