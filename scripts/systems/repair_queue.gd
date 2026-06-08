class_name RepairQueue
extends Node

signal repair_added(slot: EquipmentSlot)
signal repair_completed(slot: EquipmentSlot)
signal repair_cancelled(slot: EquipmentSlot)
signal queue_changed

var _queue: Array[EquipmentSlot] = []
var _max_queue_size: int = 4
var _repair_per_person: int = 15

func get_queue() -> Array[EquipmentSlot]:
	return _queue

func queue_size() -> int:
	return _queue.size()

func can_add(slot: EquipmentSlot) -> bool:
	if _queue.size() >= _max_queue_size:
		return false
	if _queue.has(slot):
		return false
	return true

func add_repair(slot: EquipmentSlot) -> bool:
	if not can_add(slot):
		return false
	_queue.append(slot)
	repair_added.emit(slot)
	queue_changed.emit()
	return true

func remove_repair(slot: EquipmentSlot) -> bool:
	var idx := _queue.find(slot)
	if idx < 0:
		return false
	_queue.remove_at(idx)
	repair_cancelled.emit(slot)
	queue_changed.emit()
	return true

func reorder(old_index: int, new_index: int) -> bool:
	if old_index < 0 or old_index >= _queue.size():
		return false
	if new_index < 0 or new_index >= _queue.size():
		return false
	if old_index == new_index:
		return false
	var item := _queue[old_index]
	_queue.remove_at(old_index)
	_queue.insert(new_index, item)
	queue_changed.emit()
	return true

func process_repairs(available_personnel: int) -> Array[EquipmentSlot]:
	var completed: Array[EquipmentSlot] = []
	var remaining_personnel := available_personnel

	for slot: EquipmentSlot in _queue:
		if remaining_personnel <= 0:
			break
		var repair_amount := remaining_personnel * _repair_per_person
		slot.repair(repair_amount)
		remaining_personnel = 0
		if slot.current_durability >= slot.max_durability:
			completed.append(slot)

	for slot: EquipmentSlot in completed:
		_queue.erase(slot)
		repair_completed.emit(slot)

	if completed.size() > 0:
		queue_changed.emit()

	return completed

func clear() -> void:
	_queue.clear()
	queue_changed.emit()

func serialize() -> Array:
	var result := []
	for slot: EquipmentSlot in _queue:
		result.append(slot.id)
	return result

func set_repair_per_person(amount: int) -> void:
	_repair_per_person = amount
