class_name ActionPoints
extends Node

signal ap_changed(current: int, maximum: int)
signal ap_depleted()

var current_ap: int = 0
var max_ap: int = 3

func reset(unit_max_ap: int) -> void:
	max_ap = unit_max_ap
	current_ap = max_ap
	ap_changed.emit(current_ap, max_ap)

func spend(amount: int) -> bool:
	if current_ap < amount:
		return false
	current_ap -= amount
	ap_changed.emit(current_ap, max_ap)
	if current_ap <= 0:
		ap_depleted.emit()
	return true

func restore(amount: int) -> void:
	current_ap = mini(current_ap + amount, max_ap)
	ap_changed.emit(current_ap, max_ap)

func sync_to(unit_max: int, unit_current: int) -> void:
	max_ap = unit_max
	current_ap = clampi(unit_current, 0, unit_max)
	ap_changed.emit(current_ap, max_ap)

func has_enough(amount: int) -> bool:
	return current_ap >= amount

func get_current() -> int:
	return current_ap

func get_max() -> int:
	return max_ap
