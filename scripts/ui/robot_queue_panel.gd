class_name RobotQueuePanel
extends VBoxContainer

signal assign_requested(target: StringName)
signal undo_requested

var _robot_queue: RobotQueue
var _robot_labels: Array[Label] = []
var _idle_count_label: Label
var _assign_buttons: Dictionary = {}
var _undo_button: Button
var _visible_resources: Array[StringName] = []

func setup(queue: RobotQueue, unlocked: Array[StringName]) -> void:
	_robot_queue = queue
	_visible_resources = unlocked
	_build_ui()
	queue.queue_changed.connect(_on_queue_changed)

func _build_ui() -> void:
	for child in get_children():
		child.queue_free()
	_robot_labels.clear()
	_assign_buttons.clear()
	var title = Label.new()
	title.text = "维修机器人"
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(0.8, 0.9, 1.0))
	add_child(title)
	_idle_count_label = Label.new()
	_idle_count_label.text = "空闲: 0 / 0"
	_idle_count_label.add_theme_font_size_override("font_size", 14)
	_idle_count_label.add_theme_color_override("font_color", Color.LIGHT_GRAY)
	add_child(_idle_count_label)
	var assign_label = Label.new()
	assign_label.text = "派遣机器人至:"
	assign_label.add_theme_font_size_override("font_size", 14)
	add_child(assign_label)
	for res in _visible_resources:
		var btn = Button.new()
		btn.text = ResourceManager.resource_display_name(res)
		btn.custom_minimum_size = Vector2(160, 36)
		btn.add_theme_color_override("font_color", ResourcePanel.BAR_COLORS.get(res, Color.WHITE))
		var res_copy = res
		btn.pressed.connect(func(): assign_requested.emit(res_copy))
		add_child(btn)
		_assign_buttons[res] = btn
	_undo_button = Button.new()
	_undo_button.text = "↩ 撤销上一步派遣"
	_undo_button.custom_minimum_size = Vector2(160, 36)
	_undo_button.add_theme_color_override("font_color", Color(1.0, 0.8, 0.3))
	_undo_button.disabled = true
	_undo_button.pressed.connect(func(): undo_requested.emit())
	add_child(_undo_button)
	var sep = HSeparator.new()
	add_child(sep)
	var robots_title = Label.new()
	robots_title.text = "机器人状态:"
	robots_title.add_theme_font_size_override("font_size", 14)
	add_child(robots_title)
	_on_queue_changed()

func _on_queue_changed() -> void:
	if not _robot_queue:
		return
	var robots = _robot_queue.get_all_robots()
	var idle = _robot_queue.get_idle_count()
	_idle_count_label.text = "空闲: %d / %d" % [idle, robots.size()]
	_undo_button.disabled = _robot_queue.get_busy_count() == 0
	for res in _assign_buttons:
		var btn: Button = _assign_buttons[res]
		btn.disabled = idle == 0
	for lbl in _robot_labels:
		lbl.queue_free()
	_robot_labels.clear()
	for r in robots:
		var lbl = Label.new()
		var status_text: String
		if r["status"] == "idle":
			status_text = "机器人 #%d: 待命" % r["id"]
			lbl.add_theme_color_override("font_color", Color(0.6, 0.8, 0.6))
		else:
			var target_name = ResourceManager.resource_display_name(r["target"])
			status_text = "机器人 #%d: 维修%s (%.1fs)" % [r["id"], target_name, r["time_remaining"]]
			lbl.add_theme_color_override("font_color", Color(0.8, 0.7, 0.4))
		lbl.text = status_text
		lbl.add_theme_font_size_override("font_size", 13)
		add_child(lbl)
		_robot_labels.append(lbl)
