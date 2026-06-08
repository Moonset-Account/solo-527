class_name SatisfactionSystem
extends Node

signal satisfaction_changed(value: float)
signal satisfaction_critical(value: float)
signal satisfaction_failed()

var _current: float = 50.0
var _threshold: float = 60.0
var _critical_threshold: float = 25.0

func setup(initial: float, threshold: float) -> void:
	_current = initial
	_threshold = threshold
	GameManager.satisfaction = initial
	satisfaction_changed.emit(_current)

func modify_satisfaction(amount: float) -> void:
	_current = clampf(_current + amount, 0.0, 100.0)
	GameManager.satisfaction = _current
	satisfaction_changed.emit(_current)
	if _current <= _critical_threshold:
		satisfaction_critical.emit(_current)
	if _current <= 0.0:
		satisfaction_failed.emit()

func get_satisfaction() -> float:
	return _current

func get_threshold() -> float:
	return _threshold

func is_above_threshold() -> bool:
	return _current >= _threshold

func get_percentage() -> float:
	return _current / 100.0

func check_final_result() -> bool:
	return _current >= _threshold
