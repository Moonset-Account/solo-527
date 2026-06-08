extends Node

var _fps_samples: Array[float] = []
var _frame_times: Array[float] = []
var _max_samples: int = 300
var _current_fps: float = 60.0
var _avg_fps: float = 60.0
var _min_fps: float = 60.0
var _max_fps: float = 60.0
var _frame_time_avg: float = 16.67
var _memory_usage: int = 0
var _draw_calls: int = 0
var _object_count: int = 0
var _node_count: int = 0
var _target_fps: int = 60
var _sample_timer: float = 0.0
var _sample_interval: float = 0.5

signal stats_updated(stats: Dictionary)

func _ready() -> void:
	_load_fps_settings()

func _process(delta: float) -> void:
	_sample_timer += delta
	var current: float = Performance.get_monitor(Performance.TIME_FPS)
	_current_fps = current
	_frame_times.append(delta * 1000.0)
	if _frame_times.size() > _max_samples:
		_frame_times.pop_front()
	if _sample_timer >= _sample_interval:
		_sample_timer = 0.0
		_update_stats()

func _update_stats() -> void:
	_fps_samples.append(_current_fps)
	if _fps_samples.size() > _max_samples:
		_fps_samples.pop_front()
	if _fps_samples.size() > 0:
		var total: float = 0.0
		_min_fps = _fps_samples[0]
		_max_fps = _fps_samples[0]
		for fps in _fps_samples:
			total += fps
			if fps < _min_fps:
				_min_fps = fps
			if fps > _max_fps:
				_max_fps = fps
		_avg_fps = total / _fps_samples.size()
	if _frame_times.size() > 0:
		var total_ft: float = 0.0
		for ft in _frame_times:
			total_ft += ft
		_frame_time_avg = total_ft / _frame_times.size()
	_memory_usage = Performance.get_monitor(Performance.MEMORY_STATIC)
	_object_count = Performance.get_monitor(Performance.OBJECT_COUNT)
	_node_count = Performance.get_monitor(Performance.OBJECT_NODE_COUNT)
	stats_updated.emit(get_stats())

func get_stats() -> Dictionary:
	return {
		"current_fps": _current_fps,
		"avg_fps": _avg_fps,
		"min_fps": _min_fps,
		"max_fps": _max_fps,
		"frame_time_ms": _frame_time_avg,
		"memory_mb": _memory_usage / 1048576.0,
		"object_count": _object_count,
		"node_count": _node_count,
		"target_fps": _target_fps
	}

func set_target_fps(fps: int) -> void:
	_target_fps = clampi(fps, 30, 144)
	Engine.max_fps = _target_fps
	_save_fps_settings()

func set_vsync(enabled: bool) -> void:
	if enabled:
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED)
	else:
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)

func _save_fps_settings() -> void:
	var settings := SaveSystem.load_settings()
	settings["target_fps"] = _target_fps
	SaveSystem.save_settings(settings)

func _load_fps_settings() -> void:
	var settings := SaveSystem.load_settings()
	if settings.has("target_fps"):
		_target_fps = int(settings.target_fps)
		Engine.max_fps = _target_fps
	if settings.has("vsync"):
		set_vsync(settings.vsync)
