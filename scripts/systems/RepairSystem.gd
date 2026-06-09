extends Node

signal zone_repaired(zone_id: String, quality: float)
signal step_completed(zone_id: String, step: String)
signal step_failed(zone_id: String, step: String, reason: String)

func check_step_order(zone_state: RepairZoneState, next_step: String) -> RepairStepResult:
	var result: RepairStepResult = RepairStepResult.new()
	var required_order: Array = zone_state.zone_data.get("step_order", [])
	var expected_index: int = zone_state.completed_steps.size()
	if expected_index >= required_order.size():
		result.success = false
		result.reason = "此区域已完成全部修复步骤。"
		result.penalty = 5.0
		return result
	var expected_step: String = required_order[expected_index]
	if next_step != expected_step:
		result.success = false
		result.reason = "操作顺序错误！当前应执行【%s】，你选择了【%s】。" % [_step_name(expected_step), _step_name(next_step)]
		result.penalty = 10.0
		zone_state.errors.append(result.reason)
		return result
	result.success = true
	return result

func _step_name(step: String) -> String:
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

func execute_step(zone_state: RepairZoneState, step: String, params: Dictionary) -> RepairStepResult:
	var order_check: RepairStepResult = check_step_order(zone_state, step)
	if not order_check.success:
		emit_signal("step_failed", zone_state.zone_id, step, order_check.reason)
		return order_check
	var result: RepairStepResult = RepairStepResult.new()
	match step:
		"humidify":
			result = _step_humidify(zone_state, params)
		"cut":
			result = _step_cut(zone_state, params)
		"align":
			result = _step_align(zone_state, params)
		"paste":
			result = _step_paste(zone_state, params)
		"press":
			result = _step_press(zone_state, params)
	if result.success:
		zone_state.completed_steps.append(step)
		zone_state.quality = clamp(zone_state.quality + (1.0 - result.penalty / 100.0), 0.0, 1.0)
		emit_signal("step_completed", zone_state.zone_id, step)
		var required_order: Array = zone_state.zone_data.get("step_order", [])
		if zone_state.completed_steps.size() >= required_order.size():
			zone_state.repaired = true
			var avg_quality: float = zone_state.quality / float(max(1, required_order.size()))
			zone_state.quality = clamp(avg_quality, 0.0, 1.0)
			emit_signal("zone_repaired", zone_state.zone_id, zone_state.quality)
	else:
		zone_state.errors.append(result.reason)
		emit_signal("step_failed", zone_state.zone_id, step, result.reason)
	return result

func _step_humidify(zone_state: RepairZoneState, params: Dictionary) -> RepairStepResult:
	var result: RepairStepResult = RepairStepResult.new()
	var current_humidity: float = params.get("humidity", 50.0)
	var target_humidity: float = params.get("target_humidity", 55.0)
	var tolerance: float = params.get("tolerance", 5.0)
	var diff: float = abs(current_humidity - target_humidity)
	if diff > tolerance * 2:
		result.success = false
		result.reason = "湿度过高或过低（%.1f%%），纸张可能受损！目标范围：%.0f±%.0f%%。" % [current_humidity, target_humidity, tolerance]
		result.penalty = 25.0
	elif diff > tolerance:
		result.success = true
		result.quality = 0.6
		result.penalty = 15.0
		result.reason = "湿度略有偏差（%.1f%%），纸张软化效果一般。" % current_humidity
	else:
		result.success = true
		result.quality = 1.0
		result.penalty = 0.0
		result.reason = "湿度控制完美，纸张充分软化。"
	return result

func _step_cut(zone_state: RepairZoneState, params: Dictionary) -> RepairStepResult:
	var result: RepairStepResult = RepairStepResult.new()
	var selected_paper: String = params.get("paper_name", "")
	var required_paper: String = zone_state.zone_data.get("required_paper_type", "")
	zone_state.current_paper = selected_paper
	if selected_paper.is_empty():
		result.success = false
		result.reason = "请先选择补纸材料！"
		result.penalty = 5.0
		return result
	if selected_paper != required_paper:
		var paper_info: Dictionary = LevelLoader.get_paper_by_name(selected_paper)
		var compatibility: Array = paper_info.get("compatibility", [])
		if required_paper in compatibility:
			result.success = true
			result.quality = 0.75
			result.penalty = 20.0
			result.reason = "纸张类型不完全匹配（%s vs %s），但在兼容范围内。" % [selected_paper, required_paper]
		else:
			result.success = false
			result.reason = "材料不匹配！此区域需要【%s】，你使用了【%s】。" % [required_paper, selected_paper]
			result.penalty = 30.0
			return result
	else:
		result.success = true
		result.quality = 1.0
		result.penalty = 0.0
		result.reason = "补纸类型匹配，裁剪精准。"
	var size: int = zone_state.zone_data.get("size", 1)
	var precision: float = params.get("cut_precision", 0.8)
	if precision < 0.5:
		result.penalty += 15.0
		result.quality *= 0.7
		result.reason += " 但剪裁精度不足。"
	elif precision > 0.9:
		result.quality *= 1.05
		result.reason += " 剪裁精度极佳！"
	return result

