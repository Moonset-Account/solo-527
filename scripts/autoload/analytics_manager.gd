extends Node

var session_data: Dictionary = {}

func _ready() -> void:
	start_session()

func start_session() -> void:
	session_data = {
		"session_start": Time.get_unix_time_from_system(),
		"level_starts": {},
		"failures": {},
		"key_choices": [],
		"completions": {},
	}

func start_level_analytics(level_id: String) -> void:
	if not session_data.has("level_starts"):
		session_data["level_starts"] = {}
	session_data["level_starts"][level_id] = Time.get_unix_time_from_system()

func record_failure(level_id: String, reason: String) -> void:
	if not session_data.has("failures"):
		session_data["failures"] = {}
	if not session_data["failures"].has(level_id):
		session_data["failures"][level_id] = []
	session_data["failures"][level_id].append({
		"reason": reason,
		"timestamp": Time.get_unix_time_from_system()
	})

func record_choice(level_id, choice_type: String, details: Dictionary) -> void:
	if not session_data.has("key_choices"):
		session_data["key_choices"] = []
	session_data["key_choices"].append({
		"level_id": str(level_id),
		"choice_type": choice_type,
		"details": details,
		"timestamp": Time.get_unix_time_from_system()
	})

func record_level_complete(level_id: String, time_seconds: float, stars: int) -> void:
	if not session_data.has("completions"):
		session_data["completions"] = {}
	session_data["completions"][level_id] = {
		"time": time_seconds,
		"stars": stars,
		"timestamp": Time.get_unix_time_from_system()
	}

func get_session_summary() -> Dictionary:
	var total_failures := 0
	if session_data.has("failures"):
		for level_id in session_data["failures"]:
			total_failures += session_data["failures"][level_id].size()
	return {
		"duration": Time.get_unix_time_from_system() - session_data.get("session_start", 0.0),
		"levels_started": session_data.get("level_starts", {}).size(),
		"levels_completed": session_data.get("completions", {}).size(),
		"total_failures": total_failures,
		"key_choices_count": session_data.get("key_choices", []).size(),
	}

func get_level_stats(level_id: String) -> Dictionary:
	var result: Dictionary = {
		"started": false,
		"completed": false,
		"failures": 0,
		"stars": 0,
		"completion_time": 0.0,
	}
	if session_data.has("level_starts") and session_data["level_starts"].has(level_id):
		result["started"] = true
	if session_data.has("completions") and session_data["completions"].has(level_id):
		result["completed"] = true
		result["stars"] = session_data["completions"][level_id].get("stars", 0)
		result["completion_time"] = session_data["completions"][level_id].get("time", 0.0)
	if session_data.has("failures") and session_data["failures"].has(level_id):
		result["failures"] = session_data["failures"][level_id].size()
	return result
