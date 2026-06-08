extends Node
class_name DataRecorder

var _session_data: Dictionary = {}
var _event_log: Array[Dictionary] = []
var _session_start_time: float = 0.0

func _ready() -> void:
	pass

func start_session() -> void:
	_session_start_time = Time.get_ticks_msec() / 1000.0
	_session_data.clear()
	_event_log.clear()

func log_event(event_name: String, data: Dictionary = {}) -> void:
	var entry: Dictionary = {
		"event": event_name,
		"timestamp": Time.get_ticks_msec() / 1000.0 - _session_start_time,
		"data": data
	}
	_event_log.append(entry)

func end_session() -> Dictionary:
	var duration: float = Time.get_ticks_msec() / 1000.0 - _session_start_time
	var summary: Dictionary = get_session_summary()
	_session_data["duration"] = duration
	_session_data["event_count"] = _event_log.size()
	_session_data["events"] = _event_log.duplicate()
	_session_data["summary"] = summary
	return _session_data.duplicate()

func save_to_file(path: String) -> bool:
	var file: FileAccess = FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	var json_string: String = JSON.stringify(_session_data, "\t")
	file.store_string(json_string)
	file.close()
	return true

func get_session_summary() -> Dictionary:
	var duration: float = 0.0
	if _session_start_time > 0.0:
		duration = Time.get_ticks_msec() / 1000.0 - _session_start_time
	var event_counts: Dictionary = {}
	for entry: Dictionary in _event_log:
		var name: String = entry["event"]
		if event_counts.has(name):
			event_counts[name] += 1
		else:
			event_counts[name] = 1
	return {
		"duration": duration,
		"total_events": _event_log.size(),
		"event_counts": event_counts
	}
