extends CanvasLayer

var stats_visible: bool = false
var _fps_label: Label
var _stats_label: Label
var _frametimes: PackedFloat32Array = PackedFloat32Array()
var _max_frametime_samples: int = 60
var _update_timer: float = 0.0
var _update_interval: float = 0.5

func _ready() -> void:
	layer = 100
	_fps_label = Label.new()
	_fps_label.name = "FPSLabel"
	_fps_label.position = Vector2(10, 10)
	_fps_label.add_theme_font_size_override("font_size", 16)
	_fps_label.add_theme_color_override("font_color", Color.GREEN)
	_fps_label.add_theme_color_override("font_shadow_color", Color.BLACK)
	_fps_label.add_theme_constant_override("shadow_offset_x", 1)
	_fps_label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_fps_label)
	_stats_label = Label.new()
	_stats_label.name = "StatsLabel"
	_stats_label.position = Vector2(10, 30)
	_stats_label.add_theme_font_size_override("font_size", 12)
	_stats_label.add_theme_color_override("font_color", Color(Color.GREEN, 0.8))
	_stats_label.add_theme_color_override("font_shadow_color", Color.BLACK)
	_stats_label.add_theme_constant_override("shadow_offset_x", 1)
	_stats_label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_stats_label)

func _process(delta: float) -> void:
	_frametimes.append(delta)
	if _frametimes.size() > _max_frametime_samples:
		_frametimes.remove_at(0)
	_update_timer += delta
	if _update_timer >= _update_interval:
		_update_timer = 0.0
		_update_display()
	var show = SaveManager.get_setting("show_performance", false)
	_fps_label.visible = show or SaveManager.get_setting("show_fps", false)
	_stats_label.visible = show

func _update_display() -> void:
	if _frametimes.is_empty():
		return
	var avg = 0.0
	var mn = 999.0
	var mx = 0.0
	for ft in _frametimes:
		avg += ft
		mn = min(mn, ft)
		mx = max(mx, ft)
	avg /= _frametimes.size()
	var fps = 1.0 / avg if avg > 0 else 0
	_fps_label.text = "FPS: %d" % fps
	if fps < 30:
		_fps_label.add_theme_color_override("font_color", Color.RED)
	elif fps < 50:
		_fps_label.add_theme_color_override("font_color", Color.YELLOW)
	else:
		_fps_label.add_theme_color_override("font_color", Color.GREEN)
	var obj_count = Performance.get_monitor(Performance.OBJECT_COUNT)
	var orph_count = Performance.get_monitor(Performance.ORPHAN_NODE_COUNT)
	var mem_static = Performance.get_monitor(Performance.STATIC_MEMORY_USAGE)
	var render_objs = Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)
	_stats_label.text = "Avg: %.1fms | Min: %.1fms | Max: %.1fms\nObjects: %d | Orphans: %d | Mem: %.1fMB | Render: %d" % [
		avg * 1000, mn * 1000, mx * 1000,
		obj_count, orph_count, mem_static / 1048576.0, render_objs
	]

func get_stats() -> Dictionary:
	if _frametimes.is_empty():
		return {"fps": 0, "avg_ms": 0, "min_ms": 0, "max_ms": 0}
	var avg = 0.0
	var mn = 999.0
	var mx = 0.0
	for ft in _frametimes:
		avg += ft
		mn = min(mn, ft)
		mx = max(mx, ft)
	avg /= _frametimes.size()
	return {
		"fps": 1.0 / avg if avg > 0 else 0,
		"avg_ms": avg * 1000,
		"min_ms": mn * 1000,
		"max_ms": mx * 1000,
		"objects": Performance.get_monitor(Performance.OBJECT_COUNT),
		"orphans": Performance.get_monitor(Performance.ORPHAN_NODE_COUNT),
		"memory_mb": Performance.get_monitor(Performance.STATIC_MEMORY_USAGE) / 1048576.0
	}