func _step_align(zone_state: RepairZoneState, params: Dictionary) -> RepairStepResult:
	var result: RepairStepResult = RepairStepResult.new()
	var alignment_quality: float = params.get("alignment_quality", 0.7)
	if alignment_quality < 0.3:
		result.success = false
		result.reason = "对齐严重错位，无法继续修复！"
		result.penalty = 35.0
		return result
	result.success = true
	result.quality = clamp(alignment_quality, 0.0, 1.0)
	result.penalty = (1.0 - alignment_quality) * 20.0
	if alignment_quality > 0.9:
		result.reason = "对齐完美，纤维纹理精确匹配。"
	elif alignment_quality > 0.7:
		result.reason = "对齐良好，仅有细微偏差。"
	else:
		result.reason = "对齐一般，存在可见缝隙。"
	return result

func _step_paste(zone_state: RepairZoneState, params: Dictionary) -> RepairStepResult:
	var result: RepairStepResult = RepairStepResult.new()
	var selected_glue: String = params.get("glue_name", "")
	var glue_ratio: float = params.get("glue_ratio", 0.5)
	var required_ratio: float = zone_state.zone_data.get("required_glue_ratio", 0.5)
	var ratio_tolerance: float = 0.1
	zone_state.current_glue = selected_glue
	zone_state.current_glue_ratio = glue_ratio
	if selected_glue.is_empty():
		result.success = false
		result.reason = "请先选择胶水类型！"
		result.penalty = 5.0
		return result
	var ratio_diff: float = abs(glue_ratio - required_ratio)
	if ratio_diff > ratio_tolerance * 3:
		result.success = false
		if glue_ratio > required_ratio:
			result.reason = "胶水浓度过高（%.2f），会渗透损伤纸张！目标浓度约为 %.2f。" % [glue_ratio, required_ratio]
		else:
			result.reason = "胶水浓度过低（%.2f），粘合力不足！目标浓度约为 %.2f。" % [glue_ratio, required_ratio]
		result.penalty = 30.0
		return result
	result.success = true
	var ratio_quality: float = 1.0 - (ratio_diff / (ratio_tolerance * 3))
	result.quality = clamp(ratio_quality, 0.0, 1.0)
	if ratio_diff <= ratio_tolerance:
		result.penalty = 0.0
		result.reason = "胶水浓度精准（%.2f），粘合效果完美。" % glue_ratio
	else:
		result.penalty = ratio_diff * 50.0
		result.reason = "胶水浓度略有偏差（%.2f），粘合效果一般。" % glue_ratio
	return result

func _step_press(zone_state: RepairZoneState, params: Dictionary) -> RepairStepResult:
	var result: RepairStepResult = RepairStepResult.new()
	var press_strength: float = params.get("press_strength", 0.6)
	var press_duration: float = params.get("press_duration", 2.0)
	if press_strength > 0.95:
		result.success = false
		result.reason = "按压力度过大！纸张被压出痕迹，修复失败。"
		result.penalty = 40.0
		return result
	var ideal_strength: float = 0.6 + float(zone_state.zone_data.get("size", 1)) * 0.05
	var strength_diff: float = abs(press_strength - ideal_strength)
	result.success = true
	result.quality = clamp(1.0 - strength_diff * 2.0, 0.0, 1.0)
	result.penalty = strength_diff * 30.0
	if strength_diff < 0.1:
		result.reason = "按压力度与时间恰到好处，粘合处平整牢固。"
	elif press_strength < ideal_strength:
		result.reason = "按压力度稍轻，粘合可能不够牢固。"
	else:
		result.reason = "按压力度稍重，纸张略有变形。"
	return result
