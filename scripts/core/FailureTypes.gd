class_name FailureTypes
extends RefCounted

enum FailureType {
	MATERIAL_MISMATCH,
	TIME_EXCEEDED,
	STEP_ORDER_ERROR,
	HUMIDITY_DAMAGE,
	STRENGTH_COLLAPSE,
	PRESS_DAMAGE,
	LOW_SCORE
}

static func type_to_string(t: int) -> String:
	match t:
		FailureType.MATERIAL_MISMATCH:
			return "材料不匹配"
		FailureType.TIME_EXCEEDED:
			return "时间超限"
		FailureType.STEP_ORDER_ERROR:
			return "操作顺序错误"
		FailureType.HUMIDITY_DAMAGE:
			return "湿度失控"
		FailureType.STRENGTH_COLLAPSE:
			return "纸张强度崩溃"
		FailureType.PRESS_DAMAGE:
			return "按压损伤"
		FailureType.LOW_SCORE:
			return "综合评分不足"
		_:
			return "未知错误"
