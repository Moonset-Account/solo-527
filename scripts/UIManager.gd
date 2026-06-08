extends Node

var current_notifications: Array = []
var notification_queue: Array = []
var max_visible_notifications: int = 4
var is_paused: bool = false
var ui_layer: CanvasLayer = null
var hud_root: Control = null
var notification_root: Control = null

signal notification_closed(data: Dictionary)

func _ready() -> void:
	_call_deferred("_setup_ui_layer")

func _setup_ui_layer() -> void:
	ui_layer = CanvasLayer.new()
	ui_layer.layer = 100
	add_child(ui_layer)
	notification_root = Control.new()
	notification_root.anchor_right = 1.0
	notification_root.anchor_bottom = 1.0
	notification_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_layer.add_child(notification_root)

func show_toast(message: String, duration: float = 2.0, type: String = "info") -> void:
	var data := {
		"message": message,
		"duration": duration,
		"type": type,
		"timestamp": Time.get_ticks_msec()
	}
	notification_queue.append(data)
	_process_queue()

func show_score_popup(points: int, position: Vector2, reason: String = "") -> void:
	var popup_data := {
		"points": points,
		"position": position,
		"reason": reason,
		"time": Time.get_ticks_msec()
	}
	notification_queue.append({"type": "score_popup", "data": popup_data})
	_process_queue()

func show_item_hint(item: Node, hint_type: String, detail: String = "") -> void:
	notification_queue.append({
		"type": "item_hint",
		"item": item,
		"hint": hint_type,
		"detail": detail,
		"duration": 1.5
	})
	_process_queue()

func _process_queue() -> void:
	if notification_root == null:
		return
	while notification_queue.size() > 0 and current_notifications.size() < max_visible_notifications:
		var item: Dictionary = notification_queue.pop_front()
		_create_notification(item)

func _create_notification(data: Dictionary) -> void:
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var padding: int = 12
	panel.add_theme_stylebox_override("panel", _create_panel_style(data.get("type", "info")))
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	panel.add_child(vbox)
	var label := Label.new()
	label.text = data.get("message", data.get("hint", ""))
	label.add_theme_font_size_override("font_size", 16)
	label.add_theme_color_override("font_color", Color.WHITE)
	vbox.add_child(label)
	if data.has("detail") and data["detail"] != "":
		var sub_label := Label.new()
		sub_label.text = data["detail"]
		sub_label.add_theme_font_size_override("font_size", 12)
		sub_label.add_theme_color_override("font_color", Color(0.85, 0.85, 0.85))
		vbox.add_child(sub_label)
	notification_root.add_child(panel)
	panel.position = Vector2(20, 60 + current_notifications.size() * 80)
	panel.modulate.a = 0.0
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(panel, "modulate:a", 1.0, 0.25)
	tween.tween_property(panel, "position:x", 20.0, 0.35).set_trans(Tween.TRANS_BACK)
	tween.set_parallel(false)
	tween.tween_interval(data.get("duration", 2.0))
	tween.set_parallel(true)
	tween.tween_property(panel, "modulate:a", 0.0, 0.3)
	tween.tween_property(panel, "position:x", -300.0, 0.3).set_trans(Tween.TRANS_SINE)
	tween.chain().tween_callback(func():
		if current_notifications.has(panel):
			current_notifications.erase(panel)
		panel.queue_free()
		_reflow_notifications()
		_process_queue()
	)
	current_notifications.append(panel)

func _create_panel_style(type: String) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_right = 8
	style.corner_radius_bottom_left = 8
	style.content_margin_left = 14
	style.content_margin_top = 8
	style.content_margin_right = 14
	style.content_margin_bottom = 8
	style.shadow_size = 6
	style.shadow_color = Color(0, 0, 0, 0.4)
	match type:
		"success":
			style.bg_color = Color(0.2, 0.6, 0.3, 0.95)
			style.border_color = Color(0.35, 0.85, 0.45, 1.0)
		"error", "fail":
			style.bg_color = Color(0.7, 0.2, 0.2, 0.95)
			style.border_color = Color(0.95, 0.35, 0.35, 1.0)
		"warning":
			style.bg_color = Color(0.7, 0.55, 0.1, 0.95)
			style.border_color = Color(0.95, 0.8, 0.2, 1.0)
		"fragile":
			style.bg_color = Color(0.55, 0.25, 0.6, 0.95)
			style.border_color = Color(0.85, 0.55, 0.95, 1.0)
		_:
			style.bg_color = Color(0.15, 0.3, 0.55, 0.95)
			style.border_color = Color(0.35, 0.55, 0.85, 1.0)
	style.border_width_left = 2
	style.border_width_top = 2
	style.border_width_right = 2
	style.border_width_bottom = 2
	return style

func _reflow_notifications() -> void:
	for i in range(current_notifications.size()):
		var panel := current_notifications[i]
		if is_instance_valid(panel):
			var tween := create_tween()
			tween.tween_property(panel, "position:y", 60.0 + i * 80.0, 0.25)

func confirm_dialog(title: String, message: String, ok_callback: Callable, cancel_callback: Callable = Callable()) -> void:
	var window := AcceptDialog.new()
	window.title = title
	window.dialog_text = message
	window.confirmed.connect(ok_callback)
	if cancel_callback.is_valid():
		window.canceled.connect(cancel_callback)
	ui_layer.add_child(window)
	window.popup_centered()

func show_big_text(text: String, sub_text: String = "", duration: float = 2.0, color: Color = Color.WHITE) -> void:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 72)
	label.add_theme_color_override("font_color", color)
	label.z_index = 10
	label.anchor_right = 1.0
	label.anchor_left = 0.0
	label.anchor_top = 0.0
	label.anchor_bottom = 1.0
	label.offset_top = -100
	notification_root.add_child(label)
	var sub_label := null
	if sub_text != "":
		sub_label = Label.new()
		sub_label.text = sub_text
		sub_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		sub_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		sub_label.add_theme_font_size_override("font_size", 28)
		sub_label.add_theme_color_override("font_color", Color(0.85, 0.85, 0.85))
		sub_label.anchor_right = 1.0
		sub_label.anchor_left = 0.0
		sub_label.anchor_top = 0.0
		sub_label.anchor_bottom = 1.0
		sub_label.offset_top = 80
		sub_label.z_index = 10
		notification_root.add_child(sub_label)
	var tween := create_tween()
	label.modulate.a = 0.0
	label.scale = Vector2(0.5, 0.5)
	tween.set_parallel(true)
	tween.tween_property(label, "modulate:a", 1.0, 0.3)
	tween.tween_property(label, "scale", Vector2.ONE, 0.4).set_trans(Tween.TRANS_BACK)
	if sub_label:
		sub_label.modulate.a = 0.0
		tween.tween_property(sub_label, "modulate:a", 1.0, 0.5)
	tween.set_parallel(false)
	tween.tween_interval(duration)
	tween.set_parallel(true)
	tween.tween_property(label, "modulate:a", 0.0, 0.5)
	tween.tween_property(label, "scale", Vector2(1.2, 1.2), 0.5).set_trans(Tween.TRANS_SINE)
	if sub_label:
		tween.tween_property(sub_label, "modulate:a", 0.0, 0.5)
	tween.chain().tween_callback(func():
		label.queue_free()
		if sub_label:
			sub_label.queue_free()
	)
