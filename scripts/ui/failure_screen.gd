class_name FailureScreen
extends Control

signal retry_requested
signal back_to_menu_requested

func _ready() -> void:
	anchor_right = 1.0
	anchor_bottom = 1.0
	visible = false

func show_failure(reason: FailureReason) -> void:
	for child in get_children():
		child.queue_free()
	visible = true
	var overlay = ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.85)
	overlay.anchors_preset = Control.PRESET_FULL_RECT
	add_child(overlay)
	var center = VBoxContainer.new()
	center.anchor_left = 0.1
	center.anchor_right = 0.9
	center.anchor_top = 0.08
	center.anchor_bottom = 0.95
	center.add_theme_constant_override("separation", 12)
	add_child(center)
	var icon_label = Label.new()
	icon_label.text = FailureReason.category_icon(reason.category)
	icon_label.add_theme_font_size_override("font_size", 48)
	icon_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(icon_label)
	var title = Label.new()
	title.text = "任务失败 - %s" % reason.title
	title.add_theme_font_size_override("font_size", 28)
	title.add_theme_color_override("font_color", Color(1.0, 0.35, 0.3))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(title)
	var desc = Label.new()
	desc.text = reason.description
	desc.add_theme_font_size_override("font_size", 17)
	desc.add_theme_color_override("font_color", Color(0.95, 0.85, 0.8))
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(desc)
	var sep = HSeparator.new()
	center.add_child(sep)
	var detail_title = Label.new()
	detail_title.text = "复盘分析"
	detail_title.add_theme_font_size_override("font_size", 20)
	detail_title.add_theme_color_override("font_color", Color(0.7, 0.85, 1.0))
	center.add_child(detail_title)
	for line in reason.detail_lines:
		var lbl = Label.new()
		lbl.text = line
		lbl.add_theme_font_size_override("font_size", 15)
		lbl.add_theme_color_override("font_color", Color(0.8, 0.85, 0.9))
		lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		center.add_child(lbl)
	var sep2 = HSeparator.new()
	center.add_child(sep2)
	var suggestion_title = Label.new()
	suggestion_title.text = "💡 改进建议"
	suggestion_title.add_theme_font_size_override("font_size", 18)
	suggestion_title.add_theme_color_override("font_color", Color(0.5, 1.0, 0.7))
	center.add_child(suggestion_title)
	var suggestion = Label.new()
	suggestion.text = reason.suggestion
	suggestion.add_theme_font_size_override("font_size", 16)
	suggestion.add_theme_color_override("font_color", Color(0.7, 0.95, 0.75))
	suggestion.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	center.add_child(suggestion)
	var spacer = Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	center.add_child(spacer)
	var btn_row = HBoxContainer.new()
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	btn_row.add_theme_constant_override("separation", 24)
	center.add_child(btn_row)
	var retry_btn = Button.new()
	retry_btn.text = "重试本关"
	retry_btn.custom_minimum_size = Vector2(160, 48)
	retry_btn.add_theme_font_size_override("font_size", 18)
	retry_btn.pressed.connect(func(): retry_requested.emit())
	btn_row.add_child(retry_btn)
	var menu_btn = Button.new()
	menu_btn.text = "返回菜单"
	menu_btn.custom_minimum_size = Vector2(160, 48)
	menu_btn.add_theme_font_size_override("font_size", 18)
	menu_btn.pressed.connect(func(): back_to_menu_requested.emit())
	btn_row.add_child(menu_btn)

func hide_failure() -> void:
	visible = false
	for child in get_children():
		child.queue_free()
