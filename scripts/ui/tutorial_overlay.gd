class_name TutorialOverlay
extends Control

signal dismissed

var _text_label: RichTextLabel
var _dismiss_button: Button
var _current_step_id: String = ""

func _ready() -> void:
	_build_ui()

func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP

	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	panel.offset_left = -300
	panel.offset_top = -160
	panel.offset_right = 300
	panel.offset_bottom = -10
	panel.modulate = Color(1, 1, 1, 0.95)
	add_child(panel)

	var vbox := VBoxContainer.new()
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "教程"
	title.add_theme_font_size_override("font_size", 16)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	_text_label = RichTextLabel.new()
	_text_label.bbcode_enabled = true
	_text_label.fit_content = true
	_text_label.custom_minimum_size = Vector2(550, 100)
	vbox.add_child(_text_label)

	_dismiss_button = Button.new()
	_dismiss_button.text = "知道了"
	_dismiss_button.pressed.connect(_on_dismiss)
	vbox.add_child(_dismiss_button)

	visible = false

func show_tutorial(step_id: String, text: String) -> void:
	_current_step_id = step_id
	_text_label.text = text
	visible = true

func _on_dismiss() -> void:
	visible = false
	dismissed.emit()
