class_name GameController
extends Control

enum Phase { SELECT_UNIT, SELECT_MOVE, SELECT_ACTION, ANIMATING, EVENT, WAITING }

var _phase: Phase = Phase.SELECT_UNIT
var _grid_map: GridMap = null
var _hud: HUD = null
var _pause_menu: PauseMenu = null
var _tutorial_ui: TutorialUI = null
var _level_complete: LevelComplete = null
var _level_failed: LevelFailed = null
var _turn_manager: TurnManager = null
var _action_points: ActionPoints = null
var _task_system: TaskSystem = null
var _event_system: EventSystem = null
var _satisfaction_system: SatisfactionSystem = null
var _feedback_system: FeedbackSystem = null
var _units: Array[Unit] = []
var _selected_unit: Unit = null
var _current_level_data: LevelData = null
var _reachable_cells: Array[Vector2i] = []
var _unit_layer: Control = null
var _cell_size: int = 64

func _ready() -> void:
	GameManager.change_state(GameManager.GameState.PLAYING)
	DataRecorder.start_session()
	_turn_manager = TurnManager.new()
	add_child(_turn_manager)
	_action_points = ActionPoints.new()
	add_child(_action_points)
	_task_system = TaskSystem.new()
	add_child(_task_system)
	_event_system = EventSystem.new()
	add_child(_event_system)
	_satisfaction_system = SatisfactionSystem.new()
	add_child(_satisfaction_system)
	_feedback_system = FeedbackSystem.new()
	add_child(_feedback_system)
	_setup_level()
	_connect_signals()
	_start_game()

func _setup_level() -> void:
	var level_idx: int = GameManager.current_level
	var level_data: LevelData = Database.get_level_by_index(level_idx)
	if level_data == null:
		SceneManager.change_scene("res://scenes/main_menu.tscn")
		return
	_current_level_data = level_data
	_cell_size = 64
	_grid_map = GridMap.new()
	_grid_map.position = Vector2(20, 90)
	_grid_map.setup(level_data.grid_width, level_data.grid_height, _cell_size)
	var obstacles: Array[Vector2i] = LevelManager.build_obstacles(level_data.id)
	_grid_map.set_obstacles(obstacles)
	add_child(_grid_map)
	var tasks: Array[TaskData] = LevelManager.build_level_tasks(level_data.id)
	_task_system.setup_tasks(tasks)
	for t in _task_system.get_tasks():
		_grid_map.set_task_position(t.grid_position, t.task_type)
	var events: Array[EventData] = LevelManager.build_level_events(level_data.id)
	_event_system.setup_events(events)
	_satisfaction_system.setup(level_data.initial_satisfaction, level_data.satisfaction_threshold)
	_unit_layer = Control.new()
	_unit_layer.position = _grid_map.position
	_unit_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_unit_layer)
	var start_positions: Dictionary = LevelManager.get_start_positions(level_data.id, level_data.character_ids)
	for char_id in level_data.character_ids:
		var char_data: CharacterData = Database.get_character(char_id)
		if char_data == null:
			continue
		var unit: Unit = Unit.new()
		var start_pos: Vector2i = start_positions.get(char_id, Vector2i.ZERO)
		unit.setup(char_data, start_pos)
		unit.update_display_position(_cell_size)
		unit.unit_selected.connect(_on_unit_selected)
		unit.unit_moved.connect(_on_unit_moved)
		unit.unit_action_completed.connect(_on_unit_action_completed)
		_unit_layer.add_child(unit)
		_units.append(unit)
	_hud = HUD.new()
	add_child(_hud)
	_feedback_system.setup(_hud.get_satisfaction_bar())
	_hud.get_end_turn_button().pressed.connect(_on_end_turn)
	_hud.get_skill_button().pressed.connect(_on_use_skill)
	_pause_menu = PauseMenu.new()
	add_child(_pause_menu)
	_level_complete = LevelComplete.new()
	_level_complete.visible = false
	add_child(_level_complete)
	_level_failed = LevelFailed.new()
	_level_failed.visible = false
	add_child(_level_failed)
	if level_data.is_tutorial:
		_tutorial_ui = TutorialUI.new()
		add_child(_tutorial_ui)
		_tutorial_ui.setup_tutorial(level_data.tutorial_steps)
		_tutorial_ui.tutorial_finished.connect(_on_tutorial_finished)

