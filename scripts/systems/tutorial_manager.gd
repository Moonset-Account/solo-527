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

func get_tutorial_events_for_night(night: int) -> Array[String]:
	if night == 1:
		return ["tutorial_power_drain"]
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
			_show_step("night2_intro", "第二晚了。现在声呐系统上线。\n\n声呐探测周围海域的威胁，如果声呐盲区扩大，\n你将无法预知危险。分配资源时务必注意声呐状态。")

func on_resource_allocated(type: ResourceType.Type) -> void:
	if _tutorial_done:
		return
	if _current_phase == TutorialPhase.NIGHT1_POWER and type == ResourceType.Type.POWER:
		if not _steps_shown.has("power_allocated"):
			_show_step("power_allocated", "很好！你为电力系统分配了资源。\n电力是所有系统的基础，发电机故障会连锁影响其他系统。")
			_steps_shown["power_allocated"] = true

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
		if result.survived:
			_show_step("night2_result", "两夜都撑过来了！\n\n从现在起，所有系统都会面临压力。\n合理分配资源、及时维修设备是存活的关键。")
		else:
			_show_step("night2_failed", "第二夜失败了……\n声呐盲区是很危险的，要保持声呐系统运作。")
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
