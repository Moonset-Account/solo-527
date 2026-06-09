extends Node

var enabled: bool = false
var canvas: CanvasLayer
var fps_label: Label
var frame_time_label: Label
var draw_calls_label: Label
var memory_label: Label
var background: ColorRect
var _frame_count: int = 0
var _fps_sum: float = 0.0
var _update_timer: float = 0.0

func _ready():
	canvas = CanvasLayer.new()
	canvas.layer = 100
	add_child(canvas)
	enabled = SaveSystem.get_setting("show_performance", false)
	_build_ui()
	set_process(enabled)
	canvas.visible = enabled

func _build_ui():
	background = ColorRect.new()
	background.color = Color(0, 0, 0, 0.65)
	background.size = Vector2(220, 96)
	background.position = Vector2(8, 8)
	canvas.add_child(background)
	fps_label = Label.new()
	fps_label.position = Vector2(14, 8)
	fps_label.add_theme_font_size_override("font_size", 14)
	fps_label.modulate = Color(0.4, 1.0, 0.6)
	canvas.add_child(fps_label)
	frame_time_label = Label.new()
	frame_time_label.position = Vector2(14, 28)
	frame_time_label.add_theme_font_size_override("font_size", 14)
	frame_time_label.modulate = Color.WHITE
	canvas.add_child(frame_time_label)
	draw_calls_label = Label.new()
	draw_calls_label.position = Vector2(14, 48)
	draw_calls_label.add_theme_font_size_override("font_size", 14)
	draw_calls_label.modulate = Color.LIGHT_BLUE
	canvas.add_child(draw_calls_label)
	memory_label = Label.new()
	memory_label.position = Vector2(14, 68)
	memory_label.add_theme_font_size_override("font_size", 14)
	memory_label.modulate = Color.YELLOW
	canvas.add_child(memory_label)

func set_enabled(val: bool):
	enabled = val
	set_process(val)
	if canvas:
		canvas.visible = val
	SaveSystem.set_setting("show_performance", val)

func toggle():
	set_enabled(not enabled)

func _process(delta: float):
	_frame_count += 1
	var inst_fps: float = 1.0 / max(delta, 0.0001)
	_fps_sum += inst_fps
	_update_timer += delta
	if _update_timer >= 0.33:
		var avg_fps: float = _fps_sum / float(_frame_count)
		var target_fps: int = int(Engine.get_max_fps())
		if target_fps <= 0:
			target_fps = 60
		var quality: String = "优"
		var col: Color = Color(0.4, 1.0, 0.6)
		if avg_fps < target_fps * 0.8:
			quality = "良"
			col = Color.YELLOW
		if avg_fps < target_fps * 0.5:
			quality = "差"
			col = Color.RED
		fps_label.text = "FPS: %.0f / %d (%s)" % [avg_fps, target_fps, quality]
		fps_label.modulate = col
		frame_time_label.text = "帧时间: %.1f ms" % [delta * 1000.0]
		var mem_mb: float = float(OS.get_static_memory_usage()) / (1024.0 * 1024.0)
		mem_mb = min(mem_mb, 9999.0)
		memory_label.text = "内存: %.1f MB" % mem_mb
		var cpu_cores: int = int(OS.get_processor_count())
		draw_calls_label.text = "CPU核心: " + str(cpu_cores)
		_frame_count = 0
		_fps_sum = 0.0
		_update_timer = 0.0

func _on_save_changed():
	enabled = SaveSystem.get_setting("show_performance", false)
	set_process(enabled)
	if canvas:
		canvas.visible = enabled

func get_current_fps() -> float:
	if _frame_count > 0 and _fps_sum > 0:
		return _fps_sum / float(_frame_count)
	return Engine.get_frames_per_second()
