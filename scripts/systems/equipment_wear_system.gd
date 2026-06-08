class_name EquipmentWearSystem
extends Node

signal equipment_degraded(slot: EquipmentSlot)
signal equipment_broken(slot: EquipmentSlot)
signal equipment_critical(slot: EquipmentSlot)

var _slots: Dictionary = {}

func _ready() -> void:
	_register_default_equipment()

func _register_default_equipment() -> void:
	var generator := EquipmentSlot.new("generator", "主发电机", ResourceType.Type.POWER, 6)
	generator.max_durability = 120
	generator.current_durability = 120
	register_slot(generator)

	var power_grid := EquipmentSlot.new("power_grid", "配电网络", ResourceType.Type.POWER, 4)
	register_slot(power_grid)

	var oxy_recycler := EquipmentSlot.new("oxy_recycler", "氧气循环器", ResourceType.Type.OXYGEN, 5)
	register_slot(oxy_recycler)

	var oxy_seal := EquipmentSlot.new("oxy_seal", "密封系统", ResourceType.Type.OXYGEN, 4)
	register_slot(oxy_seal)

	var sonar_array := EquipmentSlot.new("sonar_array", "声呐阵列", ResourceType.Type.SONAR, 5)
	register_slot(sonar_array)

	var sonar_processor := EquipmentSlot.new("sonar_processor", "声呐处理器", ResourceType.Type.SONAR, 3)
	register_slot(sonar_processor)

	var hull := EquipmentSlot.new("hull", "灯塔结构", ResourceType.Type.POWER, 3)
	hull.max_durability = 150
	hull.current_durability = 150
	register_slot(hull)

func register_slot(slot: EquipmentSlot) -> void:
	_slots[slot.id] = slot

func get_slot(id: String) -> EquipmentSlot:
	return _slots.get(id) as EquipmentSlot

func get_all_slots() -> Array[EquipmentSlot]:
	var result: Array[EquipmentSlot] = []
	for slot: EquipmentSlot in _slots.values():
		result.append(slot)
	return result

func get_slots_for_system(system: ResourceType.Type) -> Array[EquipmentSlot]:
	var result: Array[EquipmentSlot] = []
	for slot: EquipmentSlot in _slots.values():
		if slot.affects_system == system:
			result.append(slot)
	return result

func get_broken_slots() -> Array[EquipmentSlot]:
	var result: Array[EquipmentSlot] = []
	for slot: EquipmentSlot in _slots.values():
		if slot.is_broken():
			result.append(slot)
	return result

func get_critical_slots() -> Array[EquipmentSlot]:
	var result: Array[EquipmentSlot] = []
	for slot: EquipmentSlot in _slots.values():
		if slot.is_critical() and not slot.is_broken():
			result.append(slot)
	return result

func apply_nightly_wear() -> void:
	for slot: EquipmentSlot in _slots.values():
		var was_critical := slot.is_critical()
		var was_broken := slot.is_broken()
		slot.apply_wear()
		if slot.is_broken() and not was_broken:
			equipment_broken.emit(slot)
		elif slot.is_critical() and not was_critical:
			equipment_critical.emit(slot)
		else:
			equipment_degraded.emit(slot)

func apply_event_damage(event: NightEvent) -> void:
	if event.power_drain > 0:
		for slot: EquipmentSlot in get_slots_for_system(ResourceType.Type.POWER):
			slot.apply_wear()
			if event.severity >= NightEvent.Severity.HIGH:
				slot.apply_wear()
	if event.oxygen_drain > 0:
		for slot: EquipmentSlot in get_slots_for_system(ResourceType.Type.OXYGEN):
			slot.apply_wear()
			if event.severity >= NightEvent.Severity.HIGH:
				slot.apply_wear()
	if event.sonar_drain > 0:
		for slot: EquipmentSlot in get_slots_for_system(ResourceType.Type.SONAR):
			slot.apply_wear()
			if event.severity >= NightEvent.Severity.HIGH:
				slot.apply_wear()
	if event.structure_damage > 0:
		var hull := get_slot("hull")
		if hull:
			for i in event.structure_damage / 5:
				hull.apply_wear()

func get_system_efficiency(system: ResourceType.Type) -> float:
	var slots := get_slots_for_system(system)
	if slots.is_empty():
		return 1.0
	var total_ratio := 0.0
	for slot: EquipmentSlot in slots:
		total_ratio += slot.durability_ratio()
	return total_ratio / slots.size()

func reset() -> void:
	for slot: EquipmentSlot in _slots.values():
		slot.full_repair()

func serialize() -> Dictionary:
	var data := {}
	for id: String in _slots:
		data[id] = _slots[id].serialize()
	return data

func deserialize(data: Dictionary) -> void:
	for id: String in data:
		if _slots.has(id):
			_slots[id].deserialize(data[id])
