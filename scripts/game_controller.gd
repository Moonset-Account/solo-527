class_name GameController
extends Node

enum GameState {
	MENU,
	PLAYING,
	PAUSED,
	FAILURE,
	LEVEL_COMPLETE,
}

var _state: GameState = GameState.MENU
var _resource_manager: ResourceManager
var _robot_queue: RobotQueue
var _event_scheduler: EventScheduler
var _current_level: LevelConfig
var _level_time: float = 0.0
var _repair_duration: float = 8.0
var _repair_amount: float = 25.0

var _resource_panel: ResourcePanel
var _robot_panel: RobotQueuePanel
var _event_log: EventLog
var _tutorial: TutorialOverlay
var _failure_screen: FailureScreen
var _timer_label: Label
var _level_label: Label
var _pause_button: Button
var _save_button: Button
var _menu_container: Control
var _game_ui: Control

signal level_completed(level_id: int)
signal back_to_menu

func _ready() -> void:
	_resource_manager = ResourceManager.new()
	add_child(_resource_manager)
	_robot_queue = RobotQueue.new()
	add_child(_robot_queue)
	_event_scheduler = EventScheduler.new()
	add_child(_event_scheduler)
	_build_ui()
	_show_menu()

func _process(delta: float) -> void:
	if _state == GameState.PLAYING:
		_process_game(delta)

func _process_game(delta: float) -> void:
	var speed_mult = 1.0
	if _resource_manager.get_value(ResourceManager.SOLAR) < 20.0 and _current_level.unlocked_resources.has(ResourceManager.SOLAR):
		speed_mult = 0.5
	_resource_manager.apply_decay(delta)
	var completed = _robot_queue.process(delta * speed_mult)
	for task in completed:
		_on_repair_completed(task)
	_event_scheduler.process_events(delta)
	_level_time += delta
	_update_timer_display()
	if _timer_label:
		var remaining = _current_level.duration - _level_time
		if remaining <= 0.0:
			_on_level_time_up()
		elif remaining <= 10.0:
			_timer_label.add_theme_color_override("font_color", Color.RED)
	for r in [ResourceManager.OXYGEN, ResourceManager.WATER]:
		if _current_level.unlocked_resources.has(r) and _resource_manager.is_depleted(r):
			_on_critical_depleted(r)
			return
	if _current_level.unlocked_resources.has(ResourceManager.SOLAR) and _resource_manager.is_depleted(ResourceManager.SOLAR):
		_resource_manager.set_decay_rate(ResourceManager.PLANT_HEALTH, 2.0)

