extends Node

signal score_calculated(final_score: int, breakdown: Dictionary)

class ScoringBreakdown:
	var zone_scores: Dictionary = {}
	var total_zone_quality: float = 0.0
	var strength_score: int = 0
	var time_score: int = 0
	var material_efficiency: int = 0
	var humidity_score: int = 0
	var penalty_score: int = 0
	var total: int = 0

func calculate_score(
	level_data: Dictionary,
	zone_states: Array,
	remaining_strength: float,
	time_taken: float,
	materials_used: Dictionary,
	final_humidity: float,
	errors: Array[String]
) -> ScoringBreakdown:
	var breakdown: ScoringBreakdown = ScoringBreakdown.new()
	var zones: Array = level_data.get("book", {}).get("damage_zones", [])
	var total_zones: int = zones.size()
	var repaired_count: int = 0
	var quality_sum: float = 0.0
	for zs in zone_states:
		if zs.repaired:
			repaired_count += 1
			quality_sum += zs.quality
			breakdown.zone_scores[zs.zone_id] = int(zs.quality * 100)
	if total_zones > 0:
		breakdown.total_zone_quality = quality_sum / float(total_zones)
		repaired_count = repaired_count
	var repair_completion: float = float(repaired_count) / float(max(1, total_zones))
	var base_repair_score: int = int(repair_completion * 40 + breakdown.total_zone_quality * 20)
	var target_strength: float = level_data.get("book", {}).get("base_strength", 50)
	var strength_ratio: float = remaining_strength / max(1.0, target_strength)
	if strength_ratio >= 1.0:
		breakdown.strength_score = 20
	elif strength_ratio >= 0.8:
		breakdown.strength_score = 15
	elif strength_ratio >= 0.6:
		breakdown.strength_score = 10
	elif strength_ratio >= 0.4:
		breakdown.strength_score = 5
	else:
		breakdown.strength_score = 0
	var time_limit: float = float(level_data.get("time_limit", 180))
	var time_ratio: float = 1.0 - (time_taken / time_limit)
	if time_ratio >= 0.5:
		breakdown.time_score = 15
	elif time_ratio >= 0.3:
		breakdown.time_score = 10
	elif time_ratio >= 0.0:
		breakdown.time_score = int(clamp(time_ratio * 20, 0, 10))
	else:
		breakdown.time_score = 0
	var total_material_cost: int = 0
	var optimal_cost: int = total_zones * 15
	for paper_name in materials_used.get("paper", {}).keys():
		var count: int = materials_used["paper"][paper_name]
		var p: Dictionary = LevelLoader.get_paper_by_name(paper_name)
		total_material_cost += p.get("cost", 10) * count
	for glue_name in materials_used.get("glue", {}).keys():
		var count: int = materials_used["glue"][glue_name]
		var g: Dictionary = LevelLoader.get_glue_by_name(glue_name)
		total_material_cost += g.get("cost", 5) * count
	if optimal_cost > 0:
		var efficiency: float = 1.0 - clamp(float(total_material_cost - optimal_cost) / float(max(1, optimal_cost)), 0.0, 0.5)
		breakdown.material_efficiency = int(efficiency * 10)
	else:
		breakdown.material_efficiency = 5
	var book_data: Dictionary = level_data.get("book", {})
	var humidity_target = book_data.get("humidity_target", null)
	if humidity_target != null:
		var tolerance: float = float(book_data.get("humidity_tolerance", 5))
		var diff: float = abs(final_humidity - float(humidity_target))
		if diff <= tolerance:
			breakdown.humidity_score = 10
		elif diff <= tolerance * 2:
			breakdown.humidity_score = 5
		else:
			breakdown.humidity_score = 0
	else:
		breakdown.humidity_score = 10
	breakdown.penalty_score = min(errors.size() * 3, 20)
	breakdown.total = (
		base_repair_score
		+ breakdown.strength_score
		+ breakdown.time_score
		+ breakdown.material_efficiency
		+ breakdown.humidity_score
		- breakdown.penalty_score
	)
	breakdown.total = clamp(breakdown.total, 0, 100)
	emit_signal("score_calculated", breakdown.total, breakdown_to_dict(breakdown, repaired_count, total_zones))
	return breakdown

func breakdown_to_dict(breakdown: ScoringBreakdown, repaired: int, total: int) -> Dictionary:
	return {
		"zone_scores": breakdown.zone_scores,
		"total_zone_quality": breakdown.total_zone_quality,
		"repaired_count": repaired,
		"total_zones": total,
		"strength_score": breakdown.strength_score,
		"time_score": breakdown.time_score,
		"material_efficiency": breakdown.material_efficiency,
		"humidity_score": breakdown.humidity_score,
		"penalty_score": breakdown.penalty_score,
		"total": breakdown.total
	}

func get_grade(score: int) -> String:
	if score >= 95:
		return "S"
	elif score >= 85:
		return "A"
	elif score >= 70:
		return "B"
	elif score >= 55:
		return "C"
	elif score >= 40:
		return "D"
	else:
		return "F"

func get_grade_description(grade: String) -> String:
	match grade:
		"S":
			return "完美修复！堪称大师之作，将被载入修复史册。"
		"A":
			return "优秀修复！技艺精湛，古籍重获新生。"
		"B":
			return "良好修复。虽有小瑕，不碍整体品质。"
		"C":
			return "合格修复。勉强完成，仍需更多练习。"
		"D":
			return "勉强过关。修复质量堪忧，古籍受损严重。"
		_:
			return "修复失败。古籍受到了不可逆的损伤。"
