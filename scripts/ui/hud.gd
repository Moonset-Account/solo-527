extends CanvasLayer
class_name HUD

var energy_bar: ProgressBar
var label_counter: Label
var segment_indicator: Label
var noise_indicator: Control
var alert_status: Label
var timer_display: Label

var _noise_level: float = 0.0

func _ready() -> void:
	layer = 10
	var theme = Theme.new()
	var default_font = ThemeDB.fallback_font
	theme.set_font("font", "Label", default_font)
	theme.set_font_size("font_size", "Label", 16)
	theme.set_font("font", "Button", default_font)
	theme.set_font_size("font_size", "Button", 16)

	energy_bar = ProgressBar.new()
	energy_bar.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	energy_bar.position = Vector2(10, -30)
	energy_bar.size = Vector2(200, 20)
	energy_bar.min_value = 0
	energy_bar.max_value = 100
	energy_bar.value = 100
	energy_bar.show_percentage = false
	var bar_style = StyleBoxFlat.new()
	bar_style.bg_color = Color(0.2, 0.2, 0.2)
	bar_style.corner_radius_top_left = 3
	bar_style.corner_radius_top_right = 3
	bar_style.corner_radius_bottom_left = 3
	bar_style.corner_radius_bottom_right = 3
	energy_bar.add_theme_stylebox_override("background", bar_style)
	var fill_style = StyleBoxFlat.new()
	fill_style.bg_color = Color.CYAN
	fill_style.corner_radius_top_left = 3
	fill_style.corner_radius_top_right = 3
	fill_style.corner_radius_bottom_left = 3
	fill_style.corner_radius_bottom_right = 3
	energy_bar.add_theme_stylebox_override("fill", fill_style)
	energy_bar.theme = theme
	add_child(energy_bar)

	label_counter = Label.new()
	label_counter.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	label_counter.position = Vector2(-210, 10)
	label_counter.size = Vector2(200, 24)
	label_counter.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	label_counter.text = "Labels: 0/0 fixed"
	label_counter.theme = theme
	add_child(label_counter)

	segment_indicator = Label.new()
	segment_indicator.set_anchors_preset(Control.PRESET_TOP_LEFT)
	segment_indicator.position = Vector2(10, 10)
	segment_indicator.size = Vector2(200, 24)
	segment_indicator.text = "Segment: 1/1"
	segment_indicator.theme = theme
	add_child(segment_indicator)

	noise_indicator = Control.new()
	noise_indicator.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	noise_indicator.position = Vector2(-20, -50)
	noise_indicator.size = Vector2(40, 40)
	noise_indicator.theme = theme
	add_child(noise_indicator)

	alert_status = Label.new()
	alert_status.set_anchors_preset(Control.PRESET_CENTER_TOP)
	alert_status.position = Vector2(-60, 10)
	alert_status.size = Vector2(120, 24)
	alert_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	alert_status.text = "SAFE"
	alert_status.add_theme_color_override("font_color", Color.GREEN)
	alert_status.theme = theme
	add_child(alert_status)

	timer_display = Label.new()
	timer_display.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	timer_display.position = Vector2(-110, -30)
	timer_display.size = Vector2(100, 24)
	timer_display.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	timer_display.text = "0.0s"
	timer_display.theme = theme
	add_child(timer_display)

func update_energy(current: float, max_val: float) -> void:
	energy_bar.max_value = max_val
	energy_bar.value = current

func update_labels(fixed: int, total: int) -> void:
	label_counter.text = "Labels: %d/%d fixed" % [fixed, total]

func update_segment(current: int, total: int) -> void:
	segment_indicator.text = "Segment: %d/%d" % [current, total]

func set_alert(is_alert: bool) -> void:
	if is_alert:
		alert_status.text = "ALERT!"
		alert_status.add_theme_color_override("font_color", Color.RED)
	else:
		alert_status.text = "SAFE"
		alert_status.add_theme_color_override("font_color", Color.GREEN)

func update_noise_level(level: float) -> void:
	_noise_level = clampf(level, 0.0, 1.0)
	noise_indicator.queue_redraw()

func update_timer(time: float) -> void:
	timer_display.text = "%.1fs" % time
