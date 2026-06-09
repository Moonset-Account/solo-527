extends Control

signal choice_made(event: Dictionary, choice_idx: int)

var overlay: ColorRect
var panel: PanelContainer
var current_event: Dictionary = {}

func _ready():
	AudioManager.play_sfx("dialog")
	_build_ui()

func set_event(ev: Dictionary):
	current_event = ev

func _build_ui():
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.5)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	overlay.modulate.a = 0
	var ft: Tween = create_tween()
	ft.tween_property(overlay, "modulate:a", 1.0, 0.18)
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.anchor_left = 0
	vbox.anchor_right = 1
	vbox.offset_left = 80
	vbox.offset_right = -80
	vbox.anchor_top = 1
	vbox.offset_top = -320
	vbox.offset_bottom = -40
	add_child(vbox)
	panel = PanelContainer.new()
	var is_ev: bool = current_event.get("type", "") == "event"
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.1, 0.2)
	sb.corner_radius_top_left = 14
	sb.corner_radius_top_right = 14
	sb.corner_radius_bottom_left = 14
	sb.corner_radius_bottom_right = 14
	sb.content_margin_left = 28
	sb.content_margin_right = 28
	sb.content_margin_top = 18
	sb.content_margin_bottom = 18
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(0.55, 0.75, 1.0) if not is_ev else Color(0.95, 0.65, 0.3)
	panel.add_theme_stylebox_override("panel", sb)
	vbox.add_child(panel)
	panel.modulate.a = 0
	panel.position.y = 40
	var tw2: Tween = create_tween()
	tw2.tween_property(panel, "modulate:a", 1.0, 0.25)
	tw2.parallel().tween_property(panel, "position:y", 0.0, 0.25).set_ease(Tween.EASE_OUT)
	var mv: VBoxContainer = VBoxContainer.new()
	mv.add_theme_constant_override("separation", 12)
	panel.add_child(mv)
	var title: Label = Label.new()
	title.text = current_event.get("title", "剧情事件")
	title.add_theme_font_size_override("font_size", 26)
	title.modulate = Color(0.85, 0.95, 1.0) if not is_ev else Color(1, 0.88, 0.5)
	mv.add_child(title)
	var content: Label = Label.new()
	content.text = current_event.get("content", "")
	content.add_theme_font_size_override("font_size", 17)
	content.modulate = Color(0.92, 0.95, 1.0)
	content.autowrap_mode = TextServer.AUTOWRAP_WORD
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	mv.add_child(content)
	var spacer: Control = Control.new()
	spacer.custom_minimum_size = Vector2(0, 6)
	mv.add_child(spacer)
	var choices: Array = current_event.get("choices", [])
	for i in choices.size():
		var ch: Dictionary = choices[i]
		var btn: StyledButton = StyledButton.new(ch.get("text", ""), Color(0.22, 0.35, 0.6), Color(0.38, 0.55, 0.8))
		btn.custom_minimum_size = Vector2(0, 48)
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var idx_copy: int = i
		btn.pressed.connect(func _(ic=idx_copy): _select(ic))
		mv.add_child(btn)

func _select(idx: int):
	AudioManager.play_sfx("click")
	var tw: Tween = create_tween()
	tw.tween_property(panel, "modulate:a", 0.0, 0.18)
	tw.parallel().tween_property(overlay, "modulate:a", 0.0, 0.18)
	var cur_ev: Dictionary = current_event
	var ic: int = idx
	tw.tween_callback(queue_free)
	tw.tween_callback(func _(): emit_signal("choice_made", cur_ev, ic))

func _input(event: InputEvent):
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode in [KEY_SPACE, KEY_ENTER, KEY_KP_ENTER]:
			var choices: Array = current_event.get("choices", [])
			if choices.size() == 1:
				_select(0)
				get_viewport().set_input_as_handled()
			elif choices.size() >= 1:
				var digit: int = event.keycode - KEY_1
				if digit >= 0 and digit < choices.size():
					_select(digit)
					get_viewport().set_input_as_handled()