func _build_ui() -> void:
	var base_layer = Control.new()
	base_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(base_layer)

	_game_ui = Control.new()
	_game_ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	base_layer.add_child(_game_ui)

	var root_vbox = VBoxContainer.new()
	root_vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	root_vbox.add_theme_constant_override("separation", 4)

	var top_bar = HBoxContainer.new()
	top_bar.custom_minimum_size.y = 40
	top_bar.add_theme_constant_override("separation", 16)
	_level_label = Label.new()
	_level_label.add_theme_font_size_override("font_size", 18)
	_level_label.add_theme_color_override("font_color", Color(0.8, 0.9, 1.0))
	top_bar.add_child(_level_label)
	_timer_label = Label.new()
	_timer_label.add_theme_font_size_override("font_size", 18)
	_timer_label.add_theme_color_override("font_color", Color(0.9, 0.9, 0.9))
	top_bar.add_child(_timer_label)
	_pause_button = Button.new()
	_pause_button.text = "暂停"
	_pause_button.visible = false
	_pause_button.pressed.connect(_on_pause)
	top_bar.add_child(_pause_button)
	_save_button = Button.new()
	_save_button.text = "存档"
	_save_button.visible = false
	_save_button.pressed.connect(_on_save)
	top_bar.add_child(_save_button)
	top_bar.add_child(Control.new())
	root_vbox.add_child(top_bar)

	_resource_panel = ResourcePanel.new()
	_resource_panel.custom_minimum_size.y = 90
	root_vbox.add_child(_resource_panel)

	var main_area = HBoxContainer.new()
	main_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
	main_area.add_theme_constant_override("separation", 12)

	var left_panel = VBoxContainer.new()
	left_panel.custom_minimum_size.x = 200
	left_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_robot_panel = RobotQueuePanel.new()
	left_panel.add_child(_robot_panel)
	main_area.add_child(left_panel)

	var center = VBoxContainer.new()
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var greenhouse_bg = PanelContainer.new()
	greenhouse_bg.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var bg_style = StyleBoxFlat.new()
	bg_style.bg_color = Color(0.05, 0.08, 0.12)
	bg_style.set_corner_radius_all(8)
	bg_style.border_color = Color(0.15, 0.25, 0.35)
	bg_style.set_border_width_all(2)
	greenhouse_bg.add_theme_stylebox_override("panel", bg_style)
	var gh_label = Label.new()
	gh_label.text = "🌙 月面温室 - 设施监控"
	gh_label.add_theme_font_size_override("font_size", 20)
	gh_label.add_theme_color_override("font_color", Color(0.5, 0.7, 0.9))
	gh_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	gh_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	greenhouse_bg.add_child(gh_label)
	center.add_child(greenhouse_bg)
	main_area.add_child(center)

	var right_panel = VBoxContainer.new()
	right_panel.custom_minimum_size.x = 280
	right_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var log_title = Label.new()
	log_title.text = "事件日志"
	log_title.add_theme_font_size_override("font_size", 16)
	log_title.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9))
	right_panel.add_child(log_title)
	_event_log = EventLog.new()
	_event_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right_panel.add_child(_event_log)
	main_area.add_child(right_panel)
	root_vbox.add_child(main_area)

	_game_ui.add_child(root_vbox)

	_tutorial = TutorialOverlay.new()
	_tutorial.set_anchors_preset(Control.PRESET_FULL_RECT)
	base_layer.add_child(_tutorial)

	_failure_screen = FailureScreen.new()
	_failure_screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	base_layer.add_child(_failure_screen)

	_menu_container = Control.new()
	_menu_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	base_layer.add_child(_menu_container)

	_robot_panel.assign_requested.connect(_on_assign_robot)
	_robot_panel.undo_requested.connect(_on_undo)
	_event_scheduler.event_triggered.connect(_on_event_triggered)
	_event_scheduler.event_logged.connect(_on_event_logged)
	_failure_screen.retry_requested.connect(_on_retry)
	_failure_screen.back_to_menu_requested.connect(_on_back_to_menu)
	_tutorial.tutorial_completed.connect(_on_tutorial_done)
	_resource_manager.all_critical_failed.connect(_on_all_critical_depleted)

func _show_menu() -> void:
	_state = GameState.MENU
	_menu_container.visible = true
	_game_ui.visible = false
	_pause_button.visible = false
	_save_button.visible = false
	for child in _menu_container.get_children():
		child.queue_free()
	var bg = ColorRect.new()
	bg.color = Color(0.02, 0.04, 0.08)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	_menu_container.add_child(bg)
	var center_box = CenterContainer.new()
	center_box.set_anchors_preset(Control.PRESET_FULL_RECT)
	_menu_container.add_child(center_box)
	var menu_box = VBoxContainer.new()
	menu_box.add_theme_constant_override("separation", 16)
	menu_box.custom_minimum_size = Vector2(420, 500)
	center_box.add_child(menu_box)
	var title = Label.new()
	title.text = "🌙 月面温室维修"
	title.add_theme_font_size_override("font_size", 36)
	title.add_theme_color_override("font_color", Color(0.7, 0.85, 1.0))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	menu_box.add_child(title)
	var subtitle = Label.new()
	subtitle.text = "在月球上维护温室，分配机器人修复事故，让温室活下去。"
	subtitle.add_theme_font_size_override("font_size", 16)
	subtitle.add_theme_color_override("font_color", Color(0.7, 0.75, 0.8))
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	menu_box.add_child(subtitle)
	var spacer = Control.new()
	spacer.custom_minimum_size.y = 20
	menu_box.add_child(spacer)
	var levels = LevelRegistry.get_all_levels()
	var progress = SaveManager.get_level_progress()
	for l in levels:
		var lid = l["level_id"]
		var lname = l["level_name"]
		var ldesc = l["description"]
		var btn = Button.new()
		var completed = progress.get(str(lid), {}).get("completed", false)
		var prefix = "✓ " if completed else ""
		btn.text = "%s第%d关: %s" % [prefix, lid, lname]
		btn.custom_minimum_size = Vector2(320, 48)
		btn.add_theme_font_size_override("font_size", 17)
		if completed:
			btn.add_theme_color_override("font_color", Color(0.5, 1.0, 0.5))
		btn.tooltip_text = ldesc
		var level_id_copy = lid
		btn.pressed.connect(func(): _start_level(level_id_copy))
		menu_box.add_child(btn)
	if SaveManager.has_save():
		var continue_btn = Button.new()
		continue_btn.text = "继续存档"
		continue_btn.custom_minimum_size = Vector2(320, 48)
		continue_btn.add_theme_font_size_override("font_size", 17)
		continue_btn.add_theme_color_override("font_color", Color(0.6, 0.8, 1.0))
		continue_btn.pressed.connect(_on_continue_save)
		menu_box.add_child(continue_btn)

