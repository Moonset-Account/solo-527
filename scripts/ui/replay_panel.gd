class_name ReplayPanel
extends Control

signal closed

var _history: Array[Dictionary] = []
var _list: ItemList
var _detail: RichTextLabel

func _ready() -> void:
	_build_ui()
	visible = false

func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)

	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.offset_left = -350
	panel.offset_top = -250
	panel.offset_right = 350
	panel.offset_bottom = 250
	add_child(panel)

	var hbox := HBoxContainer.new()
	panel.add_child(hbox)

	var left_vbox := VBoxContainer.new()
	left_vbox.custom_minimum_size.x = 200
	hbox.add_child(left_vbox)

	var list_title := Label.new()
	list_title.text = "夜晚记录"
	left_vbox.add_child(list_title)

	_list = ItemList.new()
	_list.custom_minimum_size = Vector2(180, 400)
	_list.item_selected.connect(_on_item_selected)
	left_vbox.add_child(_list)

	var right_vbox := VBoxContainer.new()
	right_vbox.custom_minimum_size.x = 420
	hbox.add_child(right_vbox)

	var detail_title := Label.new()
	detail_title.text = "详细信息"
	right_vbox.add_child(detail_title)

	_detail = RichTextLabel.new()
	_detail.bbcode_enabled = true
	_detail.custom_minimum_size = Vector2(400, 380)
	right_vbox.add_child(_detail)

	var close_btn := Button.new()
	close_btn.text = "关闭"
	close_btn.pressed.connect(func(): closed.emit())
	right_vbox.add_child(close_btn)

func load_history(history: Array[Dictionary]) -> void:
	_history = history
	_list.clear()
	for i: int in history.size():
		var entry: Dictionary = history[i]
		var night: int = entry.get("night", i + 1)
		var survived: bool = entry.get("survived", true)
		var prefix := "✓" if survived else "✗"
		_list.add_item("第%d夜 %s" % [night, prefix])
		if not survived:
			_list.set_item_custom_fg_color(i, Color.RED)

func show_panel() -> void:
	visible = true

func hide_panel() -> void:
	visible = false

func _on_item_selected(index: int) -> void:
	if index < 0 or index >= _history.size():
		return
	var entry: Dictionary = _history[index]
	var bbcode := ""

	var night: int = entry.get("night", 0)
	var survived: bool = entry.get("survived", true)
	var failure_type: int = entry.get("failure_type", 0)

	bbcode += "[b]第 %d 夜[/b]\n" % night
	bbcode += "结果: %s\n\n" % ("存活 ✓" if survived else "[color=red]失败 ✗[/color]")

	if not survived:
		var fail_desc := ""
		match failure_type:
			0: fail_desc = "无"
			1: fail_desc = "[color=red]缺氧[/color]"
			2: fail_desc = "[color=red]电力过载[/color]"
			3: fail_desc = "[color=red]维修排队[/color]"
			4: fail_desc = "[color=red]声呐盲区[/color]"
		bbcode += "失败原因: %s\n\n" % fail_desc

	var event_ids: Array = entry.get("event_ids", [])
	bbcode += "[b]事件:[/b]\n"
	if event_ids.is_empty():
		bbcode += "  无\n"
	else:
		for eid: String in event_ids:
			bbcode += "  - %s\n" % eid

	var repairs: Array = entry.get("repairs_made", [])
	bbcode += "\n[b]维修:[/b]\n"
	if repairs.is_empty():
		bbcode += "  无\n"
	else:
		for rid: String in repairs:
			bbcode += "  - %s\n" % rid

	var choices: Dictionary = entry.get("allocation_choices", {})
	if not choices.is_empty():
		bbcode += "\n[b]分配选择:[/b]\n"
		for key: String in choices:
			bbcode += "  %s: %d\n" % [key, choices[key]]

	_detail.text = bbcode
