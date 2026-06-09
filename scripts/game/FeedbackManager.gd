extends CanvasLayer

signal feedback_finished()

var container: VBoxContainer
var active_feedbacks: Array = []

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	layer = 100
	container = VBoxContainer.new()
	container.name = "FeedbackContainer"
	container.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	container.offset_left = -340
	container.offset_top = 80
	container.offset_right = -20
	container.offset_bottom = -20
	container.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	container.add_theme_constant_override("separation", 8)
	add_child(container)
	EventBus.feedback_shown.connect(_on_feedback_requested)

func show_feedback(message: String, type: String = "info", duration: float = 2.5) -> void:
	_on_feedback_requested(message, type, duration)

func _on_feedback_requested(message: String, type: String, duration: float) -> void:
	var feedback = _create_feedback_item(message, type, duration)
	container.add_child(feedback)
	active_feedbacks.append(feedback)
	_animate_in_feedback(feedback)
	var timer = get_tree().create_timer(duration)
	timer.timeout.connect(_on_feedback_timeout.bind(feedback))

func _create_feedback_item(message: String, type: String, duration: float) -> Control:
	var ctrl = Control.new()
	ctrl.custom_minimum_size = Vector2(320, 0)
	ctrl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var panel = Panel.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var bg_color = Color(0.15, 0.15, 0.2, 0.95)
	var border_color = Color(0.4, 0.4, 0.5, 0.8)
	var icon = "ℹ"
	var icon_color = Color(0.6, 0.8, 1.0, 1)
	var sound_id = "ui_click"
	match type:
		"success":
			bg_color = Color(0.15, 0.28, 0.18, 0.95)
			border_color = Color(0.3, 0.8, 0.4, 0.8)
			icon = "✓"
			icon_color = Color(0.3, 0.9, 0.5, 1)
			sound_id = "feedback_success"
		"warning":
			bg_color = Color(0.3, 0.22, 0.1, 0.95)
			border_color = Color(0.9, 0.65, 0.2, 0.8)
			icon = "⚠"
			icon_color = Color(1.0, 0.8, 0.3, 1)
			sound_id = "feedback_warning"
		"error":
			bg_color = Color(0.3, 0.12, 0.12, 0.95)
			border_color = Color(0.9, 0.3, 0.3, 0.8)
			icon = "✕"
			icon_color = Color(1.0, 0.35, 0.35, 1)
			sound_id = "feedback_error"
	var sb = StyleBoxFlat.new()
	sb.bg_color = bg_color
	sb.border_color = border_color
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	sb.shadow_color = Color(0, 0, 0, 0.3)
	sb.shadow_size = 4
	sb.shadow_offset = Vector2(2, 2)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	panel.add_theme_stylebox_override("panel", sb)
	ctrl.add_child(panel)
	var hbox = HBoxContainer.new()
	hbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hbox.offset_left = 12
	hbox.offset_top = 10
	hbox.offset_right = -12
	hbox.offset_bottom = -10
	panel.add_child(hbox)
	var icon_label = Label.new()
	icon_label.text = icon
	icon_label.add_theme_font_size_override("font_size", 20)
	icon_label.add_theme_color_override("font_color", icon_color)
	icon_label.custom_minimum_size = Vector2(30, 0)
	hbox.add_child(icon_label)
	var msg_label = Label.new()
	msg_label.text = message
	msg_label.add_theme_font_size_override("font_size", 13)
	msg_label.add_theme_color_override("font_color", Color(0.92, 0.92, 0.98, 1))
	msg_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	msg_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	msg_label.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	hbox.add_child(msg_label)
	AudioManager.play_ui_sound(sound_id)
	return ctrl

func _animate_in_feedback(feedback: Control) -> void:
	feedback.modulate.a = 0.0
	feedback.position.x = 50
	var tw = feedback.create_tween()
	tw.set_parallel(true)
	tw.tween_property(feedback, "modulate:a", 1.0, 0.2 * GameManager.animation_speed)
	tw.tween_property(feedback, "position:x", 0.0, 0.25 * GameManager.animation_speed).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _animate_out_feedback(feedback: Control) -> void:
	var tw = feedback.create_tween()
	tw.set_parallel(true)
	tw.tween_property(feedback, "modulate:a", 0.0, 0.2 * GameManager.animation_speed)
	tw.tween_property(feedback, "position:x", 60.0, 0.2 * GameManager.animation_speed)
	tw.finished.connect(func():
		active_feedbacks.erase(feedback)
		feedback.queue_free()
		emit_signal("feedback_finished")
	)

func _on_feedback_timeout(feedback: Control) -> void:
	if is_instance_valid(feedback):
		_animate_out_feedback(feedback)

func clear_all() -> void:
	for fb in active_feedbacks:
		if is_instance_valid(fb):
			fb.queue_free()
	active_feedbacks.clear()
