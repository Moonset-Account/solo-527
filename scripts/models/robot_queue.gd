class_name RobotQueue
extends Node

signal robot_assigned(robot_id: int, target: StringName)
signal robot_returned(robot_id: int)
signal queue_changed

var _robots: Array[Dictionary] = []
var _next_id: int = 0
var _assignment_history: Array[Dictionary] = []

func setup(count: int) -> void:
	_robots.clear()
	_assignment_history.clear()
	_next_id = 0
	for i in count:
		_robots.append({
			"id": _next_id,
			"status": "idle",
			"target": &"",
			"task_type": &"",
			"time_remaining": 0.0,
		})
		_next_id += 1
	queue_changed.emit()

func get_idle_count() -> int:
	var count = 0
	for r in _robots:
		if r["status"] == "idle":
			count += 1
	return count

func get_busy_count() -> int:
	return _robots.size() - get_idle_count()

func get_all_robots() -> Array[Dictionary]:
	return _robots.duplicate(true)

func assign_robot(target: StringName, task_type: StringName, duration: float) -> bool:
	for r in _robots:
		if r["status"] == "idle":
			r["status"] = "busy"
			r["target"] = target
			r["task_type"] = task_type
			r["time_remaining"] = duration
			_assignment_history.append({
				"robot_id": r["id"],
				"target": target,
				"task_type": task_type,
				"duration": duration,
			})
			robot_assigned.emit(r["id"], target)
			queue_changed.emit()
			return true
	return false

func undo_last_assignment() -> bool:
	if _assignment_history.is_empty():
		return false
	var last = _assignment_history.pop_back()
	var rid = last["robot_id"]
	for r in _robots:
		if r["id"] == rid and r["status"] == "busy" and r["target"] == last["target"]:
			r["status"] = "idle"
			r["target"] = &""
			r["task_type"] = &""
			r["time_remaining"] = 0.0
			robot_returned.emit(rid)
			queue_changed.emit()
			return true
	_assignment_history.append(last)
	return false

func process(delta: float) -> Array[Dictionary]:
	var completed: Array[Dictionary] = []
	for r in _robots:
		if r["status"] == "busy":
			r["time_remaining"] -= delta
			if r["time_remaining"] <= 0.0:
				var info = {
					"robot_id": r["id"],
					"target": r["target"],
					"task_type": r["task_type"],
				}
				completed.append(info)
				r["status"] = "idle"
				r["target"] = &""
				r["task_type"] = &""
				r["time_remaining"] = 0.0
				robot_returned.emit(r["id"])
	if completed.size() > 0:
		queue_changed.emit()
	return completed

func serialize() -> Dictionary:
	return {
		"robots": _robots.duplicate(true),
		"next_id": _next_id,
		"history": _assignment_history.duplicate(true),
	}

func deserialize(data: Dictionary) -> void:
	_robots.clear()
	for r in data.get("robots", []):
		_robots.append(r)
	_next_id = data.get("next_id", 0)
	_assignment_history.clear()
	for h in data.get("history", []):
		_assignment_history.append(h)
	queue_changed.emit()
