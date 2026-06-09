extends Control

var background_panel: Panel
var stats_label: Label
var fps_bar: ColorRect
var fps_bg: ColorRect
var update_timer: float = 0.0

func _ready() -> void:
	_setup_hud()
	visible = PerformanceStats.enabled
	PerformanceStats.set_enabled(PerformanceStats.enabled)

func _setup_hud() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	offset_left = 8
	offset_top = -90
	offset_right = 280
	offset_bottom = -8
	size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	size_flags_vertical = Control.SIZE_SHRINK_END
	background_panel = Panel.new()
	background_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0, 0, 0, 0.65)
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	background_panel.add_theme_stylebox_override("panel", sb)
	add_child(background_panel)
	var vb = VBoxContainer.new()
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 8
	vb.offset_top = 6
	vb.offset_right = -8
	vb.offset_bottom = -6
	background_panel.add_child(vb)
	var fps_row = HBoxContainer.new()
	fps_row.custom_minimum_size.y = 18
	vb.add_child(fps_row)
	var fps_title = Label.new()
	fps_title.text = "FPS:"
	fps_title.custom_minimum_size.x = 40
	fps_title.add_theme_font_size_override("font_size", 11)
	fps_title.add_theme_color_override("font_color", Color(0.7, 0.7, 0.75, 1))
	fps_row.add_child(fps_title)
	fps_bg = ColorRect.new()
	fps_bg.custom_minimum_size = Vector2(150, 10)
	fps_bg.color = Color(0.2, 0.2, 0.25, 1)
	fps_row.add_child(fps_bg)
	fps_bar = ColorRect.new()
	fps_bar.custom_minimum_size = Vector2(150, 10)
	fps_bar.color = Color(0.3, 0.85, 0.5, 1)
	fps_bar.position = fps_bg.position
	fps_row.add_child(fps_bar)
	stats_label = Label.new()
	stats_label.text = ""
	stats_label.add_theme_font_size_override("font_size", 10)
	stats_label.add_theme_color_override("font_color", Color(0.8, 0.85, 0.9, 1))
	stats_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_child(stats_label)

func _process(delta: float) -> void:
	if not visible:
		return
	update_timer += delta
	if update_timer >= 0.25:
		update_timer = 0.0
		_update_stats()

func _update_stats() -> void:
	var fps = PerformanceStats.get_current_fps()
	var avg_fps = PerformanceStats.get_average_fps()
	var mem = PerformanceStats.get_memory_mb()
	var dc = PerformanceStats.get_draw_calls()
	var obj = PerformanceStats.get_object_count()
	stats_label.text = "FPS: %.0f  Avg: %.1f  Mem: %.1fMB  DC: %d  Obj: %d" % [fps, avg_fps, mem, dc, obj]
	var limit: float = float(Engine.max_fps if Engine.max_fps > 0 else 60)
	var ratio: float = clamp(fps / limit, 0.0, 1.0)
	fps_bar.custom_minimum_size.x = 150.0 * ratio
	if ratio >= 0.9:
		fps_bar.color = Color(0.3, 0.85, 0.5, 1)
	elif ratio >= 0.6:
		fps_bar.color = Color(0.9, 0.8, 0.3, 1)
	else:
		fps_bar.color = Color(0.9, 0.4, 0.3, 1)

func toggle() -> void:
	PerformanceStats.toggle_enabled()
	visible = PerformanceStats.enabled

func set_show(value: bool) -> void:
	PerformanceStats.set_enabled(value)
	visible = value
