extends Node
## 资源管理器 - 管理玩家的预算、修复工具、专家等资源
## 独立模块，通过EventBus与其他系统通信

const MAX_HAND_SIZE: int = 7
const BASE_BUDGET_PER_TURN: int = 3
const MAX_BUDGET_STORAGE: int = 10

var current_budget: int = 0
var max_budget_this_turn: int = 0
var base_budget_per_turn: int = BASE_BUDGET_PER_TURN

var repair_tools: int = 0
var expert_count: int = 0

var turn_number: int = 0
var max_turns: int = 10

func reset_for_new_level(level_data: Dictionary) -> void:
	turn_number = 0
	current_budget = 0
	max_budget_this_turn = 0
	repair_tools = level_data.get("starting_tools", 0)
	expert_count = level_data.get("starting_experts", 0)
	max_turns = level_data.get("max_turns", 10)
	base_budget_per_turn = level_data.get("budget_per_turn", BASE_BUDGET_PER_TURN)
	_emit_resources_changed()

func start_turn() -> void:
	turn_number += 1
	max_budget_this_turn = min(current_budget + base_budget_per_turn, MAX_BUDGET_STORAGE)
	current_budget = max_budget_this_turn
	EventBus.publish("turn_started", [turn_number])
	_emit_resources_changed()

func end_turn() -> void:
	EventBus.publish("turn_ended", [turn_number])

func can_afford(cost: Dictionary) -> bool:
	if cost.has("budget") and current_budget < cost.budget:
		return false
	if cost.has("tools") and repair_tools < cost.tools:
		return false
	if cost.has("experts") and expert_count < cost.experts:
		return false
	return true

func get_unaffordable_reason(cost: Dictionary) -> String:
	if cost.has("budget") and current_budget < cost.budget:
		return "预算不足 (需要 %d, 现有 %d)" % [cost.budget, current_budget]
	if cost.has("tools") and repair_tools < cost.tools:
		return "修复工具不足 (需要 %d, 现有 %d)" % [cost.tools, repair_tools]
	if cost.has("experts") and expert_count < cost.experts:
		return "专家不足 (需要 %d, 现有 %d)" % [cost.experts, expert_count]
	return ""

func spend(cost: Dictionary) -> bool:
	if not can_afford(cost):
		return false
	if cost.has("budget"):
		current_budget -= cost.budget
	if cost.has("tools"):
		repair_tools -= cost.tools
	if cost.has("experts"):
		expert_count -= cost.experts
	_emit_resources_changed()
	return true

func gain(resource_type: String, amount: int) -> void:
	match resource_type:
		"budget":
			current_budget = min(current_budget + amount, MAX_BUDGET_STORAGE)
		"tools":
			repair_tools += amount
		"experts":
			expert_count += amount
		_:
			push_warning("ResourceManager: Unknown resource type '%s'" % resource_type)
			return
	_emit_resources_changed()
	EventBus.publish("ui_floating_text", [Vector2(640, 200), "+%d %s" % [amount, resource_type], Color.GREEN])

func is_turn_limit_reached() -> bool:
	return turn_number >= max_turns

func get_turns_remaining() -> int:
	return max_turns - turn_number

func _emit_resources_changed() -> void:
	EventBus.publish("resources_changed", [current_budget, repair_tools, expert_count])
