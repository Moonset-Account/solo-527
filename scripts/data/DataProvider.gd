extends RefCounted
## DataProvider - 关卡、机器、产品配置数据中心
## 提供静态数据访问接口，数值设计体现策略差异

class_name DataProvider

const MACHINE_TYPES := {
	"cutter": {
		"name": "切割机",
		"desc": "将原材料切割为标准部件。基础生产单元。",
		"base_cost": 80,
		"base_rate": 1.2,
		"power_usage": 5,
		"color": Color(0.82, 0.48, 0.27),
		"accent_color": Color(1.0, 0.78, 0.45),
		"inputs": [{"type": "raw_material", "count": 1}],
		"outputs": [{"type": "cut_part", "count": 1}],
		"tags": ["生产", "初级"],
		"category": "生产"
	},
	"assembler": {
		"name": "组装机",
		"desc": "将多个部件组装为半成品。中等效率，需要2种输入。",
		"base_cost": 220,
		"base_rate": 0.7,
		"power_usage": 12,
		"color": Color(0.42, 0.56, 0.89),
		"accent_color": Color(0.65, 0.82, 1.0),
		"inputs": [{"type": "cut_part", "count": 2}, {"type": "fastener", "count": 1}],
		"outputs": [{"type": "semi_assembly", "count": 1}],
		"tags": ["生产", "中级"],
		"category": "生产"
	},
	"forger": {
		"name": "锻造机",
		"desc": "高温锻造金属部件。高成本高产出，生产优质组件。",
		"base_cost": 450,
		"base_rate": 0.5,
		"power_usage": 25,
		"color": Color(0.82, 0.25, 0.25),
		"accent_color": Color(1.0, 0.55, 0.35),
		"inputs": [{"type": "raw_material", "count": 3}],
		"outputs": [{"type": "forged_part", "count": 1}],
		"tags": ["生产", "高级"],
		"category": "生产"
	},
	"finisher": {
		"name": "精加工",
		"desc": "表面处理与精细加工。将半成品转化为最终产品。",
		"base_cost": 380,
		"base_rate": 0.8,
		"power_usage": 18,
		"color": Color(0.48, 0.78, 0.45),
		"accent_color": Color(0.78, 1.0, 0.65),
		"inputs": [{"type": "semi_assembly", "count": 1}, {"type": "forged_part", "count": 1}],
		"outputs": [{"type": "finished_product", "count": 1}],
		"tags": ["生产", "高级"],
		"category": "生产"
	},
	"conveyor": {
		"name": "传送带",
		"desc": "连接机器，运输中间产品。运输速度决定流水线效率。",
		"base_cost": 30,
		"base_rate": 2.0,
		"power_usage": 2,
		"color": Color(0.5, 0.5, 0.55),
		"accent_color": Color(0.8, 0.8, 0.85),
		"is_transport": true,
		"transfer_speed": 1.0,
		"tags": ["运输"],
		"category": "运输"
	},
	"quality": {
		"name": "质检点",
		"desc": "检测产品合格率。增加订单奖励20%，有小概率拒绝次品。",
		"base_cost": 200,
		"base_rate": 0.9,
		"power_usage": 8,
		"color": Color(0.25, 0.75, 0.6),
		"accent_color": Color(0.55, 1.0, 0.85),
		"bonus_reward_rate": 0.2,
		"reject_chance": 0.08,
		"tags": ["质检"],
		"category": "质检"
	},
	"storage": {
		"name": "仓储站",
		"desc": "临时存储缓冲，防止流水线堵塞。增加5格中间库存。",
		"base_cost": 120,
		"base_rate": 1.5,
		"power_usage": 3,
		"color": Color(0.75, 0.65, 0.35),
		"accent_color": Color(1.0, 0.92, 0.55),
		"storage_capacity": 20,
		"tags": ["仓储"],
		"category": "仓储"
	}
}

const PRODUCT_TYPES := {
	"raw_material": {"name": "原料", "value": 5, "tier": 0, "color": Color(0.6, 0.4, 0.25)},
	"cut_part": {"name": "切削件", "value": 18, "tier": 1, "color": Color(0.82, 0.55, 0.3)},
	"fastener": {"name": "紧固件", "value": 8, "tier": 0, "color": Color(0.55, 0.55, 0.6)},
	"semi_assembly": {"name": "半组装件", "value": 55, "tier": 2, "color": Color(0.45, 0.6, 0.95)},
	"forged_part": {"name": "锻造件", "value": 42, "tier": 1, "color": Color(0.9, 0.35, 0.25)},
	"finished_product": {"name": "成品", "value": 180, "tier": 3, "color": Color(0.45, 0.85, 0.5)}
}