func _start_level(level_id: int) -> void:
	_current_level = LevelRegistry.get_level(level_id)
	if _current_level == null:
		return
	_resource_manager.setup(_current_level.resources)
	_robot_queue.setup(_current_level.robot_count)
	_event_scheduler.setup(_current_level.events, _current_level.event_interval)
	_resource_panel.setup(_resource_manager, _current_level.unlocked_resources)
	_robot_panel.setup(_robot_queue, _current_level.unlocked_resources)
	_event_log.clear_log()
	_failure_screen.hide_failure()
	_level_time = 0.0
	_level_label.text = "第%d关: %s" % [_current_level.level_id, _current_level.level_name]
	_update_timer_display()
	_menu_container.visible = false
	_game_ui.visible = true
	_pause_button.visible = true
	_save_button.visible = true
	_state = GameState.PLAYING
	_tutorial.setup(_current_level.tutorial_steps)
	_tutorial.trigger("start")
	_event_log.add_entry("第%d关开始: %s" % [_current_level.level_id, _current_level.level_name], Color(0.5, 0.8, 1.0))
	_event_log.add_entry("目标: 在%d秒内维持所有资源在安全线以上" % int(_current_level.duration), Color(0.7, 0.7, 0.8))

func _update_timer_display() -> void:
	if _timer_label and _current_level:
		var remaining = maxf(0.0, _current_level.duration - _level_time)
		_timer_label.text = "剩余: %.0f秒" % remaining

func _on_assign_robot(target: StringName) -> void:
	if _state != GameState.PLAYING:
		return
	var duration = _repair_duration
	if _resource_manager.get_value(ResourceManager.SOLAR) < 20.0 and _current_level.unlocked_resources.has(ResourceManager.SOLAR):
		duration *= 1.5
	if _robot_queue.assign_robot(target, &"repair", duration):
		_event_log.add_entry("派遣机器人维修%s" % ResourceManager.resource_display_name(target), Color(0.6, 0.8, 1.0))
		if not _tutorial.is_finished():
			_tutorial.trigger("robot_assigned")

func _on_undo() -> void:
	if _state != GameState.PLAYING:
		return
	if _robot_queue.undo_last_assignment():
		_event_log.add_entry("撤销了上一步派遣", Color(1.0, 0.8, 0.4))

func _on_repair_completed(task: Dictionary) -> void:
	var target: StringName = task["target"]
	_resource_manager.modify(target, _repair_amount)
	_event_log.add_repair(target)
	if not _tutorial.is_finished():
		_tutorial.trigger("repair_done")

func _on_event_triggered(event: GameEvent) -> void:
	_resource_manager.modify(event.target_resource, -event.damage)
	_event_log.add_event(event.event_name, event.description)
	var new_decay = _resource_manager.get_decay_rate(event.target_resource) + event.damage * 0.05
	_resource_manager.set_decay_rate(event.target_resource, new_decay)
	_resource_panel.update_decay_display()

func _on_event_logged(event_id: String, message: String) -> void:
	pass

func _on_critical_depleted(resource: StringName) -> void:
	if _state != GameState.PLAYING:
		return
	_state = GameState.FAILURE
	_event_scheduler.set_active(false)
	var reason = FailureReason.analyze(_resource_manager, _event_scheduler, _robot_queue, _current_level)
	_failure_screen.show_failure(reason)

