extends Node
## 卡牌注册表 - 管理所有卡牌定义
## 可扩展：新增卡牌只需在 CARD_DEFINITIONS 中添加条目
## 设计原则：新卡解锁服务策略变化，而非纯数值堆叠

enum CardType {
	TOOL,
	BUDGET,
	EXPERT
}

enum Rarity {
	COMMON,
	UNCOMMON,
	RARE,
	LEGENDARY
}

const CARDTYPE_STR: Dictionary = {
	CardType.TOOL: "tool",
	CardType.BUDGET: "budget",
	CardType.EXPERT: "expert"
}

const RARITY_STR: Dictionary = {
	Rarity.COMMON: "common",
	Rarity.UNCOMMON: "uncommon",
	Rarity.RARE: "rare",
	Rarity.LEGENDARY: "legendary"
}

const CARD_DEFINITIONS: Dictionary = {
	"brush_basic": {
		"id": "brush_basic",
		"name": "基础修复刷",
		"type": CardType.TOOL,
		"rarity": Rarity.COMMON,
		"cost": {"budget": 1},
		"requires_target": true,
		"target_filter": "all",
		"effects": [
			{"type": "repair_progress", "value": 12}
		],
		"description": "对目标展品修复进度 +12",
		"flavor_text": "最基础的清理工具，人人能用。",
		"starter_card": true,
		"starter_copies": 2,
		"strategy_hint": "稳定的小额修复，适合补刀"
	},
	"solvent_application": {
		"id": "solvent_application",
		"name": "溶剂清理",
		"type": CardType.TOOL,
		"rarity": Rarity.COMMON,
		"cost": {"budget": 2},
		"requires_target": true,
		"target_filter": "damaged",
		"effects": [
			{"type": "repair_progress", "value": 10},
			{"type": "restore_condition", "value": 15}
		],
		"description": "修复进度 +10，完好度 +15。仅可用于损坏展品。",
		"flavor_text": "温和溶解表面污渍，让展品重现光泽。",
		"starter_card": true,
		"starter_copies": 2,
		"strategy_hint": "高损坏展品优先使用，止损+修复双效"
	},
	"precision_laser": {
		"id": "precision_laser",
		"name": "精密激光仪",
		"type": CardType.TOOL,
		"rarity": Rarity.RARE,
		"cost": {"budget": 3, "tools": 1},
		"requires_target": true,
		"target_filter": "all",
		"effects": [
			{"type": "repair_progress", "value": 35}
		],
		"description": "修复进度 +35",
		"flavor_text": "高精度激光清理，适用于珍贵文物。",
		"strategy_hint": "单卡爆发，适合给快满进度的展品收尾"
	},
	"ultrasonic_cleaner": {
		"id": "ultrasonic_cleaner",
		"name": "超声波清洗器",
		"type": CardType.TOOL,
		"rarity": Rarity.UNCOMMON,
		"cost": {"budget": 3},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "repair_progress", "value": 10, "affects_all": true}
		],
		"description": "所有展品修复进度 +10",
		"flavor_text": "批量处理的好帮手。",
		"strategy_hint": "多展品关卡的AOE修复，配合进度策略"
	},
	"xray_analysis": {
		"id": "xray_analysis",
		"name": "X光探伤分析",
		"type": CardType.TOOL,
		"rarity": Rarity.UNCOMMON,
		"cost": {"budget": 2},
		"requires_target": true,
		"target_filter": "progress_low",
		"effects": [
			{"type": "repair_progress", "value": 8},
			{"type": "reduce_damage", "value": 3}
		],
		"description": "对修复进度<50%的展品：修复+8，每回合损坏-3",
		"flavor_text": "了解问题才能解决问题。",
		"strategy_hint": "开局就给高损坏展品套上，长线收益大"
	},
	"adhesive_restoration": {
		"id": "adhesive_restoration",
		"name": "粘合剂修复",
		"type": CardType.TOOL,
		"rarity": Rarity.UNCOMMON,
		"cost": {"budget": 2, "tools": 1},
		"requires_target": true,
		"target_filter": "damaged",
		"effects": [
			{"type": "restore_condition", "value": 30},
			{"type": "repair_progress", "value": 8}
		],
		"description": "完好度 +30，修复进度 +8",
		"flavor_text": "对破碎展品的抢救性修复。",
		"strategy_hint": "快损坏的展品救急，防止展品失败"
	},
	"government_grant": {
		"id": "government_grant",
		"name": "政府专项拨款",
		"type": CardType.BUDGET,
		"rarity": Rarity.COMMON,
		"cost": {},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "gain_resource", "resource": "budget", "value": 3}
		],
		"description": "立即获得 +3 预算",
		"flavor_text": "文物保护事业需要全社会支持。",
		"starter_card": true,
		"starter_copies": 2,
		"strategy_hint": "资源卡中的核心，让你多打1-2张卡"
	},
	"sponsor_donation": {
		"id": "sponsor_donation",
		"name": "企业赞助",
		"type": CardType.BUDGET,
		"rarity": Rarity.UNCOMMON,
		"cost": {},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "gain_resource", "resource": "budget", "value": 2},
			{"type": "draw_cards", "value": 1}
		],
		"description": "+2 预算，抽 1 张牌",
		"flavor_text": "企业的名字将出现在感谢墙上。",
		"strategy_hint": "预算+过牌双效，润滑卡组循环"
	},
	"crowdfunding": {
		"id": "crowdfunding",
		"name": "众筹项目",
		"type": CardType.BUDGET,
		"rarity": Rarity.RARE,
		"cost": {},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "gain_resource", "resource": "budget", "value": 1},
			{"type": "gain_resource", "resource": "tools", "value": 1},
			{"type": "draw_cards", "value": 2}
		],
		"description": "+1 预算，+1 修复工具，抽 2 张牌",
		"flavor_text": "每一位捐赠者都是文化守护者。",
		"strategy_hint": "万能润滑卡，所有资源都来点"
	},
	"annual_budget_increase": {
		"id": "annual_budget_increase",
		"name": "年度预算增长",
		"type": CardType.BUDGET,
		"rarity": Rarity.UNCOMMON,
		"cost": {"budget": 1},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "extra_budget_next_turn", "value": 1}
		],
		"description": "每回合永久 +1 预算（永久效果）",
		"flavor_text": "今年的表现不错，明年预算更多。",
		"strategy_hint": "越早打出收益越高，长线核心"
	},
	"equipment_supply": {
		"id": "equipment_supply",
		"name": "设备补给",
		"type": CardType.BUDGET,
		"rarity": Rarity.COMMON,
		"cost": {},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "gain_resource", "resource": "tools", "value": 2}
		],
		"description": "获得 +2 修复工具",
		"flavor_text": "刷子、胶水、溶剂都得备齐。",
		"starter_card": true,
		"starter_copies": 1,
		"strategy_hint": "为高cost工具卡/专家卡储备资源"
	},
	"senior_consultant": {
		"id": "senior_consultant",
		"name": "资深顾问",
		"type": CardType.EXPERT,
		"rarity": Rarity.UNCOMMON,
		"cost": {"budget": 1},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "gain_resource", "resource": "experts", "value": 1}
		],
		"description": "获得 +1 专家（本场永久）",
		"flavor_text": "几十年的经验，一眼就能看出问题所在。",
		"strategy_hint": "专家牌的核心引擎，越早出越强"
	},
	"restoration_master": {
		"id": "restoration_master",
		"name": "修复大师",
		"type": CardType.EXPERT,
		"rarity": Rarity.RARE,
		"cost": {"budget": 2, "experts": 1},
		"requires_target": true,
		"target_filter": "all",
		"effects": [
			{"type": "repair_progress", "value": 15, "scale_with": "expert_count", "multiplier": 8}
		],
		"description": "修复进度 15 + (8 × 专家数)",
		"flavor_text": "大师一出手，就知有没有。",
		"strategy_hint": "专家流核心输出，配合资深顾问威力倍增"
	},
	"conservation_team": {
		"id": "conservation_team",
		"name": "文保团队协作",
		"type": CardType.EXPERT,
		"rarity": Rarity.UNCOMMON,
		"cost": {"budget": 2, "experts": 1},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "repair_progress", "value": 8, "affects_all": true, "scale_with": "expert_count", "multiplier": 3}
		],
		"description": "所有展品修复进度 8 + (3 × 专家数)",
		"flavor_text": "众人拾柴火焰高。",
		"strategy_hint": "专家流的AOE，多展品关卡清场"
	},
	"time_extension": {
		"id": "time_extension",
		"name": "展览延期申请",
		"type": CardType.EXPERT,
		"rarity": Rarity.UNCOMMON,
		"cost": {"budget": 2, "experts": 1},
		"requires_target": true,
		"target_filter": "all",
		"effects": [
			{"type": "delay_timer", "value": 3}
		],
		"description": "目标展品的限时倒计时 +3 回合",
		"flavor_text": "争取时间，就是挽救文化。",
		"starter_card": false,
		"strategy_hint": "限时关卡的救命稻草，保住即将失败的展品"
	},
	"heritage_network": {
		"id": "heritage_network",
		"name": "遗产保护网络",
		"type": CardType.EXPERT,
		"rarity": Rarity.RARE,
		"cost": {"budget": 3},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "gain_resource", "resource": "experts", "value": 2},
			{"type": "reduce_damage", "value": 2, "affects_all": true}
		],
		"description": "+2 专家，所有展品每回合损坏 -2",
		"flavor_text": "全球文保机构的支援网络。",
		"strategy_hint": "顶级专家+全场减伤，后期防守核心"
	},
	"artifact_authentication": {
		"id": "artifact_authentication",
		"name": "文物鉴定",
		"type": CardType.EXPERT,
		"rarity": Rarity.COMMON,
		"cost": {"budget": 1},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "draw_cards", "value": 2}
		],
		"description": "抽 2 张牌",
		"flavor_text": "明确年代和工艺，修复才能事半功倍。",
		"starter_card": true,
		"starter_copies": 1,
		"strategy_hint": "纯过牌，润滑任何卡组构筑"
	},
	"vacuum_cleaning": {
		"id": "vacuum_cleaning",
		"name": "真空除尘",
		"type": CardType.TOOL,
		"rarity": Rarity.COMMON,
		"cost": {"budget": 1},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "repair_progress", "value": 6, "affects_all": true}
		],
		"description": "所有展品修复进度 +6",
		"flavor_text": "温和的真空吸尘，不会损伤表面。",
		"starter_card": true,
		"starter_copies": 2,
		"strategy_hint": "廉价AOE，前期稳定铺进度"
	},
	"humidity_control": {
		"id": "humidity_control",
		"name": "环境湿度调控",
		"type": CardType.TOOL,
		"rarity": Rarity.UNCOMMON,
		"cost": {"budget": 2, "tools": 1},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "reduce_damage", "value": 2, "affects_all": true},
			{"type": "restore_condition", "value": 8, "affects_all": true}
		],
		"description": "所有展品：每回合损坏 -2，完好度 +8",
		"flavor_text": "稳定的环境是最好的保护。",
		"strategy_hint": "全场环境buff，长线防守必带"
	},
	"rare_material_patron": {
		"id": "rare_material_patron",
		"name": "稀有材料赞助人",
		"type": CardType.BUDGET,
		"rarity": Rarity.RARE,
		"cost": {"budget": 1},
		"requires_target": false,
		"target_filter": "all",
		"effects": [
			{"type": "gain_resource", "resource": "tools", "value": 3},
			{"type": "gain_resource", "resource": "experts", "value": 1}
		],
		"description": "+3 修复工具，+1 专家",
		"flavor_text": "\"这件文物的修复，我来赞助材料。\"",
		"strategy_hint": "中期爆发式资源注入，衔接专家流"
	}
}

