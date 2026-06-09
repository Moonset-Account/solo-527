extends Control
class_name TaskNode

signal clicked(task_idx: int)

var task_data: Dictionary = {}
var tile_size: int = 64
var task_idx: int = -1
var icon_bg: ColorRect
var icon_label: Label
var name_label: Label
var progress_bg: ColorRect
var progress_bar: ColorRect
var progress_label: Label

func setup(data: Dictionary, ts: int, idx: int):
	task_data = data
	tile_size = ts
	task_idx = idx
	size = Vector2(tile_size, tile_size)
	mouse_filter = Control.MOUSE_FILTER_STOP
	custom_minimum_size = size
	_build_ui()
	update_visual(data)

func _build_ui():
	var task_type: String = task_data.get("type", "")
	var bg_color: Color = Color.WHITE
	var icon: String = "❓"
	match task_type:
		"booth":
			bg_color = Color(0.95, 0.6, 0.25)
			icon = "🎪"
		"promo":
			bg_color = Color(0.35, 0.65, 0.95)
			icon = "📣"
		"reception":
			bg_color = Color(0.25, 0.8, 0.55)
			icon = "🤝"
	icon_bg = ColorRect.new()
	icon_bg.size = Vector2(tile_size - 10, tile_size - 28)
	icon_bg.position = Vector2(5, 4)
	icon_bg.color = bg_color
	icon_bg.corner_radius_top_left = 8
	icon_bg.corner_radius_top_right = 8
	icon_bg.corner_radius_bottom_left = 4
	icon_bg.corner_radius_bottom_right = 4
	add_child(icon_bg)
	icon_label = Label.new()
	icon_label.text = icon
	icon_label.add_theme_font_size_override("font_size", int(tile_size * 0.42))
	icon_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	icon_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	icon_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	icon_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(icon_label)
	name_label = Label.new()
	name_label.text = str(task_data.get("name", "任务"))
	name_label.add_theme_font_size_override("font_size", 10)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.position = Vector2(0, tile_size - 22)
	name_label.size = Vector2(tile_size, 12)
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(name_label)
	progress_bg = ColorRect.new()
	progress_bg.color = Color(0, 0, 0, 0.65)
	progress_bg.position = Vector2(3, tile_size - 8)
	progress_bg.size = Vector2(tile_size - 6, 6)
	progress_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(progress_bg)
	progress_bar = ColorRect.new()
	progress_bar.color = Color(0.95, 0.85, 0.3)
	progress_bar.position = progress_bg.position
	progress_bar.size = Vector2(0, 6)
	progress_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(progress_bar)
	progress_label = Label.new()
	progress_label.text = "0/0"
	progress_label.add_theme_font_size_override("font_size", 9)
	progress_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	progress_label.position = Vector2(0, tile_size - 11)
	progress_label.size = Vector2(tile_size, 10)
	progress_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	progress_label.modulate = Color.WHITE
	add_child(progress_label)

func update_visual(data: Dictionary):
	task_data = data
	var prog: float = float(data.get("progress", 0))
	var req: float = float(data.get("required_progress", 1))
	var ratio: float = clamp(prog / req, 0.0, 1.0)
	progress_bar.size = Vector2((tile_size - 6) * ratio, 6)
	if data.get("completed", false):
		progress_bar.color = Color(0.3, 0.9, 0.4)
		progress_label.text = "完成 ✓"
		modulate = Color(0.7, 0.7, 0.7, 0.85)
	else:
		progress_label.text = "%.0f/%.0f" % [prog, req]
		modulate = Color.WHITE

func _gui_input(event: InputEvent):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		emit_signal("clicked", task_idx)
		get_viewport().set_input_as_handled()
