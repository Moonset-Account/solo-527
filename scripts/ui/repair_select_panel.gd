class_name RepairSelectPanel
extends Control

signal repair_confirmed
signal repair_cancelled

var _equipment_system: EquipmentWearSystem
var _repair_queue: RepairQueue
var _resource_manager: ResourceManager
var _slot_buttons: Dictionary = {}
var _queue_labels: Array[Label] = []
var _confirm_button: Button
var _cancel_button: Button
var _queue_container: VBoxContainer

func setup(ew: EquipmentWearSystem, rq: RepairQueue, rm: ResourceManager) -> void:
	_equipment_system = ew
	_repair_queue = rq
	_resource_manager = rm
	_repair_queue.queue_changed.connect(_on_queue_changed)
	_build_ui()

func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	visible = false

	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.offset_left = -300
	panel.offset_top = -250
	panel.offset_right = 300
	panel.offset_bottom = 250
	add_child(panel)

	var main_hbox := HBoxContainer.new()
	panel.add_child(main_hbox)

	var equip_vbox := VBoxContainer.new()
	equip_vbox.custom_minimum_size.x = 280
	main_hbox.add_child(equip_vbox)

	var equip_title := Label.new()
	equip_title.text = "设备状态（点击添加到维修队列）"
	equip_title.add_theme_font_size_override("font_size", 14)
	equip_vbox.add_child(equip_title)

	for slot: EquipmentSlot in _equipment_system.get_all_slots():
		var btn := Button.new()
		_update_slot_button(btn, slot)
		btn.pressed.connect(_on_slot_button_pressed.bind(slot))
		equip_vbox.add_child(btn)
		_slot_buttons[slot.id] = {"button": btn, "slot": slot}

	var queue_vbox := VBoxContainer.new()
	queue_vbox.custom_minimum_size.x = 250
	main_hbox.add_child(queue_vbox)

	var queue_title := Label.new()
	queue_title.text = "维修队列（优先级从上到下）"
	queue_title.add_theme_font_size_override("font_size", 14)
	queue_vbox.add_child(queue_title)

	_queue_container = VBoxContainer.new()
	queue_vbox.add_child(_queue_container)

	var personnel_label := Label.new()
	personnel_label.name = "PersonnelLabel"
	queue_vbox.add_child(personnel_label)

	var btn_hbox := HBoxContainer.new()
	btn_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	queue_vbox.add_child(btn_hbox)

	_cancel_button = Button.new()
	_cancel_button.text = "取消"
	_cancel_button.pressed.connect(func(): repair_cancelled.emit())
	btn_hbox.add_child(_cancel_button)

	_confirm_button = Button.new()
	_confirm_button.text = "确认维修"
	_confirm_button.pressed.connect(func(): repair_confirmed.emit())
	btn_hbox.add_child(_confirm_button)

func show_panel() -> void:
	visible = true
	_refresh_all()

func hide_panel() -> void:
	visible = false

func _on_slot_button_pressed(slot: EquipmentSlot) -> void:
	if _repair_queue.can_add(slot):
		_repair_queue.add_repair(slot)
		_refresh_all()

func _on_queue_changed() -> void:
	_refresh_all()

func _refresh_all() -> void:
	for slot_id: String in _slot_buttons:
		var data: Dictionary = _slot_buttons[slot_id]
		_update_slot_button(data["button"], data["slot"])

	for child: Node in _queue_container.get_children():
		child.queue_free()

	var queue := _repair_queue.get_queue()
	for i: int in queue.size():
		var slot: EquipmentSlot = queue[i]
		var hbox := HBoxContainer.new()
		var label := Label.new()
		label.text = "%d. %s (%d/%d)" % [i + 1, slot.display_name, slot.current_durability, slot.max_durability]
		hbox.add_child(label)

		var remove_btn := Button.new()
		remove_btn.text = "移除"
		remove_btn.pressed.connect(_on_remove_from_queue.bind(slot))
		hbox.add_child(remove_btn)

		var up_btn := Button.new()
		up_btn.text = "↑"
		up_btn.disabled = i == 0
		up_btn.pressed.connect(_on_move_up.bind(i))
		hbox.add_child(up_btn)

		var down_btn := Button.new()
		down_btn.text = "↓"
		down_btn.disabled = i == queue.size() - 1
		down_btn.pressed.connect(_on_move_down.bind(i))
		hbox.add_child(down_btn)

		_queue_container.add_child(hbox)

	var personnel_label: Label = _queue_container.get_parent().get_node("PersonnelLabel") as Label
	if personnel_label:
		var available := _resource_manager.get_value(ResourceType.Type.REPAIR)
		personnel_label.text = "可用维修人员: %d" % available

func _on_remove_from_queue(slot: EquipmentSlot) -> void:
	_repair_queue.remove_repair(slot)

func _on_move_up(index: int) -> void:
	_repair_queue.reorder(index, index - 1)

func _on_move_down(index: int) -> void:
	_repair_queue.reorder(index, index + 1)

func _update_slot_button(btn: Button, slot: EquipmentSlot) -> void:
	var ratio := slot.durability_ratio()
	var status := "正常"
	if slot.is_broken():
		status = "损坏"
	elif slot.is_critical():
		status = "警告"
	btn.text = "%s [%s] - %d/%d (%s)" % [
		slot.display_name,
		ResourceType.type_name(slot.affects_system),
		slot.current_durability,
		slot.max_durability,
		status,
	]
	if slot.is_broken():
		btn.modulate = Color.RED
	elif slot.is_critical():
		btn.modulate = Color.YELLOW
	else:
		btn.modulate = Color.WHITE

	if _repair_queue.get_queue().has(slot):
		btn.disabled = true
		btn.text += " [排队中]"
	else:
		btn.disabled = slot.is_broken() and _repair_queue.queue_size() >= 4
