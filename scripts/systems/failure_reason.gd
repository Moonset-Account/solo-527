class_name FailureReason
extends RefCounted

enum Category {
	RESOURCE_DEPLETED,
	PATH_BLOCKED,
	REPAIR_ORDER,
	TIME_OUT,
}

var category: Category = Category.RESOURCE_DEPLETED
var title: String = ""
var description: String = ""
var detail_lines: Array[String] = []
var suggestion: String = ""

func _init(cat: Category = Category.RESOURCE_DEPLETED) -> void:
	category = cat

static func analyze(
	res_manager: ResourceManager,
	event_scheduler: EventScheduler,
	robot_queue: RobotQueue,
	level_config: LevelConfig
) -> FailureReason:
	var depleted = res_manager.get_depleted_list()
	var reason = FailureReason.new()
	if depleted.is_empty():
		reason.category = Category.TIME_OUT
		reason.title = "时间耗尽"
		reason.description = "关卡时间结束，但资源未能维持在安全水平。"
		reason.detail_lines.append("部分资源水平过低，未能完成目标。")
		reason.suggestion = "尝试更快地派遣机器人处理事故，减少资源下降速度。"
		return reason
	var critical_depleted: Array[StringName] = []
	for d in depleted:
		if d == ResourceManager.OXYGEN or d == ResourceManager.WATER:
			critical_depleted.append(d)
	if critical_depleted.size() > 0:
		var busy_robots = robot_queue.get_busy_count()
		var idle_robots = robot_queue.get_idle_count()
		var was_busy_elsewhere = busy_robots > 0
		var had_idle = idle_robots > 0
		if had_idle and critical_depleted.size() > 0:
			reason.category = Category.REPAIR_ORDER
			reason.title = "维修顺序错误"
			var depleted_names: Array[String] = []
			for d in critical_depleted:
				depleted_names.append(ResourceManager.resource_display_name(d))
			reason.description = "%s耗尽时，尚有%d个机器人空闲未派遣！" % ["、".join(depleted_names), idle_robots]
			reason.detail_lines.append("空闲机器人应当优先处理最危急的资源泄漏。")
			reason.detail_lines.append("当多个资源同时告急时，优先维护氧气和供水。")
			var was_solar_low = res_manager.get_value(ResourceManager.SOLAR) < 30.0
			if was_solar_low:
				reason.detail_lines.append("太阳能不足会降低维修速度，注意维护供电系统。")
			reason.suggestion = "始终优先处理氧气和供水泄漏，不要让机器人闲置。使用撤销按钮修正错误的派遣。"
		elif was_busy_elsewhere:
			reason.category = Category.PATH_BLOCKED
			reason.title = "资源调度不足"
			var busy_targets: Array[String] = []
			for r in robot_queue.get_all_robots():
				if r["status"] == "busy":
					busy_targets.append(ResourceManager.resource_display_name(r["target"]))
			var depleted_names: Array[String] = []
			for d in critical_depleted:
				depleted_names.append(ResourceManager.resource_display_name(d))
			reason.description = "%s耗尽时，所有机器人都在维修其他系统（%s）。" % ["、".join(depleted_names), "、".join(busy_targets)]
			reason.detail_lines.append("当前机器人数量不足以同时处理所有事故。")
			reason.detail_lines.append("需要更合理地安排维修优先级。")
			reason.suggestion = "注意观察事件预告，提前分配机器人。必要时撤销低优先级维修，优先处理危急事故。"
		else:
			reason.category = Category.RESOURCE_DEPLETED
			reason.title = "资源耗尽"
			var depleted_names: Array[String] = []
			for d in critical_depleted:
				depleted_names.append(ResourceManager.resource_display_name(d))
			reason.description = "%s已完全耗尽，温室无法继续运行。" % "、".join(depleted_names)
			reason.detail_lines.append("事故频率过高，维修速度跟不上资源流失。")
			reason.suggestion = "更积极地派遣机器人修复泄漏，减少资源的自然衰减。"
	else:
		reason.category = Category.RESOURCE_DEPLETED
		reason.title = "辅助资源耗尽"
		var depleted_names: Array[String] = []
		for d in depleted:
			depleted_names.append(ResourceManager.resource_display_name(d))
		reason.description = "%s耗尽，间接导致了系统崩溃。" % "、".join(depleted_names)
		reason.detail_lines.append("间接资源（太阳能、植物健康）的崩塌会加速关键资源的恶化。")
		reason.suggestion = "不要忽视辅助系统的维护，它们影响整体运行效率。"
	reason.detail_lines.append("")
	reason.detail_lines.append("── 资源最终状态 ──")
	for res in [ResourceManager.OXYGEN, ResourceManager.WATER, ResourceManager.SOLAR, ResourceManager.PLANT_HEALTH]:
		if res in level_config.unlocked_resources:
			var val = res_manager.get_value(res)
			var name = ResourceManager.resource_display_name(res)
			reason.detail_lines.append("  %s: %d%%" % [name, int(val)])
	var history = event_scheduler.get_event_history()
	if history.size() > 0:
		reason.detail_lines.append("")
		reason.detail_lines.append("── 近期事故记录 ──")
		var start_idx = maxi(0, history.size() - 5)
		for i in range(start_idx, history.size()):
			var h = history[i]
			reason.detail_lines.append("  ⚠ %s → %s (-%d)" % [h["event_name"], ResourceManager.resource_display_name(StringName(h["target_resource"])), int(h["damage"])])
	return reason

static func category_icon(cat: Category) -> String:
	match cat:
		Category.RESOURCE_DEPLETED: return "💀"
		Category.PATH_BLOCKED: return "🚧"
		Category.REPAIR_ORDER: return "⚠️"
		Category.TIME_OUT: return "⏰"
		_: return "❌"
