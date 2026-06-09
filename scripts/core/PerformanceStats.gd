extends Node

var fps_history: Array = []
var frame_times: Array = []
var memory_usage: float = 0.0
var draw_calls: int = 0
var objects_in_tree: int = 0
var enabled: bool = false
var stats_updated: bool = false
const MAX_HISTORY := 120

func _ready() -> void:
	enabled = SaveManager.get_setting("gameplay.show_performance_stats", false)

func _process(_delta: float) -> void:
	if not enabled:
		return
	var fps := Engine.get_frames_per_second()
	var ft := Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0
	fps_history.append(fps)
	frame_times.append(ft)
	if fps_history.size() > MAX_HISTORY:
		fps_history.remove_at(0)
	if frame_times.size() > MAX_HISTORY:
		frame_times.remove_at(0)
	memory_usage = float(OS.get_static_memory_usage()) / (1024.0 * 1024.0)
	draw_calls = int(Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME))
	objects_in_tree = get_tree().get_node_count()
	stats_updated = true

func set_enabled(value: bool) -> void:
	enabled = value
	SaveManager.set_setting("gameplay.show_performance_stats", value)

func toggle_enabled() -> void:
	set_enabled(not enabled)

func get_current_fps() -> float:
	if fps_history.is_empty():
		return 0.0
	return float(fps_history[-1])

func get_average_fps() -> float:
	if fps_history.is_empty():
		return 0.0
	var total := 0.0
	for f in fps_history:
		total += float(f)
	return total / float(fps_history.size())

func get_min_fps() -> float:
	if fps_history.is_empty():
		return 0.0
	var min_val := float(fps_history[0])
	for f in fps_history:
		if float(f) < min_val:
			min_val = float(f)
	return min_val

func get_max_fps() -> float:
	if fps_history.is_empty():
		return 0.0
	var max_val := float(fps_history[0])
	for f in fps_history:
		if float(f) > max_val:
			max_val = float(f)
	return max_val

func get_current_frame_time() -> float:
	if frame_times.is_empty():
		return 0.0
	return float(frame_times[-1])

func get_average_frame_time() -> float:
	if frame_times.is_empty():
		return 0.0
	var total := 0.0
	for f in frame_times:
		total += float(f)
	return total / float(frame_times.size())

func get_memory_mb() -> float:
	return memory_usage

func get_draw_calls() -> int:
	return draw_calls

func get_object_count() -> int:
	return objects_in_tree

func get_fps_history() -> Array:
	return fps_history.duplicate()

func get_frame_time_history() -> Array:
	return frame_times.duplicate()

func get_summary_text() -> String:
	if not enabled:
		return ""
	var avg_fps := get_average_fps()
	var avg_ft := get_average_frame_time()
	return "FPS: %.0f (avg %.1f) | FT: %.2fms (avg %.2fms) | Mem: %.1fMB | DC: %d | Obj: %d" % [
		get_current_fps(), avg_fps,
		get_current_frame_time(), avg_ft,
		get_memory_mb(),
		get_draw_calls(),
		get_object_count()
	]

func reset_history() -> void:
	fps_history.clear()
	frame_times.clear()