func _connect_signals() -> void:
	_grid_map.cell_selected.connect(_on_cell_selected)
	_turn_manager.turn_started.connect(_on_turn_started)
	_turn_manager.all_turns_ended.connect(_on_all_turns_ended)
	_action_points.ap_changed.connect(_on_ap_changed)
	_action_points.ap_depleted.connect(_on_ap_depleted)
	_task_system.task_completed.connect(_on_task_completed)
	_task_system.task_failed.connect(_on_task_failed)
	_task_system.all_tasks_completed.connect(_on_all_tasks_completed)
	_event_system.event_triggered.connect(_on_event_triggered)
	_satisfaction_system.satisfaction_changed.connect(_on_satisfaction_changed)
	_satisfaction_system.satisfaction_critical.connect(_on_satisfaction_critical)
	_satisfaction_system.satisfaction_failed.connect(_on_satisfaction_failed)

func _start_game() -> void:
	_turn_manager.start_new_game(_current_level_data.turn_limit)
	_update_hud()

func _on_turn_started(turn: int) -> void:
	_event_system.check_events(EventData.TriggerCondition.TURN_START, turn, _satisfaction_system.get_satisfaction())
	if _event_system.has_pending_events():
		_phase = Phase.EVENT
		_event_system.fire_pending_events()
	for u in _units:
		u.reset_ap()
	_task_system.tick_tasks()
	_check_game_over()
	_update_hud()
	SFXGenerator.play_click()

func _on_cell_selected(pos: Vector2i) -> void:
	if _phase == Phase.SELECT_UNIT:
		var unit: Unit = _get_unit_at(pos)
		if unit != null:
			_select_unit(unit)
	elif _phase == Phase.SELECT_MOVE:
		if _reachable_cells.has(pos):
			_move_unit(_selected_unit, pos)
		else:
			var unit: Unit = _get_unit_at(pos)
			if unit != null and unit != _selected_unit:
				_select_unit(unit)
			else:
				_deselect_unit()
	elif _phase == Phase.SELECT_ACTION:
		var task: TaskData = _task_system.get_task_at_position(pos)
		if task != null and _is_adjacent(_selected_unit.grid_position, pos):
			_execute_task(_selected_unit, task)

func _on_unit_selected(unit: Unit) -> void:
	if _phase == Phase.SELECT_UNIT or _phase == Phase.SELECT_MOVE:
		_select_unit(unit)

func _select_unit(unit: Unit) -> void:
	if _selected_unit != null:
		_selected_unit.current_ap = _action_points.get_current()
		_selected_unit.set_selected(false)
	_selected_unit = unit
	unit.set_selected(true)
	_phase = Phase.SELECT_MOVE
	_reachable_cells = _grid_map.get_reachable_positions(unit.grid_position, unit.data.movement_range)
	_grid_map.highlight_cells(_reachable_cells)
	_hud.show_unit_info(unit)
	_action_points.sync_to(unit.max_ap, unit.current_ap)
	_update_hud()
	SFXGenerator.play_click()

func _deselect_unit() -> void:
	if _selected_unit != null:
		_selected_unit.set_selected(false)
	_selected_unit = null
	_phase = Phase.SELECT_UNIT
	_grid_map.clear_highlights()
	_hud.hide_unit_info()
	_action_points.reset(0)

