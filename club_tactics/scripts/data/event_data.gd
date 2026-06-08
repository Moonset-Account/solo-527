class_name EventData
extends Resource

enum TriggerCondition { TURN_START, TURN_END, TASK_COMPLETE, SATISFACTION_BELOW, SATISFACTION_ABOVE }

@export var id: String = ""
@export var display_name: String = ""
@export var description: String = ""
@export var trigger_condition: TriggerCondition = TriggerCondition.TURN_START
@export var trigger_turn: int = 0
@export var trigger_value: float = 0.0
@export var satisfaction_modifier: float = 0.0
@export var ap_modifier: int = 0
@export var is_one_shot: bool = true
@export var has_triggered: bool = false
@export var choices: Array[EventChoice] = []
