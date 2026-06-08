class_name NightResolver
extends Node

var _resource_manager: ResourceManager
var _equipment_system: EquipmentWearSystem
var _repair_queue: RepairQueue
var _event_scheduler: EventScheduler

var drain_reduction_per_point: int = 2

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

	var power_alloc: int = allocation_choices.get(ResourceType.Type.POWER, 0)
	var oxygen_alloc: int = allocation_choices.get(ResourceType.Type.OXYGEN, 0)
	var sonar_alloc: int = allocation_choices.get(ResourceType.Type.SONAR, 0)
	var repair_alloc: int = allocation_choices.get(ResourceType.Type.REPAIR, 0)

	var repair_personnel := maxi(repair_alloc, 0)
	var completed := _repair_queue.process_repairs(repair_personnel)
	result.repairs_made = []
	for slot: EquipmentSlot in completed:
		result.repairs_made.append(slot.id)

	_equipment_system.apply_nightly_wear()

	var total_power_drain := 0
	var total_oxygen_drain := 0
	var total_sonar_drain := 0

	var events := _event_scheduler.select_night_events(night_number)
	result.events = events

	for evt: NightEvent in events:
		_event_scheduler.event_triggered.emit(evt)
		_equipment_system.apply_event_damage(evt)
		total_power_drain += evt.power_drain
		total_oxygen_drain += evt.oxygen_drain
		total_sonar_drain += evt.sonar_drain

	var base_power_drain := 3 + night_number
	var base_oxygen_drain := 2 + night_number / 2
	total_power_drain += base_power_drain
	total_oxygen_drain += base_oxygen_drain

	var power_reduction := power_alloc * drain_reduction_per_point
	var oxygen_reduction := oxygen_alloc * drain_reduction_per_point
	var sonar_reduction := sonar_alloc * drain_reduction_per_point

	var effective_power_drain := maxi(total_power_drain - power_reduction, 0)
	var effective_oxygen_drain := maxi(total_oxygen_drain - oxygen_reduction, 0)
	var effective_sonar_drain := maxi(total_sonar_drain - sonar_reduction, 0)

	_resource_manager.apply_nightly_drain(effective_power_drain, effective_oxygen_drain, effective_sonar_drain)

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
