extends Control
class_name GuiInputDetector

signal input_detected(event: InputEvent, detector: GuiInputDetector)
signal mouse_enter_detector(detector: GuiInputDetector)
signal mouse_exit_detector(detector: GuiInputDetector)

var custom_data: Variant = null

func _gui_input(event: InputEvent):
	emit_signal("input_detected", event, self)
	get_viewport().set_input_as_handled()

func _mouse_entered():
	emit_signal("mouse_enter_detector", self)

func _mouse_exited():
	emit_signal("mouse_exit_detector", self)
