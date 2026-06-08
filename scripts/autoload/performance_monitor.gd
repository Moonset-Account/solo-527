extends Node

signal performance_warning(metric, value)

var fps_samples: Array = []
var frame_time_samples: Array = []
var memory_usage_samples: Array = []
var _frame_counter: int = 0

const MAX_SAMPLES: int = 60
const SAMPLE_INTERVAL: int = 10

func _process(delta: float) -> void:
	_frame_counter += 1
	if _frame_counter % SAMPLE_INTERVAL != 0:
		return
	fps_samples.append(Engine.get_frames_per_second())
	frame_time_samples.append(delta * 1000.0)
	memory_usage_samples.append(Performance.get_monitor(Performance.MEMORY_STATIC))
	if fps_samples.size() > MAX_SAMPLES:
		fps_samples.pop_front()
	if frame_time_samples.size() > MAX_SAMPLES:
		frame_time_samples.pop_front()
	if memory_usage_samples.size() > MAX_SAMPLES:
		memory_usage_samples.pop_front()
	if is_performance_warning():
		performance_warning.emit("fps", get_avg_fps())

func get_avg_fps() -> float:
	if fps_samples.is_empty():
		return 0.0
	var total: float = 0.0
	for sample in fps_samples:
		total += sample
	return total / fps_samples.size()

func get_min_fps() -> float:
	if fps_samples.is_empty():
		return 0.0
	var min_val: float = fps_samples[0]
	for sample in fps_samples:
		if sample < min_val:
			min_val = sample
	return min_val

func get_max_fps() -> float:
	if fps_samples.is_empty():
		return 0.0
	var max_val: float = fps_samples[0]
	for sample in fps_samples:
		if sample > max_val:
			max_val = sample
	return max_val

func get_avg_frame_time() -> float:
	if frame_time_samples.is_empty():
		return 0.0
	var total: float = 0.0
	for sample in frame_time_samples:
		total += sample
	return total / frame_time_samples.size()

func get_memory_usage() -> int:
	if memory_usage_samples.is_empty():
		return 0
	return int(memory_usage_samples[-1])

func get_performance_summary() -> Dictionary:
	return {
		"avg_fps": get_avg_fps(),
		"min_fps": get_min_fps(),
		"max_fps": get_max_fps(),
		"avg_frame_time_ms": get_avg_frame_time(),
		"memory_usage_bytes": get_memory_usage(),
		"is_warning": is_performance_warning(),
	}

func is_performance_warning() -> bool:
	return get_avg_fps() < 30.0

func get_average_fps() -> float:
	return get_avg_fps()

func get_average_frame_time() -> float:
	if frame_time_samples.is_empty():
		return 0.0
	var total: float = 0.0
	for sample in frame_time_samples:
		total += sample
	return (total / frame_time_samples.size()) / 1000.0
