extends Control
class_name StyledButton

func _init(txt: String = "", bg_col: Color = Color(0.2, 0.4, 0.7), hover_col: Color = Color(0.3, 0.55, 0.9)):
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_SHRINK_CENTER
	custom_minimum_size = Vector2(160, 44)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var bg: StyleBoxFlat = StyleBoxFlat.new()
	bg.bg_color = bg_col
	bg.corner_radius_top_left = 8
	bg.corner_radius_top_right = 8
	bg.corner_radius_bottom_left = 8
	bg.corner_radius_bottom_right = 8
	bg.content_margin_left = 12
	bg.content_margin_right = 12
	bg.content_margin_top = 8
	bg.content_margin_bottom = 8
	add_theme_stylebox_override("normal", bg)
	var hover_sb: StyleBoxFlat = bg.duplicate()
	hover_sb.bg_color = hover_col
	add_theme_stylebox_override("hover", hover_sb)
	var pressed_sb: StyleBoxFlat = bg.duplicate()
	pressed_sb.bg_color = bg_col.darkened(0.2)
	add_theme_stylebox_override("pressed", pressed_sb)
	var disabled_sb: StyleBoxFlat = bg.duplicate()
	disabled_sb.bg_color = Color(0.3, 0.3, 0.3)
	add_theme_stylebox_override("disabled", disabled_sb)
	var lbl: Label = Label.new()
	lbl.text = txt
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 16)
	lbl.modulate = Color.WHITE
	lbl.set_anchors_preset(Control.PRESET_FULL_RECT)
	lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(lbl)

func set_text(t: String):
	if get_child_count() > 0 and get_child(0) is Label:
		(get_child(0) as Label).text = t

func _gui_input(event: InputEvent):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		AudioManager.play_sfx("click")
		emit_signal("pressed")
