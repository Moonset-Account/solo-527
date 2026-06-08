extends RefCounted
## 展品状态数据模型 - 纯数据类，封装展品的所有状态属性
## 独立模块，可被UI和游戏逻辑独立使用

class_name ExhibitModel

var id: String
var name: String
var description: String
var category: String

var repair_target: int = 100
var current_progress: int = 0

var max_condition: int = 100
var current_condition: int = 100

var base_damage_per_turn: int = 5
var damage_modifiers: Array = []
var turns_until_irreparable: int = 0

var tags: Array = []
var completed: bool = false
var failed: bool = false
var failure_reason: String = ""

var reward: Dictionary = {}
var visual_state: Dictionary = {"shake_intensity": 0.0, "glow_color": Color(0,0,0,0)}

func _init(data: Dictionary = {}) -> void:
	if not data.is_empty():
		from_dict(data)

func from_dict(data: Dictionary) -> void:
	id = data.get("id", "")
	name = data.get("name", "未知展品")
	description = data.get("description", "")
	category = data.get("category", "general")
	repair_target = data.get("repair_target", 100)
	current_progress = data.get("current_progress", 0)
	max_condition = data.get("max_condition", 100)
	current_condition = data.get("start_condition", max_condition)
	base_damage_per_turn = data.get("damage_per_turn", 0)
	turns_until_irreparable = data.get("turns_until_irreparable", 0)
	tags = data.get("tags", []).duplicate()
	reward = data.get("reward", {}).duplicate(true)

func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"description": description,
		"category": category,
		"repair_target": repair_target,
		"current_progress": current_progress,
		"max_condition": max_condition,
		"current_condition": current_condition,
		"damage_per_turn": get_effective_damage(),
		"turns_until_irreparable": turns_until_irreparable,
		"tags": tags.duplicate(),
		"completed": completed,
		"failed": failed,
		"reward": reward.duplicate(true)
	}

func get_progress_percent() -> float:
	if repair_target <= 0:
		return 1.0
	return clampf(float(current_progress) / float(repair_target), 0.0, 1.0)

func get_condition_percent() -> float:
	if max_condition <= 0:
		return 0.0
	return clampf(float(current_condition) / float(max_condition), 0.0, 1.0)

func get_effective_damage() -> int:
	var total: int = base_damage_per_turn
	for mod in damage_modifiers:
		total += mod.get("value", 0)
	return max(0, total)

func add_damage_modifier(source: String, value: int, duration: int = -1) -> void:
	damage_modifiers.append({
		"source": source,
		"value": value,
		"duration": duration
	})

func tick_damage_modifiers() -> void:
	var i: int = damage_modifiers.size() - 1
	while i >= 0:
		var mod: Dictionary = damage_modifiers[i]
		if mod.duration > 0:
			mod.duration -= 1
			if mod.duration <= 0:
				damage_modifiers.remove_at(i)
		i -= 1

func add_progress(amount: int) -> int:
	if completed or failed:
		return 0
	var actual: int = min(amount, repair_target - current_progress)
	current_progress += actual
	if current_progress >= repair_target:
		completed = true
	return actual

func take_damage(amount: int) -> int:
	if completed or failed:
		return 0
	var actual: int = min(amount, current_condition)
	current_condition -= actual
	if current_condition <= 0:
		failed = true
		failure_reason = "展品完全损坏"
	return actual

func restore_condition(amount: int) -> int:
	if completed or failed:
		return 0
	var actual: int = min(amount, max_condition - current_condition)
	current_condition += actual
	return actual

func tick_timer() -> bool:
	if completed or failed:
		return false
	if turns_until_irreparable > 0:
		turns_until_irreparable -= 1
		if turns_until_irreparable <= 0 and not completed:
			failed = true
			failure_reason = "未能在限时内完成修复"
			return true
	return false

func get_status_text() -> String:
	if completed:
		return "修复完成"
	if failed:
		return "修复失败: " + failure_reason
	var parts: Array = []
	parts.append("进度 %d/%d" % [current_progress, repair_target])
	parts.append("完好度 %d" % current_condition)
	if base_damage_per_turn > 0:
		parts.append("每回合损坏 %d" % get_effective_damage())
	if turns_until_irreparable > 0:
		parts.append("剩余 %d 回合" % turns_until_irreparable)
	return " | ".join(parts)

func get_condition_color() -> Color:
	var p: float = get_condition_percent()
	if p > 0.7:
		return Color(0.2, 0.8, 0.3)
	elif p > 0.3:
		return Color(0.9, 0.7, 0.2)
	else:
		return Color(0.9, 0.2, 0.2)

func get_progress_color() -> Color:
	var p: float = get_progress_percent()
	if p >= 1.0:
		return Color(0.2, 0.9, 0.5)
	elif p > 0.5:
		return Color(0.3, 0.6, 0.9)
	else:
		return Color(0.6, 0.6, 0.6)

func has_tag(tag_name: String) -> bool:
	return tag_name in tags

func is_urgent() -> bool:
	return turns_until_irreparable > 0 and turns_until_irreparable <= 3