func _on_all_critical_depleted() -> void:
	if _state != GameState.PLAYING:
		return
	_state = GameState.FAILURE
	_event_scheduler.set_active(false)
	var reason = FailureReason.analyze(_resource_manager, _event_scheduler, _robot_queue, _current_level)
	_failure_screen.show_failure(reason)

func _on_level_time_up() -> void:
	if _state != GameState.PLAYING:
		return
	var all_safe = true
	for res in _current_level.unlocked_resources:
		if _resource_manager.get_ratio(res) < 0.15:
			all_safe = false
			break
	if all_safe:
		_on_level_complete()
	else:
		_on_critical_depleted(ResourceManager.WATER)

func _on_level_complete() -> void:
	_state = GameState.LEVEL_COMPLETE
	_event_scheduler.set_active(false)
	SaveManager.save_level_progress(_current_level.level_id, true)
	_event_log.add_entry("🎉 关卡完成！所有资源维持在了安全水平！", Color(0.3, 1.0, 0.5))
	_show_level_complete_ui()

func _show_level_complete_ui() -> void:
	var overlay = ColorRect.new()
	overlay.color = Color(0, 0.1, 0.05, 0.9)
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(overlay)
	var center = CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	vbox.custom_minimum_size = Vector2(400, 350)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)
	var title = Label.new()
	title.text = "🎉 任务成功！"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)
	var stats = Label.new()
	var lines: Array[String] = []
	for res in _current_level.unlocked_resources:
		lines.append("%s: %d%%" % [ResourceManager.resource_display_name(res), int(_resource_manager.get_ratio(res) * 100)])
	stats.text = "\n".join(lines)
	stats.add_theme_font_size_override("font_size", 18)
	stats.add_theme_color_override("font_color", Color(0.8, 0.9, 1.0))
	stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(stats)
	var spacer = Control.new()
	spacer.custom_minimum_size.y = 20
	vbox.add_child(spacer)
	var next_btn = Button.new()
	next_btn.text = "下一关"
	next_btn.custom_minimum_size = Vector2(160, 48)
	next_btn.add_theme_font_size_override("font_size", 18)
	var next_id = _current_level.level_id + 1
	next_btn.pressed.connect(func():
		for c in [overlay, center]:
			c.queue_free()
		_start_level(next_id)
	)
	vbox.add_child(next_btn)
	var menu_btn = Button.new()
	menu_btn.text = "返回菜单"
	menu_btn.custom_minimum_size = Vector2(160, 48)
	menu_btn.add_theme_font_size_override("font_size", 18)
	menu_btn.pressed.connect(func():
		for c in [overlay, center]:
			c.queue_free()
		_show_menu()
	)
	vbox.add_child(menu_btn)

func _on_pause() -> void:
	if _state == GameState.PLAYING:
		_state = GameState.PAUSED
		_pause_button.text = "继续"
		_event_scheduler.set_active(false)
	elif _state == GameState.PAUSED:
		_state = GameState.PLAYING
		_pause_button.text = "暂停"
		_event_scheduler.set_active(true)

func _on_save() -> void:
	var state = {
		"level_id": _current_level.level_id,
		"level_time": _level_time,
		"resources": _resource_manager.serialize(),
		"robots": _robot_queue.serialize(),
		"events": _event_scheduler.serialize(),
	}
	SaveManager.save_game_state(state)
	_event_log.add_entry("存档成功！", Color(0.5, 1.0, 0.5))

func _on_continue_save() -> void:
	var state = SaveManager.load_game_state()
	if state.is_empty():
		return
	var level_id = state.get("level_id", 1)
	_start_level(level_id)
	_level_time = state.get("level_time", 0.0)
	if state.has("resources"):
		_resource_manager.deserialize(state["resources"])
	if state.has("robots"):
		_robot_queue.deserialize(state["robots"])
	if state.has("events"):
		_event_scheduler.deserialize(state["events"])
	_event_log.add_entry("读档成功！", Color(0.5, 1.0, 0.5))

func _on_retry() -> void:
	_failure_screen.hide_failure()
	_start_level(_current_level.level_id)

func _on_back_to_menu() -> void:
	_failure_screen.hide_failure()
	_show_menu()

func _on_tutorial_done() -> void:
	pass
