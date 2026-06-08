class_name NightSettlementPanel
extends Control

signal continue_pressed
signal repair_select_pressed

var _result: NightResult = null
var _continue_button: Button
var _repair_button: Button
var _info_label: RichTextLabel

func setup() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_ui()

func _build_ui() -> void:
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.offset_left = -250
	panel.offset_top = -200
	panel.offset_right = 250
	panel.offset_bottom = 200
	add_child(panel)

	var vbox := VBoxContainer.new()
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "夜晚结算"
	title.add_theme_font_size_override("font_size", 22)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	_info_label = RichTextLabel.new()
	_info_label.custom_minimum_size = Vector2(450, 280)
	_info_label.bbcode_enabled = true
	_info_label.fit_content = true
	vbox.add_child(_info_label)

	var hbox := HBoxContainer.new()
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(hbox)

	_repair_button = Button.new()
	_repair_button.text = "维修选择"
	_repair_button.pressed.connect(func(): repair_select_pressed.emit())
	hbox.add_child(_repair_button)

	_continue_button = Button.new()
	_continue_button.text = "继续下一夜"
	_continue_button.pressed.connect(func(): continue_pressed.emit())
	hbox.add_child(_continue_button)

	visible = false

func show_result(result: NightResult) -> void:
	_result = result
	visible = true

	var bbcode := ""
	bbcode += "[b]第 %d 夜结算[/b]\n\n" % result.night_number

	if not result.survived:
		bbcode += "[color=red][b]失败！%s[/b][/color]\n\n" % result.get_failure_description()

	bbcode += "[b]当晚事件：[/b]\n"
	if result.events.is_empty():
		bbcode += "  平安无事\n"
	else:
		for evt: NightEvent in result.events:
			var severity_text := _severity_text(evt.severity)
			bbcode += "  %s [%s] - %s\n" % [evt.display_name, severity_text, evt.description]

	bbcode += "\n[b]维修完成：[/b]\n"
	if result.repairs_made.is_empty():
		bbcode += "  无\n"
	else:
		for rid: String in result.repairs_made:
			bbcode += "  %s 已修复\n" % rid

	bbcode += "\n[b]分配效果：[/b]\n"
	var choices: Dictionary = result.allocation_choices
	for key: Variant in choices:
		var type_name := ResourceType.type_name(int(key))
		var alloc_val: int = choices[key]
		bbcode += "  %s: 投入 %d 点" % [type_name, alloc_val]
		if int(key) == ResourceType.Type.REPAIR:
			bbcode += " (%d人修复)" % alloc_val
		else:
			bbcode += " (减损 -%d)" % (alloc_val * 2)
		bbcode += "\n"

	bbcode += "\n[b]资源变化：[/b]\n"
	for key: String in result.resources_before:
		var before: int = result.resources_before[key]
		var after: int = result.resources_after[key] if result.resources_after.has(key) else before
		var diff := after - before
		var diff_text := "+%d" % diff if diff >= 0 else str(diff)
		var color := "green" if diff >= 0 else "red"
		bbcode += "  %s: %d → %d ([color=%s]%s[/color])\n" % [key, before, after, color, diff_text]

	_info_label.text = bbcode
	_continue_button.text = "继续下一夜" if result.survived else "返回主菜单"
	_repair_button.visible = result.survived

func _severity_text(severity: NightEvent.Severity) -> String:
	match severity:
		NightEvent.Severity.LOW: return "低"
		NightEvent.Severity.MEDIUM: return "中"
		NightEvent.Severity.HIGH: return "高"
		NightEvent.Severity.CRITICAL: return "危"
		_: return "?"

func hide_panel() -> void:
	visible = false
