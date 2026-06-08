class_name AllocationPanel
extends Control

signal allocation_confirmed(choices: Dictionary)

var _resource_manager: ResourceManager
var _equipment_system: EquipmentWearSystem
var _sliders: Dictionary = {}
var _value_labels: Dictionary = {}
var _budget_label: Label
var _confirm_button: Button
var _total_budget: int = 20
var _drain_reduction_per_point: int = 2

func setup(rm: ResourceManager, es: EquipmentWearSystem) -> void:
	_resource_manager = rm
	_equipment_system = es
	_build_ui()

func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_CENTER)
	offset_left = -280
	offset_top = -200
	offset_right = 280
	offset_bottom = 200

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

	_budget_label = Label.new()
	_budget_label.text = "剩余预算: %d / %d" % [_total_budget, _total_budget]
	_budget_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(_budget_label)

	for t: ResourceType.Type in ResourceType.all_types():
		var outer := VBoxContainer.new()

		var header := HBoxContainer.new()
		var name_label := Label.new()
		name_label.text = ResourceType.type_icon_hint(t) + " " + ResourceType.type_name(t)
		name_label.custom_minimum_size.x = 90
		header.add_child(name_label)

		var current_label := Label.new()
		current_label.name = "CurrentVal"
		current_label.custom_minimum_size.x = 70
		header.add_child(current_label)

		var effect_label := Label.new()
		effect_label.name = "EffectHint"
		effect_label.custom_minimum_size.x = 120
		header.add_child(effect_label)

		outer.add_child(header)

		var slider_row := HBoxContainer.new()
		var slider := HSlider.new()
		slider.min_value = 0
		slider.max_value = _total_budget
		slider.step = 1
		slider.value = 0
		slider.custom_minimum_size.x = 200
		slider_row.add_child(slider)

		var val_label := Label.new()
		val_label.text = "0"
		val_label.custom_minimum_size.x = 30
		val_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		slider_row.add_child(val_label)

		outer.add_child(slider_row)
		vbox.add_child(outer)

		slider.value_changed.connect(_on_slider_changed)
		_sliders[t] = slider
		_value_labels[t] = val_label

	_confirm_button = Button.new()
	_confirm_button.text = "确认分配"
	_confirm_button.pressed.connect(_on_confirm)
	vbox.add_child(_confirm_button)

	visible = false

func _on_slider_changed(_new_val: float) -> void:
	var used := _get_total_allocated()
	_budget_label.text = "剩余预算: %d / %d" % [_total_budget - used, _total_budget]

	for t: ResourceType.Type in _sliders:
		var slider: HSlider = _sliders[t]
		(_value_labels[t] as Label).text = str(int(slider.value))

		var parent_outer := slider.get_parent().get_parent()
		var header := parent_outer.get_child(0)
		var current_label: Label = header.get_node("CurrentVal")
		var effect_label: Label = header.get_node("EffectHint")

		var current_val := _resource_manager.get_value(t)
		var current_max := _resource_manager.get_max(t)
		current_label.text = "当前: %d/%d" % [current_val, current_max]

		var alloc := int(slider.value)
		if t == ResourceType.Type.REPAIR:
			effect_label.text = "修复人员: %d人" % alloc
		else:
			var reduction := alloc * _drain_reduction_per_point
			effect_label.text = "减少损耗: -%d" % reduction

	_validate_sliders()

func _validate_sliders() -> void:
	var used := _get_total_allocated()
	if used > _total_budget:
		_confirm_button.disabled = true
		_confirm_button.text = "超出预算！"
		_budget_label.modulate = Color.RED
	else:
		_confirm_button.disabled = false
		_confirm_button.text = "确认分配"
		_budget_label.modulate = Color.WHITE

func _get_total_allocated() -> int:
	var total := 0
	for t: ResourceType.Type in _sliders:
		var slider: HSlider = _sliders[t]
		total += int(slider.value)
	return total

func show_panel() -> void:
	visible = true
	_reset_sliders()
	_on_slider_changed(0)

func hide_panel() -> void:
	visible = false

func _reset_sliders() -> void:
	for t: ResourceType.Type in _sliders:
		var slider: HSlider = _sliders[t]
		slider.value = 0

func _on_confirm() -> void:
	if _get_total_allocated() > _total_budget:
		return
	var choices: Dictionary = {}
	for t: ResourceType.Type in _sliders:
		var slider: HSlider = _sliders[t]
		choices[t] = int(slider.value)
	allocation_confirmed.emit(choices)
