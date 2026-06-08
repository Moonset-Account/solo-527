class_name GameController
extends Node

enum GameState { MENU, NIGHT_PREP, NIGHT_ACTIVE, NIGHT_RESULT, GAME_OVER, REPAIR_SELECT, REPLAY_VIEW }

signal state_changed(old_state: GameState, new_state: GameState)
signal night_started(night: int)
signal night_ended(result: NightResult)
signal game_over(failure_type: NightResult.FailureType)

var _state: GameState = GameState.MENU
var _current_night: int = 0
var _night_history: Array[Dictionary] = []
var _last_result: NightResult = null

var resource_manager: ResourceManager
var event_scheduler: EventScheduler
var equipment_system: EquipmentWearSystem
var repair_queue: RepairQueue
var night_resolver: NightResolver
var save_manager: SaveManager
var audio_manager: AudioManager
var stats_manager: StatsManager
var tutorial_manager: TutorialManager

func initialize() -> void:
	night_resolver.setup(resource_manager, equipment_system, repair_queue, event_scheduler)
	_connect_signals()

func _connect_signals() -> void:
	resource_manager.resource_critical.connect(_on_resource_critical)
	resource_manager.resource_depleted.connect(_on_resource_depleted)
	equipment_system.equipment_broken.connect(_on_equipment_broken)
	equipment_system.equipment_critical.connect(_on_equipment_critical)
	repair_queue.repair_completed.connect(_on_repair_completed)
	tutorial_manager.tutorial_step_shown.connect(_on_tutorial_step)

func get_state() -> GameState:
	return _state

func get_current_night() -> int:
	return _current_night

func get_last_result() -> NightResult:
	return _last_result

func get_night_history() -> Array[Dictionary]:
	return _night_history

func change_state(new_state: GameState) -> void:
	var old := _state
	_state = new_state
	state_changed.emit(old, new_state)

func start_new_game() -> void:
	resource_manager.reset()
	equipment_system.reset()
	repair_queue.clear()
	stats_manager.reset()
	_night_history.clear()
	_current_night = 0
	_last_result = null
	tutorial_manager.deserialize({"tutorial_done": false, "current_phase": 0, "steps_shown": {}})
	change_state(GameState.NIGHT_PREP)
	start_night()

func start_night() -> void:
	_current_night += 1
	audio_manager.trigger_alarm(AudioManager.AlarmType.NIGHT_START)

	if tutorial_manager.should_show_tutorial(_current_night):
		event_scheduler.set_tutorial_mode(true)
		tutorial_manager.start_night_tutorial(_current_night)
	else:
		event_scheduler.set_tutorial_mode(false)

	change_state(GameState.NIGHT_ACTIVE)
	night_started.emit(_current_night)

func end_night(allocation_choices: Dictionary) -> void:
	var result := night_resolver.resolve_night(_current_night, allocation_choices)
	_last_result = result
	_night_history.append(result.serialize())

	audio_manager.stop_all_alarms()

	if result.survived:
		stats_manager.record_night_survived()
		for evt: NightEvent in result.events:
			stats_manager.record_event_resolved()
		audio_manager.trigger_alarm(AudioManager.AlarmType.NIGHT_END)
	else:
		stats_manager.record_night_failed(result.failure_type)
		audio_manager.trigger_alarm(AudioManager.AlarmType.GAME_OVER)

	tutorial_manager.on_night_result(result)

	save_manager.auto_save(save_manager.build_save_data(
		_current_night, resource_manager, equipment_system, repair_queue,
		event_scheduler, _night_history, tutorial_manager.is_tutorial_done(),
		stats_manager.serialize()
	))

	if result.survived:
		change_state(GameState.NIGHT_RESULT)
		night_ended.emit(result)
	else:
		change_state(GameState.GAME_OVER)
		game_over.emit(result.failure_type)

func continue_to_next_night() -> void:
	change_state(GameState.NIGHT_PREP)
	start_night()

func open_repair_select() -> void:
	change_state(GameState.REPAIR_SELECT)

func close_repair_select() -> void:
	change_state(GameState.NIGHT_PREP)

func open_replay() -> void:
	change_state(GameState.REPLAY_VIEW)

func close_replay() -> void:
	change_state(GameState.MENU)

func allocate_resource(from: ResourceType.Type, to: ResourceType.Type, amount: int) -> bool:
	var success := resource_manager.allocate(from, to, amount)
	if success:
		stats_manager.record_allocation(to, amount)
		tutorial_manager.on_resource_allocated(to)
	return success

func add_to_repair_queue(slot_id: String) -> bool:
	var slot := equipment_system.get_slot(slot_id)
	if slot == null:
		return false
	return repair_queue.add_repair(slot)

func remove_from_repair_queue(slot_id: String) -> bool:
	var slot := equipment_system.get_slot(slot_id)
	if slot == null:
		return false
	return repair_queue.remove_repair(slot)

func save_game(slot_name: String = "manual_save") -> bool:
	var data := save_manager.build_save_data(
		_current_night, resource_manager, equipment_system, repair_queue,
		event_scheduler, _night_history, tutorial_manager.is_tutorial_done(),
		stats_manager.serialize()
	)
	return save_manager.save_game(slot_name, data)

func load_game(slot_name: String = "manual_save") -> bool:
	var data := save_manager.load_game(slot_name)
	if data.is_empty():
		return false
	_apply_loaded_data(data)
	return true

func _apply_loaded_data(data: Dictionary) -> void:
	if data.has("night"):
		_current_night = data["night"]
	if data.has("resources"):
		resource_manager.deserialize(data["resources"])
	if data.has("equipment"):
		equipment_system.deserialize(data["equipment"])
	if data.has("event_scheduler"):
		event_scheduler.deserialize(data["event_scheduler"])
	if data.has("night_history"):
		_night_history.clear()
		for entry: Dictionary in data["night_history"]:
			_night_history.append(entry)
	if data.has("tutorial_done"):
		tutorial_manager.deserialize({
			"tutorial_done": data["tutorial_done"],
			"current_phase": TutorialManager.TutorialPhase.DONE if data["tutorial_done"] else TutorialManager.TutorialPhase.NONE,
			"steps_shown": {},
		})
	if data.has("stats"):
		stats_manager.deserialize(data["stats"])
	_last_result = null
	change_state(GameState.NIGHT_PREP)

func _on_resource_critical(type: ResourceType.Type) -> void:
	stats_manager.record_critical(type)
	match type:
		ResourceType.Type.OXYGEN:
			audio_manager.trigger_alarm(AudioManager.AlarmType.OXYGEN_CRITICAL)
		ResourceType.Type.POWER:
			audio_manager.trigger_alarm(AudioManager.AlarmType.POWER_CRITICAL)
		ResourceType.Type.SONAR:
			audio_manager.trigger_alarm(AudioManager.AlarmType.SONAR_CRITICAL)

func _on_resource_depleted(type: ResourceType.Type) -> void:
	pass

func _on_equipment_broken(slot: EquipmentSlot) -> void:
	stats_manager.record_equipment_broken()
	audio_manager.trigger_alarm(AudioManager.AlarmType.REPAIR_NEEDED)

func _on_equipment_critical(slot: EquipmentSlot) -> void:
	audio_manager.trigger_alarm(AudioManager.AlarmType.REPAIR_NEEDED)

func _on_repair_completed(slot: EquipmentSlot) -> void:
	stats_manager.record_repair_completed()

func _on_tutorial_step(step_id: String, text: String) -> void:
	pass
