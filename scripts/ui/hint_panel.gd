extends Control

signal hint_dismissed
signal hint_action_taken(action: String)

@onready var hint_label: RichTextLabel = $Panel/MarginContainer/VBoxContainer/HintLabel
@onready var action_button: Button = $Panel/MarginContainer/VBoxContainer/ActionButton
@onready var dismiss_button: Button = $Panel/MarginContainer/VBoxContainer/DismissButton

var _current_hint_id: String = ""

func _ready() -> void:
	visible = false
	dismiss_button.pressed.connect(_on_dismiss)
	action_button.pressed.connect(_on_action)

func show_hint(hint_id: String, text: String, action_text: String = "") -> void:
	_current_hint_id = hint_id
	hint_label.text = text
	if action_text != "":
		action_button.text = action_text
		action_button.visible = true
	else:
		action_button.visible = false
	visible = true
	dismiss_button.grab_focus()

func hide_hint() -> void:
	visible = false
	_current_hint_id = ""

func _on_dismiss() -> void:
	hint_dismissed.emit()
	hide_hint()

func _on_action() -> void:
	hint_action_taken.emit(_current_hint_id)
	hide_hint()