func _move_unit(unit: Unit, target: Vector2i) -> void:
	_phase = Phase.ANIMATING
	_grid_map.clear_highlights()
	if unit.move_to(target, _action_points):
		unit.update_display_position(_cell_size)
		_hud.show_feedback("移动成功", Color.CYAN)
		SFXGenerator.play_move()
		_feedback_system.flash_screen(Color.CYAN, 0.2)
		DataRecorder.log_event("unit_moved", {"unit": unit.data.id, "to": str(target)})
		var task: TaskData = _task_system.get_task_at_position(target)
		if task != null:
			_phase = Phase.SELECT_ACTION
			_hud.show_feedback("到达任务点！可执行任务", Color.GREEN)
		else:
			_phase = Phase.SELECT_MOVE
			_reachable_cells = _grid_map.get_reachable_positions(unit.grid_position, unit.data.movement_range)
			_grid_map.highlight_cells(_reachable_cells)
	else:
		_hud.show_feedback("行动点不足", Color.RED)
		SFXGenerator.play_click()
		_phase = Phase.SELECT_MOVE
		_reachable_cells = _grid_map.get_reachable_positions(unit.grid_position, unit.data.movement_range)
		_grid_map.highlight_cells(_reachable_cells)
	_update_hud()

func _execute_task(unit: Unit, task: TaskData) -> void:
	var power: int = unit.perform_action(task.task_type, _action_points)
	if power > 0:
		_task_system.apply_power_to_task(task, power, task.task_type)
		_hud.show_feedback("%s执行任务！力量%d" % [unit.data.display_name, power], Color.GREEN)
		_feedback_system.flash_screen(Color.GREEN, 0.3)
		DataRecorder.log_event("task_executed", {"unit": unit.data.id, "task": task.id, "power": power})
	else:
		_hud.show_feedback("行动点不足或无法执行", Color.RED)
	_phase = Phase.SELECT_MOVE
	if _selected_unit != null:
		_reachable_cells = _grid_map.get_reachable_positions(_selected_unit.grid_position, _selected_unit.data.movement_range)
		_grid_map.highlight_cells(_reachable_cells)
	_update_hud()

func _on_use_skill() -> void:
	if _selected_unit == null:
		return
	if _selected_unit.is_skill_active():
		_hud.show_feedback("本回合已使用过技能", Color.ORANGE)
		return
	var skill_id: String = _selected_unit.activate_skill()
	if skill_id == "":
		_hud.show_feedback("该角色没有技能", Color.RED)
		return
	var skill_name: String = "技能"
	match skill_id:
		"exhibition_boost":
			skill_name = "布展强化"
		"publicity_boost":
			skill_name = "宣传强化"
		"reception_boost":
			skill_name = "接待强化"
	_hud.show_feedback("%s使用了%s！下次行动力量+2" % [_selected_unit.data.display_name, skill_name], Color.YELLOW)
	SFXGenerator.play_event()
	_feedback_system.flash_screen(Color.YELLOW, 0.25)
	DataRecorder.log_event("skill_used", {"unit": _selected_unit.data.id, "skill": skill_id})
	_update_hud()

func _on_end_turn() -> void:
	_deselect_unit()
	_event_system.check_events(EventData.TriggerCondition.TURN_END, _turn_manager.current_turn, _satisfaction_system.get_satisfaction())
	if _event_system.has_pending_events():
		_event_system.fire_pending_events()
	_turn_manager.end_current_turn()

func _on_unit_moved(unit: Unit, from: Vector2i, to: Vector2i) -> void:
	pass

func _on_unit_action_completed(unit: Unit) -> void:
	pass

func _on_ap_changed(current: int, maximum: int) -> void:
	_hud.update_ap(current, maximum)

func _on_ap_depleted() -> void:
	_hud.show_feedback("行动点耗尽！", Color.ORANGE)

func _on_task_completed(task: TaskData) -> void:
	_satisfaction_system.modify_satisfaction(task.satisfaction_reward)
	_hud.show_feedback("任务完成: %s！满意度+%d" % [task.display_name, int(task.satisfaction_reward)], Color.GREEN)
	SFXGenerator.play_task_complete()
	_feedback_system.shake_satisfaction_bar()
	_feedback_system.flash_screen(Color.GREEN, 0.4)
	_event_system.check_events(EventData.TriggerCondition.TASK_COMPLETE, _turn_manager.current_turn, _satisfaction_system.get_satisfaction())
	_update_hud()

