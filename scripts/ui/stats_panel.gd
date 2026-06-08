class_name StatsPanel
extends Control

signal closed

var _stats_manager: StatsManager
var _detail: RichTextLabel

func setup(sm: StatsManager) -> void:
	_stats_manager = sm

func _ready() -> void:
	_build_ui()
	visible = false

func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)

	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.offset_left = -200
	panel.offset_top = -200
	panel.offset_right = 200
	panel.offset_bottom = 200
	add_child(panel)

	var vbox := VBoxContainer.new()
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "性能统计"
	title.add_theme_font_size_override("font_size", 20)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	_detail = RichTextLabel.new()
	_detail.bbcode_enabled = true
	_detail.custom_minimum_size = Vector2(350, 320)
	vbox.add_child(_detail)

	var close_btn := Button.new()
	close_btn.text = "关闭"
	close_btn.pressed.connect(func(): closed.emit())
	vbox.add_child(close_btn)

func show_panel() -> void:
	visible = true
	_refresh()

func hide_panel() -> void:
	visible = false

func _refresh() -> void:
	if _stats_manager == null:
		return
	var stats := _stats_manager.get_stats()
	var bbcode := ""
	bbcode += "[b]生存记录[/b]\n"
	bbcode += "存活夜数: %d\n" % stats.get("nights_survived", 0)
	bbcode += "总夜数: %d\n" % stats.get("total_nights", 0)
	bbcode += "最长存活: %d\n\n" % stats.get("longest_survival", 0)

	bbcode += "[b]事件与维修[/b]\n"
	bbcode += "解决事件: %d\n" % stats.get("events_resolved", 0)
	bbcode += "完成维修: %d\n" % stats.get("repairs_completed", 0)
	bbcode += "设备损坏: %d\n\n" % stats.get("equipment_broken", 0)

	bbcode += "[b]临界警告[/b]\n"
	bbcode += "氧气告警: %d 次\n" % stats.get("times_oxygen_critical", 0)
	bbcode += "电力告警: %d 次\n" % stats.get("times_power_critical", 0)
	bbcode += "声呐告警: %d 次\n\n" % stats.get("times_sonar_critical", 0)

	bbcode += "[b]死亡原因[/b]\n"
	bbcode += "缺氧: %d 次\n" % stats.get("deaths_by_oxygen", 0)
	bbcode += "电力过载: %d 次\n" % stats.get("deaths_by_power", 0)
	bbcode += "维修排队: %d 次\n" % stats.get("deaths_by_repair", 0)
	bbcode += "声呐盲区: %d 次\n" % stats.get("deaths_by_sonar", 0)

	var allocated: Dictionary = stats.get("resources_allocated", {})
	bbcode += "\n[b]资源分配总计[/b]\n"
	for key: String in allocated:
		var type_name := ResourceType.type_name(int(key))
		bbcode += "%s: %d\n" % [type_name, allocated[key]]

	_detail.text = bbcode
