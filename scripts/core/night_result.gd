class_name NightResult
extends RefCounted

enum FailureType { NONE, OXYGEN_DEPLETED, POWER_OVERLOAD, REPAIR_QUEUE_FULL, SONAR_BLACKOUT }

var night_number: int = 0
var survived: bool = true
var failure_type: FailureType = FailureType.NONE
var events: Array[NightEvent] = []
var resources_before: Dictionary = {}
var resources_after: Dictionary = {}
var equipment_before: Dictionary = {}
var equipment_after: Dictionary = {}
var repairs_made: Array[String] = []
var allocation_choices: Dictionary = {}

func get_failure_description() -> String:
	match failure_type:
		FailureType.OXYGEN_DEPLETED:
			return "缺氧 - 氧气供应完全耗尽，船员无法呼吸"
		FailureType.POWER_OVERLOAD:
			return "电力过载 - 发电机系统崩溃，全塔停电"
		FailureType.REPAIR_QUEUE_FULL:
			return "维修排队 - 太多设备损坏，维修人员无法及时处理"
		FailureType.SONAR_BLACKOUT:
			return "声呐盲区 - 声呐系统完全失效，无法探测危险"
		_:
			return ""

func serialize() -> Dictionary:
	var evt_ids: Array[String] = []
	for e: NightEvent in events:
		evt_ids.append(e.id)
	return {
		"night": night_number,
		"survived": survived,
		"failure_type": failure_type,
		"event_ids": evt_ids,
		"resources_before": resources_before,
		"resources_after": resources_after,
		"repairs_made": repairs_made,
		"allocation_choices": allocation_choices,
	}
