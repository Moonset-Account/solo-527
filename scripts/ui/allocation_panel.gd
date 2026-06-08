class_name AllocationPanel
extends Control

signal allocation_confirmed(choices: Dictionary)

var _resource_manager: ResourceManager
var _sliders: Dictionary = {}
var _confirm_button: Button

func setup(rm: ResourceManager) -> void:
	_resource_manager = rm
	_build_ui()

func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_CENTER)
	offset_left = -200
	offset_top = -150
	offset_right = 200
	offset_bottom = 150

	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(panel)

	var vbox := VBoxContainer.new()
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "资源分配"
	title.add_theme_font_size_override("font_size", 18)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	for t: ResourceType.Type in ResourceType.all_types():
		var hbox := HBoxContainer.new()
		var name_label := Label.new()
		name_label.text = ResourceType.type_icon_hint(t) + " " + ResourceType.type_name(t)
		name_label.custom_minimum_size.x = 80
		hbox.add_child(name_label)

		var slider := HSlider.new()
		slider.min_value = 0
		slider.max_value = 20
		slider.step = 1
		slider.value = 5
		slider.custom_minimum_size.x = 150
		hbox.add_child(slider)

		var val_label := Label.new()
		val_label.text = "5"
		val_label.custom_minimum_size.x = 30
		val_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		hbox.add_child(val_label)

		slider.value_changed.connect(func(v: float): val_label.text = str(int(v)))
		vbox.add_child(hbox)
		_sliders[t] = slider

	_confirm_button = Button.new()
	_confirm_button.text = "确认分配"
	_confirm_button.pressed.connect(_on_confirm)
	vbox.add_child(_confirm_button)

	visible = false

func show_panel() -> void:
	visible = true

func hide_panel() -> void:
	visible = false

func _on_confirm() -> void:
	var choices: Dictionary = {}
	for t: ResourceType.Type in _sliders:
		var slider: HSlider = _sliders[t]
		choices[t] = int(slider.value)
	allocation_confirmed.emit(choices)
