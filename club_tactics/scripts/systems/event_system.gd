class_name EventSystem
extends Node

signal event_triggered(event: EventData)
signal event_choice_made(event: EventData, choice: EventChoice)

var _events: Array[EventData] = []
var _pending_events: Array[EventData] = []

func setup_events(events: Array[EventData]) -> void:
	_events.clear()
	_pending_events.clear()
	for e in events:
		var copy: EventData = e.duplicate()
		copy.has_triggered = false
		_events.append(copy)

func check_events(condition: EventData.TriggerCondition, turn: int, satisfaction: float) -> void:
	_pending_events.clear()
	for e in _events:
		if e.has_triggered and e.is_one_shot:
			continue
		if e.trigger_condition != condition:
			continue
		match condition:
			EventData.TriggerCondition.TURN_START, EventData.TriggerCondition.TURN_END:
				if e.trigger_turn == turn:
					_pending_events.append(e)
			EventData.TriggerCondition.TASK_COMPLETE:
				_pending_events.append(e)
			EventData.TriggerCondition.SATISFACTION_BELOW:
				if satisfaction < e.trigger_value:
					_pending_events.append(e)
			EventData.TriggerCondition.SATISFACTION_ABOVE:
				if satisfaction > e.trigger_value:
					_pending_events.append(e)

func fire_pending_events() -> void:
	for e in _pending_events:
		e.has_triggered = true
		event_triggered.emit(e)

func has_pending_events() -> bool:
	return _pending_events.size() > 0

func get_pending_events() -> Array[EventData]:
	return _pending_events

func choose_option(event: EventData, choice: EventChoice) -> void:
	event_choice_made.emit(event, choice)
