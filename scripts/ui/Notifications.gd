extends CanvasLayer
## Notifications - 提示通知系统

@onready var stack: VBoxContainer = $Stack

var _notif_count: int = 0

func show_notification(text: String, type: String = "info", duration: float = 3.0) -> void:
	var color_map: Dictionary = {
		"info": Color(0.4, 0.6, 1.0),
		"success": Color(0.4, 0.9, 0.45),
		"warning": Color(1.0, 0.78, 0.3),
		"error": Color(1.0, 0.4, 0.4)
	}
	var col: Color = color_map.get(type, Color.WHITE)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	row.modulate.a = 0.0
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.04, 0.1, 0.95)
	style.border_color = col
	style.border_width_left = 4
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.corner_radius_top_left = 4
	style.corner_radius_bottom_left = 4
	style.corner_radius_top_right = 4
	style.corner_radius_bottom_right = 4
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", style)
	pc.add_child(row)
	var icon_lbl := Label.new()
	var icon_map: Dictionary = {
		"info": "ℹ",
		"success": "✓",
		"warning": "⚠",
		"error": "✗"
	}
	icon_lbl.text = icon_map.get(type, "•")
	icon_lbl.modulate = col
	icon_lbl.add_theme_font_size_override("font_size", 22)
	row.add_child(icon_lbl)
	var txt_lbl := Label.new()
	txt_lbl.text = text
	txt_lbl.modulate = Color(0.95, 0.95, 1.0)
	txt_lbl.add_theme_font_size_override("font_size", 14)
	txt_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	txt_lbl.custom_minimum_size = Vector2(280, 0)
	row.add_child(txt_lbl)
	stack.add_child(pc)
	_notif_count += 1
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(pc, "modulate:a", 1.0, 0.2)
	tween.tween_interval(duration)
	tween.tween_property(pc, "modulate:a", 0.0, 0.4)
	tween.finished.connect(func():
		if is_instance_valid(pc):
			pc.queue_free()
		_notif_count -= 1
	)