var _card_cache: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_cache()

func _build_cache() -> void:
	for card_id in CARD_DEFINITIONS:
		var data: Dictionary = CARD_DEFINITIONS[card_id]
		if data.get("id", "") != card_id:
			push_warning("CardRegistry: Card '%s' id mismatch" % card_id)
		_card_cache[card_id] = data

func get_card(card_id: String) -> Dictionary:
	if not _card_cache.has(card_id):
		push_warning("CardRegistry: Unknown card '%s'" % card_id)
		return {}
	return (_card_cache[card_id] as Dictionary).duplicate(true)

func get_all_card_ids() -> Array:
	return _card_cache.keys()

func get_starter_deck_ids() -> Array:
	var starter: Array = []
	for card_id in CARD_DEFINITIONS:
		var data: Dictionary = CARD_DEFINITIONS[card_id]
		if data.get("starter_card", false):
			var copies: int = data.get("starter_copies", 2)
			for i in range(copies):
				starter.append(card_id)
	if starter.is_empty():
		starter = [
			"brush_basic", "brush_basic",
			"solvent_application", "solvent_application",
			"government_grant", "government_grant",
			"equipment_supply",
			"artifact_authentication",
			"vacuum_cleaning", "vacuum_cleaning"
		]
	return starter

func get_reward_pool(level_difficulty: String = "normal") -> Array:
	var pool: Array = []
	var rarity_weight: Dictionary = {
		"easy": {Rarity.COMMON: 6, Rarity.UNCOMMON: 3, Rarity.RARE: 1},
		"normal": {Rarity.COMMON: 4, Rarity.UNCOMMON: 4, Rarity.RARE: 2},
		"hard": {Rarity.COMMON: 2, Rarity.UNCOMMON: 4, Rarity.RARE: 3, Rarity.LEGENDARY: 1}
	}
	var weights: Dictionary = rarity_weight.get(level_difficulty, rarity_weight.normal)
	
	for card_id in CARD_DEFINITIONS:
		var data: Dictionary = CARD_DEFINITIONS[card_id]
		if data.get("starter_card", false):
			continue
		var rarity: String = data.get("rarity", Rarity.COMMON)
		if weights.has(rarity):
			for i in range(weights[rarity]):
				pool.append(card_id)
	return pool

