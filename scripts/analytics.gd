extends Node

var _failure_log: Array[Dictionary] = []
var _retry_counts: Dictionary = {}
var _tutorial_skipped: bool = false
var _tutorial_completed: bool = false
var _tips_skipped_count: int = 0
var _tips_shown_log: Array[Dictionary] = []
var _total_play_time: float = 0.0
var _session_start_time: float = 0.0
var _level_completions: Array[Dictionary] = []
var _daily_revenue_log: Array[Dictionary] = []

func _ready() -> void:
	_session_start_time = Time.get_ticks_msec() / 1000.0

func _process(delta: float) -> void:
	_total_play_time += delta

func log_failure(step: String, detail: String = "") -> void:
	var entry := {
		"step": step,
		"detail": detail,
		"timestamp": Time.get_datetime_string_from_system(),
		"play_time": _total_play_time
	}
	_failure_log.append(entry)
	if not _retry_counts.has(step):
		_retry_counts[step] = 0
	_retry_counts[step] += 1

func log_retry(step: String) -> void:
	if not _retry_counts.has(step):
		_retry_counts[step] = 0
	_retry_counts[step] += 1

func mark_tutorial_skipped() -> void:
	_tutorial_skipped = true

func mark_tutorial_completed() -> void:
	_tutorial_completed = true

func log_tip_shown(tip_id: String, was_skipped: bool) -> void:
	_tips_shown_log.append({
		"tip_id": tip_id,
		"skipped": was_skipped,
		"timestamp": Time.get_datetime_string_from_system()
	})
	if was_skipped:
		_tips_skipped_count += 1

func log_level_completion(level_id: int, profit: int, days_taken: int) -> void:
	_level_completions.append({
		"level_id": level_id,
		"profit": profit,
		"days_taken": days_taken,
		"timestamp": Time.get_datetime_string_from_system(),
		"play_time": _total_play_time
	})

func log_daily_revenue(day: int, revenue: int, expenses: int, customers_served: int) -> void:
	_daily_revenue_log.append({
		"day": day,
		"revenue": revenue,
		"expenses": expenses,
		"customers_served": customers_served,
		"profit": revenue - expenses
	})

func get_retry_count(step: String) -> int:
	return _retry_counts.get(step, 0)

func get_failure_steps() -> Array[String]:
	var steps: Array[String] = []
	for entry in _failure_log:
		if not steps.has(entry.step):
			steps.append(entry.step)
	return steps

func get_summary() -> Dictionary:
	return {
		"tutorial_skipped": _tutorial_skipped,
		"tutorial_completed": _tutorial_completed,
		"tips_skipped_count": _tips_skipped_count,
		"total_failures": _failure_log.size(),
		"total_retries": _retry_counts.values().reduce(func(a, b): return a + b, 0),
		"failure_steps": get_failure_steps(),
		"retry_counts": _retry_counts.duplicate(),
		"levels_completed": _level_completions.size(),
		"total_play_time": _total_play_time
	}

func get_save_data() -> Dictionary:
	return {
		"failure_log": _failure_log,
		"retry_counts": _retry_counts,
		"tutorial_skipped": _tutorial_skipped,
		"tutorial_completed": _tutorial_completed,
		"tips_skipped_count": _tips_skipped_count,
		"tips_shown_log": _tips_shown_log,
		"total_play_time": _total_play_time,
		"level_completions": _level_completions,
		"daily_revenue_log": _daily_revenue_log
	}

func apply_save_data(data: Dictionary) -> void:
	if data.has("failure_log"):
		_failure_log = data.failure_log
	if data.has("retry_counts"):
		_retry_counts = data.retry_counts
	if data.has("tutorial_skipped"):
		_tutorial_skipped = data.tutorial_skipped
	if data.has("tutorial_completed"):
		_tutorial_completed = data.tutorial_completed
	if data.has("tips_skipped_count"):
		_tips_skipped_count = data.tips_skipped_count
	if data.has("tips_shown_log"):
		_tips_shown_log = data.tips_shown_log
	if data.has("total_play_time"):
		_total_play_time = data.total_play_time
	if data.has("level_completions"):
		_level_completions = data.level_completions
	if data.has("daily_revenue_log"):
		_daily_revenue_log = data.daily_revenue_log
