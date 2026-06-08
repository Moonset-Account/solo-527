class_name TaskSystem
extends Node

signal task_completed(task: TaskData)
signal task_failed(task: TaskData)
signal all_tasks_completed()

var _tasks: Array[TaskData] = []
var _completed_count: int = 0

func setup_tasks(tasks: Array[TaskData]) -> void:
	_tasks.clear()
	_completed_count = 0
	for t in tasks:
		var copy: TaskData = t.duplicate()
		copy.is_completed = false
		copy.is_failed = false
		_tasks.append(copy)

func get_tasks() -> Array[TaskData]:
	return _tasks

func get_task_at_position(pos: Vector2i) -> TaskData:
	for t in _tasks:
		if t.grid_position == pos and not t.is_completed and not t.is_failed:
			return t
	return null

func apply_power_to_task(task: TaskData, power: int, task_type: TaskData.TaskType) -> void:
	if task.is_completed or task.is_failed:
		return
	if task.task_type != task_type:
		return
	task.required_power -= power
	if task.required_power <= 0:
		task.is_completed = true
		_completed_count += 1
		task_completed.emit(task)
		if _completed_count >= _tasks.size():
			all_tasks_completed.emit()

func tick_tasks() -> void:
	for t in _tasks:
		if t.is_completed or t.is_failed:
			continue
		t.turns_remaining -= 1
		if t.turns_remaining <= 0:
			t.is_failed = true
			task_failed.emit(t)

func get_completed_count() -> int:
	return _completed_count

func get_total_count() -> int:
	return _tasks.size()
