class_name NightResolver
extends Node

var _resource_manager: ResourceManager
var _equipment_system: EquipmentWearSystem
var _repair_queue: RepairQueue
var _event_scheduler: EventScheduler

func setup(rm: ResourceManager, ew: EquipmentWearSystem, rq: RepairQueue, es: EventScheduler) -> void:
	_resource_manager = rm
	_equipment_system = ew
	_repair_queue = rq
	_event_scheduler = es

func resolve_night(night_number: int, allocation_choices: Dictionary) -> NightResult:
	var result := NightResult.new()
	result.night_number = night_number
	result.allocation_choices = allocation_choices.duplicate()
	result.resources_before = _resource_manager.serialize()
	result.equipment_before = _equipment_system.serialize()

	var events := _event_scheduler.select_night_events(night_number)
	result.events = events

	var completed := _repair_queue.process_repairs(_resource_manager.get_value(ResourceType.Type.REPAIR))
	result.repairs_made = []
	for slot: EquipmentSlot in completed:
		result.repairs_made.append(slot.id)

	_equipment_system.apply_nightly_wear()
	for evt: NightEvent in events:
		_event_scheduler.event_triggered.emit(evt)
		_equipment_system.apply_event_damage(evt)
		_resource_manager.apply_nightly_drain(evt.power_drain, evt.oxygen_drain, evt.sonar_drain)

	var base_power_drain := 3 + night_number
	var base_oxygen_drain := 2 + night_number / 2
	_resource_manager.apply_nightly_drain(base_power_drain, base_oxygen_drain, 0)

	_event_scheduler.tick_cooldowns()

	result.resources_after = _resource_manager.serialize()
	result.equipment_after = _equipment_system.serialize()

	result.failure_type = _determine_failure()
	result.survived = result.failure_type == NightResult.FailureType.NONE

	return result

func _determine_failure() -> NightResult.FailureType:
	if _resource_manager.is_depleted(ResourceType.Type.OXYGEN):
		return NightResult.FailureType.OXYGEN_DEPLETED
	if _resource_manager.is_depleted(ResourceType.Type.POWER):
		return NightResult.FailureType.POWER_OVERLOAD
	var broken := _equipment_system.get_broken_slots()
	if broken.size() >= 3:
		return NightResult.FailureType.REPAIR_QUEUE_FULL
	var sonar_eff := _equipment_system.get_system_efficiency(ResourceType.Type.SONAR)
	if sonar_eff <= 0.0 and _resource_manager.is_depleted(ResourceType.Type.SONAR):
		return NightResult.FailureType.SONAR_BLACKOUT
	return NightResult.FailureType.NONE
