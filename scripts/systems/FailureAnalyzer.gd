extends Node

enum FailureType {
	MATERIAL_MISMATCH,
	TIME_EXCEEDED,
	STEP_ORDER_ERROR,
	HUMIDITY_DAMAGE,
	STRENGTH_COLLAPSE,
	PRESS_DAMAGE,
	LOW_SCORE
}

class FailureRecord:
	var type: FailureType
	var zone_id: String = ""
	var zone_name: String = ""
	var description: String = ""
	var suggestion: String = ""
	var severity: int = 1

func analyze_failure(
	zone_states: Array,
	time_taken: float,
	time_limit: float,
	final_strength: float,
	base_strength: float,
	score: int,
	passing_score: int
) -> Array[FailureRecord]:
	var failures: Array[FailureRecord] = []
	if time_taken > time_limit:
		var rec: FailureRecord = FailureRecord.new()
		rec.type = FailureType.TIME_EXCEEDED
		rec.description = "超出客户期限 %.0f 秒（时限：%.0f 秒）。" % [time_taken - time_limit, time_limit]
		rec.suggestion = "合理规划修复顺序，优先处理关键损伤。下次尝试可以先从大面积损伤开始。"
		rec.severity = 3
		failures.append(rec)
	if final_strength < base_strength * 0.3:
		var rec: FailureRecord = FailureRecord.new()
		rec.type = FailureType.STRENGTH_COLLAPSE
		rec.description = "纸张强度严重下降（剩余 %.0f / 原 %.0f），纸张濒临破碎。" % [final_strength, base_strength]
		rec.suggestion = "注意控制胶水浓度，过高的浓度会损伤纸张纤维。按压时力度要适中。"
		rec.severity = 5
		failures.append(rec)
	elif final_strength < base_strength * 0.5:
		var rec: FailureRecord = FailureRecord.new()
		rec.type = FailureType.STRENGTH_COLLAPSE
		rec.description = "纸张强度下降较多（剩余 %.0f / 原 %.0f）。" % [final_strength, base_strength]
		rec.suggestion = "尝试降低胶水浓度，或使用可逆性更好的淀粉胶。"
		rec.severity = 2
		failures.append(rec)
	for zs in zone_states:
		for err in zs.errors:
			if err.find("材料不匹配") != -1:
				var rec: FailureRecord = FailureRecord.new()
				rec.type = FailureType.MATERIAL_MISMATCH
				rec.zone_id = zs.zone_id
				rec.zone_name = zs.zone_data.get("name", "")
				rec.description = "[%s] %s" % [rec.zone_name, err]
				var required: String = zs.zone_data.get("required_paper_type", "")
				rec.suggestion = "此区域需要使用【%s】。选择材料前请仔细阅读损伤描述。" % required
				rec.severity = 2
				failures.append(rec)
			elif err.find("操作顺序错误") != -1:
				var rec: FailureRecord = FailureRecord.new()
				rec.type = FailureType.STEP_ORDER_ERROR
				rec.zone_id = zs.zone_id
				rec.zone_name = zs.zone_data.get("name", "")
				rec.description = "[%s] %s" % [rec.zone_name, err]
				var order: Array = zs.zone_data.get("step_order", [])
				var order_names: Array = []
				for s in order:
					order_names.append(_step_cn(s))
				rec.suggestion = "此区域的正确修复步骤为：%s。" % " → ".join(order_names)
				rec.severity = 2
				failures.append(rec)
			elif err.find("湿度过高") != -1 or err.find("湿度过低") != -1:
				var rec: FailureRecord = FailureRecord.new()
				rec.type = FailureType.HUMIDITY_DAMAGE
				rec.zone_id = zs.zone_id
				rec.zone_name = zs.zone_data.get("name", "")
				rec.description = "[%s] %s" % [rec.zone_name, err]
				rec.suggestion = "使用湿度箱前先查看目标湿度，调整至范围内再操作。"
				rec.severity = 2
				failures.append(rec)
			elif err.find("按压力度过大") != -1:
				var rec: FailureRecord = FailureRecord.new()
				rec.type = FailureType.PRESS_DAMAGE
				rec.zone_id = zs.zone_id
				rec.zone_name = zs.zone_data.get("name", "")
				rec.description = "[%s] %s" % [rec.zone_name, err]
				rec.suggestion = "使用压平板时，损伤面积越大需要的力度越大，但不要超过 0.9。"
				rec.severity = 3
				failures.append(rec)
			elif err.find("浓度过高") != -1 or err.find("浓度过低") != -1:
				var rec: FailureRecord = FailureRecord.new()
				rec.type = FailureType.MATERIAL_MISMATCH
				rec.zone_id = zs.zone_id
				rec.zone_name = zs.zone_data.get("name", "")
				rec.description = "[%s] %s" % [rec.zone_name, err]
				var ratio: float = zs.zone_data.get("required_glue_ratio", 0.5)
				rec.suggestion = "此区域的推荐胶水浓度约为 %.2f，请使用滑块精确调整。" % ratio
				rec.severity = 1
				failures.append(rec)
	if score < passing_score and failures.is_empty():
		var rec: FailureRecord = FailureRecord.new()
		rec.type = FailureType.LOW_SCORE
		rec.description = "综合评分未达到合格线（得分：%d / 合格：%d）。" % [score, passing_score]
		rec.suggestion = "仔细完成所有损伤区域，提高每一步的操作质量。"
		rec.severity = 1
		failures.append(rec)
	return failures

func _step_cn(step: String) -> String:
	match step:
		"humidify":
			return "加湿"
		"cut":
			return "裁纸"
		"align":
			return "对齐"
		"paste":
			return "粘胶"
		"press":
			return "按压"
		_:
			return step

func failure_type_to_string(t: FailureType) -> String:
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

func generate_replay_data(
	level_id: int,
	zone_states: Array,
	time_taken: float,
	materials_used: Dictionary,
	final_strength: float,
	final_humidity: float,
	action_log: Array[Dictionary]
) -> Dictionary:
	var zones_detail: Array = []
	for zs in zone_states:
		zones_detail.append({
			"zone_id": zs.zone_id,
			"zone_name": zs.zone_data.get("name", ""),
			"repaired": zs.repaired,
			"quality": zs.quality,
			"completed_steps": zs.completed_steps.duplicate(),
			"errors": zs.errors.duplicate(),
			"paper_used": zs.current_paper,
			"glue_used": zs.current_glue,
			"glue_ratio": zs.current_glue_ratio
		})
	return {
		"level_id": level_id,
		"timestamp": Time.get_unix_time_from_system(),
		"time_taken": time_taken,
		"materials_used": materials_used.duplicate(true),
		"final_strength": final_strength,
		"final_humidity": final_humidity,
		"zones_detail": zones_detail,
		"action_log": action_log.duplicate()
	}
