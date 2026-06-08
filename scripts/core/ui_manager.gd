extends Node

signal popup_closed(popup_name: String)

var _canvas_layer: CanvasLayer
var _hud: Control
var _pause_menu: Control
var _notification_label: Label
var _notification_queue: Array[Dictionary] = []
var _notification_tween: Tween
var _is_showing_notification: bool = false
var _popups: Dictionary = {}

func _ready() -> void:
	_canvas_layer = CanvasLayer.new()
	_canvas_layer.layer = 50
	add_child(_canvas_layer)
	_hud = Control.new()
	_hud.name = "HUD"
	_hud.set_anchors_preset(Control.PRESET_FULL_RECT)
	_canvas_layer.add_child(_hud)
	_pause_menu = Control.new()
	_pause_menu.name = "PauseMenu"
	_pause_menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	_pause_menu.visible = false
	_canvas_layer.add_child(_pause_menu)
	_notification_label = Label.new()
	_notification_label.name = "NotificationLabel"
	_notification_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_notification_label.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_notification_label.anchor_bottom = 0.85
	_notification_label.anchor_top = 0.85
	_notification_label.grow_vertical = Control.GROW_DIRECTION_BOTH
	_notification_label.visible = false
	_canvas_layer.add_child(_notification_label)

func show_hud() -> void:
	_hud.visible = true

func hide_hud() -> void:
	_hud.visible = false

func show_popup(popup_name: String, data: Dictionary = {}) -> void:
	if _popups.has(popup_name):
		var popup: Control = _popups[popup_name]
		popup.visible = true
		popup.set_meta("popup_data", data)

func hide_popup(popup_name: String) -> void:
	if _popups.has(popup_name):
		_popups[popup_name].visible = false
		popup_closed.emit(popup_name)

func register_popup(popup_name: String, popup: Control) -> void:
	_popups[popup_name] = popup
	_canvas_layer.add_child(popup)
	popup.visible = false

func unregister_popup(popup_name: String) -> void:
	if _popups.has(popup_name):
		var popup: Control = _popups[popup_name]
		_canvas_layer.remove_child(popup)
		_popups.erase(popup_name)

func show_notification(text: String, duration: float = 2.0) -> void:
	_notification_queue.append({"text": text, "duration": duration})
	if not _is_showing_notification:
		_show_next_notification()

func update_hud(data: Dictionary) -> void:
	if _hud.has_method("update_display"):
		_hud.call("update_display", data)

func _show_next_notification() -> void:
	if _notification_queue.is_empty():
		_is_showing_notification = false
		return
	_is_showing_notification = true
	var entry: Dictionary = _notification_queue.pop_front()
	_notification_label.text = entry["text"]
	_notification_label.visible = true
	_notification_label.modulate.a = 0.0
	if _notification_tween:
		_notification_tween.kill()
	_notification_tween = create_tween()
	_notification_tween.tween_property(_notification_label, "modulate:a", 1.0, 0.3)
	_notification_tween.tween_interval(entry["duration"])
	_notification_tween.tween_property(_notification_label, "modulate:a", 0.0, 0.3)
	_notification_tween.tween_callback(_on_notification_finished)

func _on_notification_finished() -> void:
	_notification_label.visible = false
	_show_next_notification()

func get_hud() -> Control:
	return _hud

func get_pause_menu() -> Control:
	return _pause_menu

func get_notification_label() -> Label:
	return _notification_label