const LEVELS := {
	"level_1": {
		"name": "第1关 - 新手车间",
		"desc": "熟悉基本操作：放置切割机和传送带，完成5个简单订单。",
		"unlock_level": 1,
		"start_money": 600,
		"target_orders": 5,
		"time_limit_seconds": 0,
		"grid_size": Vector2i(12, 7),
		"available_machines": ["cutter", "conveyor", "storage"],
		"spawn_points": [Vector2i(0, 3)],
		"delivery_points": [Vector2i(11, 3)],
		"order_pool": ["order_simple_1", "order_simple_2"],
		"max_concurrent_orders": 3,
		"order_spawn_interval": [12, 20],
		"bonus_objectives": [
			{"id": "no_fail", "desc": "不失败任何订单", "reward": 200},
			{"id": "speed", "desc": "5分钟内完成", "reward": 150}
		]
	},
	"level_2": {
		"name": "第2关 - 组装线启动",
		"desc": "解锁组装机。生产半组装件，优化传送带布局。",
		"unlock_level": 2,
		"start_money": 800,
		"target_orders": 8,
		"time_limit_seconds": 0,
		"grid_size": Vector2i(13, 8),
		"available_machines": ["cutter", "assembler", "conveyor", "quality", "storage"],
		"spawn_points": [Vector2i(0, 2), Vector2i(0, 5)],
		"delivery_points": [Vector2i(12, 4)],
		"order_pool": ["order_medium_1", "order_medium_2", "order_simple_2"],
		"max_concurrent_orders": 4,
		"order_spawn_interval": [10, 18],
		"bonus_objectives": [
			{"id": "use_quality", "desc": "放置至少1个质检点", "reward": 250}
		]
	},
	"level_3": {
		"name": "第3关 - 重工业锻造",
		"desc": "解锁锻造机与精加工。生产高端成品，平衡多条流水线。",
		"unlock_level": 4,
		"start_money": 1500,
		"target_orders": 12,
		"time_limit_seconds": 480,
		"grid_size": Vector2i(14, 8),
		"available_machines": ["cutter", "assembler", "forger", "finisher", "conveyor", "quality", "storage"],
		"spawn_points": [Vector2i(0, 1), Vector2i(0, 4), Vector2i(0, 6)],
		"delivery_points": [Vector2i(13, 3), Vector2i(13, 5)],
		"order_pool": ["order_hard_1", "order_hard_2", "order_medium_2"],
		"max_concurrent_orders": 5,
		"order_spawn_interval": [8, 15],
		"bonus_objectives": [
			{"id": "all_machines", "desc": "使用所有种类的生产机器", "reward": 400},
			{"id": "time_attack", "desc": "6分钟内完成", "reward": 500}
		]
	},
	"level_4": {
		"name": "第4关 - 精密工厂",
		"desc": "限时挑战！最大化产出的同时保证质量。",
		"unlock_level": 7,
		"start_money": 2500,
		"target_orders": 20,
		"time_limit_seconds": 600,
		"grid_size": Vector2i(14, 9),
		"available_machines": ["cutter", "assembler", "forger", "finisher", "conveyor", "quality", "storage"],
		"spawn_points": [Vector2i(0, 0), Vector2i(0, 3), Vector2i(0, 6), Vector2i(0, 8)],
		"delivery_points": [Vector2i(13, 2), Vector2i(13, 5), Vector2i(13, 7)],
		"order_pool": ["order_hard_1", "order_hard_2", "order_hard_3"],
		"max_concurrent_orders": 6,
		"order_spawn_interval": [6, 12],
		"bonus_objectives": [
			{"id": "perfect_streak", "desc": "连续完成15单不失败", "reward": 800}
		]
	}
}

