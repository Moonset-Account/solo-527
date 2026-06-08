extends StaticBody2D
class_name Shelf

@export var shelf_id: String = ""
@export var correct_label: String = ""
@export var current_label: String = ""
@export var is_fixed: bool = false

signal label_fixed(shelf_id: String)

var _highlight_enabled: bool = false
var _scanned: bool = false
var _label_node: Label
var _scan_info_node: Label

func _ready() -> void:
	collision_layer = 4
	collision_mask = 1
	_label_node = Label.new()
	_label_node.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label_node.position = Vector2(-30, -24)
	_label_node.size = Vector2(60, 16)
	add_child(_label_node)
	_scan_info_node = Label.new()
	_scan_info_node.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_scan_info_node.position = Vector2(-30, -40)
	_scan_info_node.size = Vector2(60, 16)
	_scan_info_node.visible = false
	add_child(_scan_info_node)
	_update_label_text()

func _draw() -> void:
	var base_color := Color(0.55, 0.35, 0.17)
	if is_fixed:
		base_color = Color(0.3, 0.6, 0.3)
	draw_rect(Rect2(-24, -32, 48, 64), base_color)
	draw_rect(Rect2(-24, -32, 48, 64), Color(0.3, 0.2, 0.1), false, 1.0)
	if _highlight_enabled:
		draw_rect(Rect2(-26, -34, 52, 68), Color(0, 1, 0, 0.7), false, 2.0)
	if _scanned and not is_fixed:
		draw_rect(Rect2(-26, -34, 52, 68), Color(1, 0.3, 0.3, 0.8), false, 2.0)

func get_shelf_id() -> String:
	return shelf_id

func scan() -> Dictionary:
	_scanned = true
	if not is_fixed and _scan_info_node:
		_scan_info_node.text = "→" + correct_label
		_scan_info_node.visible = true
		_scan_info_node.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
	queue_redraw()
	return {
		"shelf_id": shelf_id,
		"correct_label": correct_label,
		"current_label": current_label,
		"is_fixed": is_fixed
	}

func fix_label() -> void:
	current_label = correct_label
	is_fixed = true
	if _label_node:
		_label_node.add_theme_color_override("font_color", Color(0.3, 1.0, 0.3))
	if _scan_info_node:
		_scan_info_node.text = "✓"
		_scan_info_node.add_theme_color_override("font_color", Color(0.3, 1.0, 0.3))
	_update_label_text()
	label_fixed.emit(shelf_id)
	queue_redraw()

func set_highlight(enabled: bool) -> void:
	_highlight_enabled = enabled
	queue_redraw()

func clear_scan_state() -> void:
	_scanned = false
	if _scan_info_node:
		_scan_info_node.visible = false
	queue_redraw()

func _update_label_text() -> void:
	if _label_node:
		_label_node.text = current_label