func _on_task_failed(task: TaskData) -> void:
	_satisfaction_system.modify_satisfaction(-task.satisfaction_penalty)
	_hud.show_feedback("任务失败: %s！满意度-%d" % [task.display_name, int(task.satisfaction_penalty)], Color.RED)
	SFXGenerator.play_task_fail()
	_feedback_system.shake_satisfaction_bar()
	_feedback_system.flash_screen(Color.RED, 0.4)
	_update_hud()

func _on_all_tasks_completed() -> void:
	_hud.show_feedback("所有任务完成！", Color.GOLD)
	_win_level()

func _on_event_triggered(event: EventData) -> void:
	_satisfaction_system.modify_satisfaction(event.satisfaction_modifier)
	_hud.show_feedback("事件: %s (满意度%+.0f)" % [event.display_name, event.satisfaction_modifier], Color.YELLOW)
	SFXGenerator.play_event()
	_feedback_system.flash_screen(Color.YELLOW, 0.3)
	_phase = Phase.SELECT_UNIT

func _on_satisfaction_changed(value: float) -> void:
	_update_hud()

func _on_satisfaction_critical(value: float) -> void:
	_hud.show_feedback("警告：满意度过低！", Color.RED)
	_feedback_system.shake_satisfaction_bar()

func _on_satisfaction_failed() -> void:
	_lose_level("满意度降至零！")

func _on_all_turns_ended() -> void:
	if _satisfaction_system.check_final_result():
		_win_level()
	else:
		_lose_level("活动满意度不足")

func _check_game_over() -> void:
	if _satisfaction_system.get_satisfaction() <= 0:
		_lose_level("满意度降至零")

func _save_playtest_data() -> void:
	DataRecorder.end_session()
	var dir: String = "user://playtest/"
	DirAccess.make_dir_recursive_absolute(dir)
	var timestamp: String = Time.get_datetime_string_from_system().replace(":", "-")
	var path: String = "%slevel_%d_%s.json" % [dir, GameManager.current_level, timestamp]
	DataRecorder.save_to_file(path)

func _win_level() -> void:
	_phase = Phase.WAITING
	GameManager.change_state(GameManager.GameState.LEVEL_COMPLETE)
	var sat: float = _satisfaction_system.get_satisfaction()
	var score: int = int(sat * 10) + _task_system.get_completed_count() * 50
	_level_complete.show_results(
		sat,
		_current_level_data.satisfaction_threshold,
		_task_system.get_completed_count(),
		_task_system.get_total_count(),
		score
	)
	_level_complete.visible = true
	DataRecorder.log_event("level_complete", {"score": score, "satisfaction": sat})
	_save_playtest_data()

func _lose_level(reason: String) -> void:
	_phase = Phase.WAITING
	GameManager.change_state(GameManager.GameState.LEVEL_FAILED)
	var sat: float = _satisfaction_system.get_satisfaction()
	_level_failed.show_results(sat, _current_level_data.satisfaction_threshold, reason)
	_level_failed.visible = true
	DataRecorder.log_event("level_failed", {"reason": reason, "satisfaction": sat})
	_save_playtest_data()

func _on_tutorial_finished() -> void:
	DataRecorder.log_event("tutorial_finished", {})

func _get_unit_at(pos: Vector2i) -> Unit:
	for u in _units:
		if u.grid_position == pos:
			return u
	return null

func _is_adjacent(a: Vector2i, b: Vector2i) -> bool:
	var diff: Vector2i = a - b
	return absi(diff.x) + absi(diff.y) <= 1

func _update_hud() -> void:
	if _hud == null:
		return
	_hud.update_turn(_turn_manager.current_turn, _turn_manager.get_remaining_turns())
	_hud.update_ap(_action_points.get_current(), _action_points.get_max())
	_hud.update_satisfaction(_satisfaction_system.get_satisfaction(), _current_level_data.satisfaction_threshold)
	_hud.update_tasks(_task_system.get_tasks())