const ORDER_TEMPLATES := {
	"order_simple_1": {
		"name": "基础切削件采购",
		"requirements": [{"type": "cut_part", "count": 3}],
		"base_reward": 120,
		"time_limit": 60,
		"xp_bonus": 10,
		"difficulty": 1
	},
	"order_simple_2": {
		"name": "标准组件订单",
		"requirements": [{"type": "cut_part", "count": 5}],
		"base_reward": 200,
		"time_limit": 75,
		"xp_bonus": 15,
		"difficulty": 1
	},
	"order_medium_1": {
		"name": "半组装件批量",
		"requirements": [{"type": "semi_assembly", "count": 2}, {"type": "cut_part", "count": 3}],
		"base_reward": 450,
		"time_limit": 120,
		"xp_bonus": 30,
		"difficulty": 2
	},
	"order_medium_2": {
		"name": "锻造件合同",
		"requirements": [{"type": "forged_part", "count": 3}],
		"base_reward": 420,
		"time_limit": 100,
		"xp_bonus": 25,
		"difficulty": 2
	},
	"order_hard_1": {
		"name": "成品大单",
		"requirements": [{"type": "finished_product", "count": 2}],
		"base_reward": 900,
		"time_limit": 180,
		"xp_bonus": 60,
		"difficulty": 3
	},
	"order_hard_2": {
		"name": "综合交付单",
		"requirements": [{"type": "finished_product", "count": 1}, {"type": "semi_assembly", "count": 2}, {"type": "forged_part", "count": 2}],
		"base_reward": 1500,
		"time_limit": 240,
		"xp_bonus": 100,
		"difficulty": 3
	},
	"order_hard_3": {
		"name": "VIP订单",
		"requirements": [{"type": "finished_product", "count": 4}],
		"base_reward": 2000,
		"time_limit": 300,
		"xp_bonus": 150,
		"difficulty": 4
	}
}

static func get_machine_config(machine_type: String) -> Dictionary:
	return MACHINE_TYPES.get(machine_type, {})

static func get_product_config(product_type: String) -> Dictionary:
	return PRODUCT_TYPES.get(product_type, {})

static func get_level_config(level_id: String) -> Dictionary:
	return LEVELS.get(level_id, {})

static func get_order_template(order_id: String) -> Dictionary:
	return ORDER_TEMPLATES.get(order_id, {})

static func get_all_level_ids() -> Array:
	var ids: Array = []
	for key in LEVELS.keys():
		ids.append(key)
	ids.sort()
	return ids

static func get_machines_by_category(category: String) -> Array:
	var result: Array = []
	for key in MACHINE_TYPES.keys():
		if MACHINE_TYPES[key].get("category", "") == category:
			result.append(key)
	return result

static func get_all_machine_categories() -> Array:
	return ["生产", "运输", "质检", "仓储"]

static func generate_random_order(level_id: String) -> Dictionary:
	var level_cfg: Dictionary = get_level_config(level_id)
	if level_cfg.is_empty():
		return {}
	var pool: Array = level_cfg.get("order_pool", [])
	if pool.is_empty():
		return {}
	var chosen: String = pool[randi() % pool.size()]
	var template: Dictionary = get_order_template(chosen).duplicate(true)
	template["id"] = "order_%d_%d" % [Time.get_ticks_msec(), randi()]
	template["template_id"] = chosen
	template["spawn_time"] = Time.get_unix_time_from_system()
	var diff_multiplier: float = 1.0 + float(GameState.level - 1) * 0.05
	template["base_reward"] = int(template.get("base_reward", 100) * diff_multiplier)
	template["time_limit"] = int(template.get("time_limit", 60) * (1.0 + float(GameState.level - 1) * 0.02))
	template["remaining_time"] = template["time_limit"]
	template["current_progress"] = {}
	for req in template.get("requirements", []):
		template["current_progress"][req["type"]] = 0
	template["is_completed"] = false
	template["is_failed"] = false
	return template

static func calculate_order_reward(order: Dictionary, has_quality_bonus: bool) -> int:
	var base: int = order.get("base_reward", 0)
	if has_quality_bonus:
		base = int(base * 1.2)
	var time_ratio: float = float(order.get("remaining_time", 0)) / float(max(order.get("time_limit", 1), 1))
	var time_bonus: float = 1.0 + time_ratio * 0.3
	return int(base * time_bonus)

static func get_available_levels(player_level: int) -> Array:
	var result: Array = []
	for id in LEVELS.keys():
		var cfg: Dictionary = LEVELS[id]
		if cfg.get("unlock_level", 1) <= player_level:
			result.append(id)
	result.sort()
	return result
