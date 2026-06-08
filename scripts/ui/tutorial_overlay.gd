class_name TutorialOverlay
extends Control

signal tutorial_completed

var _steps: Array[Dictionary] = []
var _current_step: int = -1
var _trigger_states: Dictionary = {}
var _panel: PanelContainer
var _text_label: RichTextLabel
var _next_button: Button
var _visible_flag: bool = false

func _ready() -> void:
	anchor_right = 1.0
	anchor_bottom = 1.0
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel = PanelContainer.new()
	_panel.anchor_left = 0.15
	_panel.anchor_right = 0.85
	_panel.anchor_top = 0.7
	_panel.anchor_bottom = 0.92
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.05, 0.08, 0.15, 0.95)
	style.border_color = Color(0.3, 0.6, 1.0)
	style.set_border_width_all(2)
	style.set_corner_radius_all(8)
	_panel.add_theme_stylebox_override("panel", style)
	_panel.visible = false
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	_text_label = RichTextLabel.new()
	_text_label.bbcode_enabled = true
	_text_label.fit_content = true
	_text_label.custom_minimum_size = Vector2(0, 50)
	_text_label.add_theme_font_size_override("normal_font_size", 18)
	_text_label.add_theme_color_override("default_color", Color(0.9, 0.95, 1.0))
	vbox.add_child(_text_label)
	_next_button = Button.new()
	_next_button.text = "继续"
	_next_button.custom_minimum_size = Vector2(120, 36)
	_next_button.pressed.connect(_on_next)
	vbox.add_child(_next_button)
	_panel.add_child(vbox)
	add_child(_panel)

func setup(steps: Array[Dictionary]) -> void:
	_steps = steps
	_current_step = -1
	_trigger_states.clear()
	_trigger_states["start"] = true

func trigger(trigger_name: String) -> void:
	_trigger_states[trigger_name] = true
	if _current_step < 0:
		_try_advance()

func _try_advance() -> void:
	if _current_step + 1 >= _steps.size():
		_hide_tutorial()
		tutorial_completed.emit()
		return
	var next = _steps[_current_step + 1]
	var trigger = next.get("trigger", "")
	if _trigger_states.get(trigger, false):
		_current_step += 1
		_show_step(_current_step)

func _show_step(index: int) -> void:
	if index < 0 or index >= _steps.size():
		return
	var step = _steps[index]
	var text = step.get("text", "")
	_text_label.text = text
	_panel.visible = true
	_visible_flag = true

func _hide_tutorial() -> void:
	_panel.visible = false
	_visible_flag = false

func _on_next() -> void:
	_try_advance()

func is_showing() -> bool:
	return _visible_flag

func is_finished() -> bool:
	return _current_step >= _steps.size() - 1 and not _visible_flag
