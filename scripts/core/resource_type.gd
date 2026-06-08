class_name ResourceType
extends RefCounted

enum Type { POWER, OXYGEN, SONAR, REPAIR }

static func type_name(t: Type) -> String:
	match t:
		Type.POWER: return "电力"
		Type.OXYGEN: return "氧气"
		Type.SONAR: return "声呐"
		Type.REPAIR: return "维修人员"
		_: return "未知"

static func type_icon_hint(t: Type) -> String:
	match t:
		Type.POWER: return "⚡"
		Type.OXYGEN: return "🫁"
		Type.SONAR: return "📡"
		Type.REPAIR: return "🔧"
		_: return "?"

static func all_types() -> Array[Type]:
	return [Type.POWER, Type.OXYGEN, Type.SONAR, Type.REPAIR]
