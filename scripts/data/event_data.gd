class_name EventData
extends RefCounted

enum EventType { DECAY, SURPRISE_DAMAGE, HIDDEN_REVEAL, EARTHQUAKE, FLOOD, THEFT_ATTEMPT }

var event_name: String = ""
var event_type: EventType = EventType.DECAY
var description: String = ""
var damage_amount: int = 0
var target_count: int = 1
var can_be_prevented: bool = true

static func create_event(event_name: String) -> EventData:
	var event = EventData.new()
	event.event_name = event_name
	match event_name:
		"decay":
			event.event_type = EventType.DECAY
			event.description = "展品自然退化，所有展品受到1点损伤"
			event.damage_amount = 1
			event.target_count = 99
		"surprise_damage":
			event.event_type = EventType.SURPRISE_DAMAGE
			event.description = "意外损伤！随机展品受到2点损伤"
			event.damage_amount = 2
			event.target_count = 1
		"hidden_reveal":
			event.event_type = EventType.HIDDEN_REVEAL
			event.description = "隐藏损伤显现！"
			event.damage_amount = 0
			event.target_count = 1
		"earthquake":
			event.event_type = EventType.EARTHQUAKE
			event.description = "地震！所有展品受到2点损伤"
			event.damage_amount = 2
			event.target_count = 99
			event.can_be_prevented = true
		"flood":
			event.event_type = EventType.FLOOD
			event.description = "水灾！纸类和丝织品受到3点损伤"
			event.damage_amount = 3
			event.target_count = 2
			event.can_be_prevented = true
		"theft_attempt":
			event.event_type = EventType.THEFT_ATTEMPT
			event.description = "盗贼试图偷窃！随机展品受到4点损伤"
			event.damage_amount = 4
			event.target_count = 1
			event.can_be_prevented = true
		_:
			event.event_type = EventType.DECAY
			event.description = "未知事件"
	return event