func draw_reward_cards(count: int, difficulty: String = "normal") -> Array:
	var pool: Array = get_reward_pool(difficulty)
	pool.shuffle()
	var result: Array = []
	var added: Dictionary = {}
	for card_id in pool:
		if result.size() >= count:
			break
		if added.has(card_id):
			continue
		added[card_id] = true
		result.append(card_id)
	return result

func get_cards_by_type(type_val: int) -> Array:
	var result: Array = []
	for card_id in CARD_DEFINITIONS:
		var data: Dictionary = CARD_DEFINITIONS[card_id]
		if data.get("type", -1) == type_val:
			result.append(card_id)
	return result

func get_card_type_color(type_val: int) -> Color:
	match type_val:
		CardType.TOOL:
			return Color(0.35, 0.55, 0.85)
		CardType.BUDGET:
			return Color(0.85, 0.65, 0.25)
		CardType.EXPERT:
			return Color(0.6, 0.35, 0.75)
		_:
			return Color(0.7, 0.7, 0.7)

func get_rarity_color(rarity_val: int) -> Color:
	match rarity_val:
		Rarity.COMMON:
			return Color(0.65, 0.65, 0.65)
		Rarity.UNCOMMON:
			return Color(0.2, 0.7, 0.3)
		Rarity.RARE:
			return Color(0.2, 0.5, 0.9)
		Rarity.LEGENDARY:
			return Color(0.95, 0.65, 0.1)
		_:
			return Color.WHITE
