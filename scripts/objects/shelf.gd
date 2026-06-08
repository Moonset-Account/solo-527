extends StaticBody2D
class_name Shelf

@export var shelf_id: String = ""
@export var correct_label: String = ""
@export var current_label: String = ""
@export var is_fixed: bool = false

signal label_fixed(shelf_id: String)

var _highlight_enabled: bool = false
var _label_node: Label

func _ready() -> void:
	collision_layer = 4
	collision_mask = 1
	_label_node = Label.new()
	_label_node.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label_node.position = Vector2(-20, -20)
	add_child(_label_node)
	_update_label_text()

func _draw() -> void:
	draw_rect(Rect2(-24, -32, 48, 64), Color(0.55, 0.35, 0.17))
	if _highlight_enabled:
		draw_rect(Rect2(-24, -32, 48, 64), Color(0, 1, 0, 0.6), false, 2.0)

func scan() -> Dictionary:
	return {
		"shelf_id": shelf_id,
		"correct_label": correct_label,
		"current_label": current_label,
		"is_fixed": is_fixed
	}

func fix_label() -> void:
	current_label = correct_label
	is_fixed = true
	_update_label_text()
	label_fixed.emit(shelf_id)

func set_highlight(enabled: bool) -> void:
	_highlight_enabled = enabled
	queue_redraw()

func _update_label_text() -> void:
	if _label_node:
		_label_node.text = current_label
