class_name AnalyticsManager
extends Node

const ANALYTICS_PATH: String = "user://analytics.json"
const AUTO_SAVE_INTERVAL: float = 30.0

var _data: Dictionary = {}
var _current_level_id: String = ""
var _level_start_time: float = 0.0
var _auto_save_timer: Timer

func _ready() -> void:
	_load_analytics_internal()
	_auto_save_timer = Timer.new()
	_auto_save_timer.wait_time = AUTO_SAVE_INTERVAL
	_auto_save_timer.autostart = true
	_auto_save_timer.timeout.connect(save_analytics)
	add_child(_auto_save_timer)

func start_level_tracking(level_id: String) -> void:
	_current_level_id = level_id
	_level_start_time = Time.get_ticks_msec() / 1000.0
	if not _data.has("level_time"):
		_data["level_time"] = {}
	if not _data.has("failure_count"):
		_data["failure_count"] = {}
	if not _data.has("discovery_count"):
		_data["discovery_count"] = {}
	if not _data.has("labels_fixed"):
		_data["labels_fixed"] = {}
	if not _data.has("key_choices"):
		_data["key_choices"] = []

func record_failure(segment_id: String) -> void:
	if not _data.has("failure_count"):
		_data["failure_count"] = {}
	if not _data["failure_count"].has(segment_id):
		_data["failure_count"][segment_id] = 0
	_data["failure_count"][segment_id] += 1
	var record: Dictionary = {
		"segment_id": segment_id,
		"timestamp": Time.get_datetime_string_from_system(),
		"type": "failure"
	}
	_data["key_choices"].append(record)

func record_discovery(segment_id: String) -> void:
	if not _data.has("discovery_count"):
		_data["discovery_count"] = {}
	if not _data["discovery_count"].has(segment_id):
		_data["discovery_count"][segment_id] = 0
	_data["discovery_count"][segment_id] += 1
	var record: Dictionary = {
		"segment_id": segment_id,
		"timestamp": Time.get_datetime_string_from_system(),
		"type": "discovery"
	}
	_data["key_choices"].append(record)

func record_label_fixed(shelf_id: String) -> void:
	if not _data.has("labels_fixed"):
		_data["labels_fixed"] = {}
	if not _data["labels_fixed"].has(shelf_id):
		_data["labels_fixed"][shelf_id] = 0
	_data["labels_fixed"][shelf_id] += 1
	var record: Dictionary = {
		"shelf_id": shelf_id,
		"timestamp": Time.get_datetime_string_from_system(),
		"type": "label_fixed"
	}
	_data["key_choices"].append(record)

func record_choice(choice_id: String, choice_data: Dictionary) -> void:
	var record: Dictionary = choice_data.duplicate()
	record["choice_id"] = choice_id
	record["timestamp"] = Time.get_datetime_string_from_system()
	record["type"] = "choice"
	_data["key_choices"].append(record)

func end_level_tracking() -> void:
	if _current_level_id == "":
		return
	var elapsed: float = Time.get_ticks_msec() / 1000.0 - _level_start_time
	if not _data.has("level_time"):
		_data["level_time"] = {}
	_data["level_time"][_current_level_id] = elapsed
	_current_level_id = ""
	save_analytics()

func get_session_summary() -> Dictionary:
	var total_failures: int = 0
	for key in _data.get("failure_count", {}):
		total_failures += int(_data["failure_count"][key])
	var total_discoveries: int = 0
	for key in _data.get("discovery_count", {}):
		total_discoveries += int(_data["discovery_count"][key])
	var total_labels: int = 0
	for key in _data.get("labels_fixed", {}):
		total_labels += int(_data["labels_fixed"][key])
	return {
		"total_failures": total_failures,
		"total_discoveries": total_discoveries,
		"total_labels_fixed": total_labels,
		"total_choices": _data.get("key_choices", []).size(),
		"level_times": _data.get("level_time", {})
	}

func save_analytics() -> void:
	var file: FileAccess = FileAccess.open(ANALYTICS_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_data, "\t"))
		file.close()

func load_analytics() -> Dictionary:
	return _data

func _load_analytics_internal() -> void:
	if FileAccess.file_exists(ANALYTICS_PATH):
		var file: FileAccess = FileAccess.open(ANALYTICS_PATH, FileAccess.READ)
		if file:
			var json: JSON = JSON.new()
			var err: Error = json.parse(file.get_as_text())
			file.close()
			if err == OK and json.data is Dictionary:
				_data = json.data
				return
	_data = {
		"level_time": {},
		"failure_count": {},
		"discovery_count": {},
		"labels_fixed": {},
		"key_choices": []
	}
