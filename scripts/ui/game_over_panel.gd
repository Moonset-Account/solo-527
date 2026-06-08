class_name GameOverPanel
extends Control

signal retry_pressed
signal menu_pressed

var _failure_label: Label
var _detail_label: RichTextLabel
var _retry_button: Button
var _menu_button: Button

func _ready() -> void:
	_build_ui()
	visible = false

func _build_ui() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP

	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.offset_left = -250
	panel.offset_top = -150
	panel.offset_right = 250
	panel.offset_bottom = 150
	panel.modulate = Color(0.2, 0.1, 0.1, 0.95)
	add_child(panel)

	var vbox := VBoxContainer.new()
	panel.add_child(vbox)

	_failure_label = Label.new()
	_failure_label.text = "灯塔失守"
	_failure_label.add_theme_font_size_override("font_size", 26)
	_failure_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_failure_label.modulate = Color.RED
	vbox.add_child(_failure_label)

	_detail_label = RichTextLabel.new()
	_detail_label.bbcode_enabled = true
	_detail_label.fit_content = true
	_detail_label.custom_minimum_size = Vector2(400, 120)
	vbox.add_child(_detail_label)

	var hbox := HBoxContainer.new()
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(hbox)

	_retry_button = Button.new()
	_retry_button.text = "重新挑战"
	_retry_button.pressed.connect(func(): retry_pressed.emit())
	hbox.add_child(_retry_button)

	_menu_button = Button.new()
	_menu_button.text = "返回主菜单"
	_menu_button.pressed.connect(func(): menu_pressed.emit())
	hbox.add_child(_menu_button)

func show_game_over(failure_type: NightResult.FailureType, night: int) -> void:
	visible = true
	var desc := ""
	match failure_type:
		NightResult.FailureType.OXYGEN_DEPLETED:
			desc = "缺氧 - 氧气供应完全耗尽，船员无法呼吸"
			_failure_label.text = "氧气耗尽"
		NightResult.FailureType.POWER_OVERLOAD:
			desc = "电力过载 - 发电机系统崩溃，全塔停电"
			_failure_label.text = "电力过载"
		NightResult.FailureType.REPAIR_QUEUE_FULL:
			desc = "维修排队 - 太多设备损坏，维修人员无法及时处理"
			_failure_label.text = "维修瘫痪"
		NightResult.FailureType.SONAR_BLACKOUT:
			desc = "声呐盲区 - 声呐系统完全失效，无法探测危险"
			_failure_label.text = "声呐盲区"
		_:
			desc = "未知原因"
			_failure_label.text = "灯塔失守"

	_detail_label.text = "[b]第 %d 夜[/b]\n\n%s\n\n在深海的压力下，灯塔终于支撑不住……" % [night, desc]
