extends RefCounted

class_name FailureTypes

enum Type {
	MATERIAL_MISMATCH,
	TIME_EXCEEDED,
	STEP_ORDER_ERROR,
	HUMIDITY_DAMAGE,
	STRENGTH_COLLAPSE,
	PRESS_DAMAGE,
	LOW_SCORE
}

const MATERIAL_MISMATCH = Type.MATERIAL_MISMATCH
const TIME_EXCEEDED = Type.TIME_EXCEEDED
const STEP_ORDER_ERROR = Type.STEP_ORDER_ERROR
const HUMIDITY_DAMAGE = Type.HUMIDITY_DAMAGE
const STRENGTH_COLLAPSE = Type.STRENGTH_COLLAPSE
const PRESS_DAMAGE = Type.PRESS_DAMAGE
const LOW_SCORE = Type.LOW_SCORE

static func type_to_string(t: int) -> String:
	match t:
		Type.MATERIAL_MISMATCH:
			return "材料不匹配"
		Type.TIME_EXCEEDED:
			return "时间超限"
		Type.STEP_ORDER_ERROR:
			return "操作顺序错误"
		Type.HUMIDITY_DAMAGE:
			return "湿度失控"
		Type.STRENGTH_COLLAPSE:
			return "纸张强度崩溃"
		Type.PRESS_DAMAGE:
			return "按压损伤"
		Type.LOW_SCORE:
			return "综合评分不足"
		_:
			return "未知错误"
