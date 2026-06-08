class_name TutorialManager
extends Node

signal tutorial_step_shown(step_id: String, text: String)
signal tutorial_completed

enum TutorialPhase { NONE, NIGHT1_POWER, NIGHT1_RESULT, NIGHT2_SONAR, NIGHT2_RESULT, DONE }

var _current_phase: TutorialPhase = TutorialPhase.NONE
var _tutorial_done: bool = false
var _steps_shown: Dictionary = {}

func is_tutorial_done() -> bool:
	return _tutorial_done

func should_show_tutorial(night: int) -> bool:
	if _tutorial_done:
		return false
	return night <= 2

func should_restrict_events(night: int) -> bool:
	if _tutorial_done:
		return false
	return night == 1

func get_tutorial_events_for_night(night: int) -> Array[String]:
	if night == 1:
		return ["tutorial_power_drain"]
	if night == 2:
		return ["sonar_malfunction"]
	return []

func start_night_tutorial(night: int) -> void:
	if _tutorial_done:
		return
	match night:
		1:
			_current_phase = TutorialPhase.NIGHT1_POWER
			_show_step("night1_intro", "欢迎来到深海灯塔。你是这里的守夜人。\n每夜需要管理灯塔的电力、氧气、声呐和维修人员。\n\n今晚先学习电力系统——注意发电机状态。")
		2:
			_current_phase = TutorialPhase.NIGHT2_SONAR
			_show_step("night2_intro", "第二晚了。声呐系统启动，但已有故障苗头。\n\n今晚一定会出现声呐相关的事件——\n声呐盲区会让你无法预知危险，\n务必分配资源维持声呐运作。")

func on_resource_allocated(type: ResourceType.Type) -> void:
	if _tutorial_done:
		return
	if _current_phase == TutorialPhase.NIGHT1_POWER and type == ResourceType.Type.POWER:
		if not _steps_shown.has("power_allocated"):
			_show_step("power_allocated", "很好！你为电力系统分配了资源。\n电力是所有系统的基础，发电机故障会连锁影响其他系统。")
			_steps_shown["power_allocated"] = true
	if _current_phase == TutorialPhase.NIGHT2_SONAR and type == ResourceType.Type.SONAR:
		if not _steps_shown.has("sonar_allocated"):
			_show_step("sonar_allocated", "明智的选择！给声呐分配资源可以减少声呐损耗。\n声呐一旦完全失效，你将陷入盲区——那是最危险的状态。")
			_steps_shown["sonar_allocated"] = true

func on_night_result(result: NightResult) -> void:
	if _tutorial_done:
		return
	if _current_phase == TutorialPhase.NIGHT1_POWER:
		_current_phase = TutorialPhase.NIGHT1_RESULT
		if result.survived:
			_show_step("night1_result", "你挺过了第一夜！\n\n结算页面显示了当晚的消耗和设备状态。\n注意维修队列——损坏的设备需要及时修复。")
		else:
			_show_step("night1_failed", "第一夜就失败了……\n电力系统需要持续关注，别让它降到危险水平。")
	elif _current_phase == TutorialPhase.NIGHT2_SONAR:
		_current_phase = TutorialPhase.NIGHT2_RESULT
		var has_sonar_event := false
		for evt: NightEvent in result.events:
			if evt.affected_system == NightEvent.AffectedSystem.SONAR:
				has_sonar_event = true
				break
		if result.survived:
			if has_sonar_event:
				_show_step("night2_result", "你扛住了声呐故障！\n\n结算中可以看到声呐事件的损耗。\n如果声呐完全失效就会进入盲区——那将极其危险。\n从现在起所有系统都会面临压力，合理分配资源是关键。")
			else:
				_show_step("night2_result", "你挺过了第二夜！\n\n后续夜晚声呐盲区的威胁会越来越大，\n务必保持声呐系统的运作。从现在起所有系统都会面临压力。")
		else:
			_show_step("night2_failed", "第二夜失败了……\n声呐盲区是最危险的状态之一，要保持声呐系统运作。\n多给声呐分配资源，减少它的损耗。")
		_tutorial_done = true
		_current_phase = TutorialPhase.DONE
		tutorial_completed.emit()

func dismiss_current() -> void:
	pass

func _show_step(step_id: String, text: String) -> void:
	_steps_shown[step_id] = true
	tutorial_step_shown.emit(step_id, text)

func serialize() -> Dictionary:
	return {
		"tutorial_done": _tutorial_done,
		"current_phase": _current_phase,
		"steps_shown": _steps_shown.duplicate(),
	}

func deserialize(data: Dictionary) -> void:
	if data.has("tutorial_done"):
		_tutorial_done = data["tutorial_done"]
	if data.has("current_phase"):
		_current_phase = data["current_phase"] as TutorialPhase
	if data.has("steps_shown"):
		_steps_shown = data["steps_shown"]
