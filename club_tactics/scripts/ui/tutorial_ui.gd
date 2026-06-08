class_name TutorialUI
extends Control

signal tutorial_step_completed(step_index: int)
signal tutorial_finished()

var _steps: Array[String] = []
var _current_step: int = 0
var _highlight_rect: ColorRect = null
var _text_label: RichTextLabel = null
var _next_button: Button = null
var _arrow: Panel = null

func _ready() -> void:
    _highlight_rect = ColorRect.new()
    _highlight_rect.color = Color(1, 1, 0, 0.2)
    _highlight_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _highlight_rect.z_index = 10
    add_child(_highlight_rect)
    _highlight_rect.visible = false

    _text_label = RichTextLabel.new()
    _text_label.bbcode_enabled = true
    _text_label.size = Vector2(400, 120)
    _text_label.position = Vector2(880, 550)
    _text_label.z_index = 11
    add_child(_text_label)

    _next_button = Button.new()
    _next_button.text = "下一步"
    _next_button.position = Vector2(1180, 680)
    _next_button.z_index = 11
    add_child(_next_button)
    _next_button.pressed.connect(_on_next_pressed)

func setup_tutorial(steps: Array[String]) -> void:
    _steps = steps
    _current_step = 0
    _show_step(0)

func _show_step(index: int) -> void:
    if index >= _steps.size():
        tutorial_finished.emit()
        visible = false
        return
    _text_label.text = _steps[index]
    _highlight_rect.visible = true

func _on_next_pressed() -> void:
    tutorial_step_completed.emit(_current_step)
    _current_step += 1
    _show_step(_current_step)

func highlight_area(rect: Rect2) -> void:
    _highlight_rect.position = rect.position
    _highlight_rect.size = rect.size
    _highlight_rect.visible = true

func hide_highlight() -> void:
    _highlight_rect.visible = false
