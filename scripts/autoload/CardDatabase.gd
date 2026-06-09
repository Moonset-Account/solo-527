extends Node
## 卡牌数据库 - 存放所有卡牌定义
## 卡牌分三类：修复工具卡、预算卡、专家卡
## 每类卡内部有不同机制：连击、协同、回合效果、费用优化等

enum CardType { TOOL, BUDGET, EXPERT }
enum Rarity { COMMON, RARE, EPIC, LEGENDARY }

## 卡牌表：id -> { 类型, 稀有度, 费用, 名称, 描述, 效果字典, 策略标签 }
const CARDS: Dictionary = {
	## ============== 初始基础卡（新手友好，数值平衡） ==============
	"tool_basic_brush": {
		"id": "tool_basic_brush", "name": "基础画笔", "type": CardType.TOOL,
		"rarity": Rarity.COMMON, "cost": 1,
		"desc": "对目标展品修复 +3。",
		"effect": { "restore": 3, "target": "single" },
		"tags": ["基础", "单修"],
		"art": "res://assets/art/cards/tool_brush.png",
	},
	"tool_cleaning_cloth": {
		"id": "tool_cleaning_cloth", "name": "专业软布", "type": CardType.TOOL,
		"rarity": Rarity.COMMON, "cost": 1,
		"desc": "清洁：修复 +2，并移除 1 层『污渍』。",
		"effect": { "restore": 2, "remove_status": "dirt", "remove_count": 1, "target": "single" },
		"tags": ["基础", "去污"],
		"art": "res://assets/art/cards/tool_cloth.png",
	},
	"tool_small_patch": {
		"id": "tool_small_patch", "name": "迷你补片", "type": CardType.TOOL,
		"rarity": Rarity.COMMON, "cost": 0,
		"desc": "修复 +1。回合结束前，再抽到『工具卡』时额外 +1。",
		"effect": { "restore": 1, "status": "tool_boost", "status_value": 1, "duration": 1 },
		"tags": ["0费", "连击"],
		"art": "res://assets/art/cards/tool_patch.png",
	},
	"budget_government_grant": {
		"id": "budget_government_grant", "name": "政府拨款", "type": CardType.BUDGET,
		"rarity": Rarity.COMMON, "cost": 0,
		"desc": "获得 +2 预算。",
		"effect": { "gain_budget": 2 },
		"tags": ["基础", "加预算"],
		"art": "res://assets/art/cards/budget_grant.png",
	},
	"budget_sponsorship": {
		"id": "budget_sponsorship", "name": "企业赞助", "type": CardType.BUDGET,
		"rarity": Rarity.COMMON, "cost": 1,
		"desc": "获得 +3 预算，下回合起始再 +1。",
		"effect": { "gain_budget": 3, "next_turn_budget": 1 },
		"tags": ["延期收益"],
		"art": "res://assets/art/cards/budget_sponsor.png",
	},
	"expert_apprentice": {
		"id": "expert_apprentice", "name": "学徒助手", "type": CardType.EXPERT,
		"rarity": Rarity.COMMON, "cost": 1,
		"desc": "抽 1 张牌。本回合每打一张工具卡后再抽 1 张（上限 2）。",
		"effect": { "draw": 1, "status": "tool_draw", "status_value": 2, "duration": 1 },
		"tags": ["过牌", "协同"],
		"art": "res://assets/art/cards/expert_apprentice.png",
	},

	## ============== 稀有卡（解锁后改变构筑策略） ==============
	"tool_laser_cleaner": {
		"id": "tool_laser_cleaner", "name": "激光清洁仪", "type": CardType.TOOL,
		"rarity": Rarity.RARE, "cost": 2,
		"desc": "修复 +4。移除目标身上所有负面状态。",
		"effect": { "restore": 4, "remove_all_status": true, "target": "single" },
		"tags": ["清状态", "强力单修"],
		"art": "res://assets/art/cards/tool_laser.png",
		"unlock_after": "level_1_2",
	},
	"tool_xray_scan": {
		"id": "tool_xray_scan", "name": "X光扫描", "type": CardType.TOOL,
		"rarity": Rarity.RARE, "cost": 1,
		"desc": "揭示展品隐患：修复 +1。下次对该展品修复翻倍。",
		"effect": { "restore": 1, "status_on_target": "vulnerable", "status_value": 1, "target": "single" },
		"tags": ["翻倍", "铺垫"],
		"art": "res://assets/art/cards/tool_xray.png",
		"unlock_after": "level_1_2",
	},
	"tool_multi_restorer": {
		"id": "tool_multi_restorer", "name": "多用修复台", "type": CardType.TOOL,
		"rarity": Rarity.RARE, "cost": 2,
		"desc": "对所有展品修复 +2。",
		"effect": { "restore": 2, "target": "all" },
		"tags": ["群修"],
		"art": "res://assets/art/cards/tool_multi.png",
		"unlock_after": "level_1_3",
	},
	"budget_endowment_fund": {
		"id": "budget_endowment_fund", "name": "捐赠基金", "type": CardType.BUDGET,
		"rarity": Rarity.RARE, "cost": 2,
		"desc": "获得 +1 预算，且之后每回合起始永久 +1 预算。",
		"effect": { "gain_budget": 1, "permanent_budget": 1 },
		"tags": ["永久成长", "经济引擎"],
		"art": "res://assets/art/cards/budget_fund.png",
		"unlock_after": "level_1_3",
	},
	"budget_crowdfunding": {
		"id": "budget_crowdfunding", "name": "大众众筹", "type": CardType.BUDGET,
		"rarity": Rarity.RARE, "cost": 1,
		"desc": "弃 1 张牌，获得 +4 预算，抽 1 张牌。",
		"effect": { "gain_budget": 4, "discard": 1, "draw": 1 },
		"tags": ["弃牌流", "循环"],
		"art": "res://assets/art/cards/budget_crowd.png",
		"unlock_after": "chapter_2_start",
	},
	"expert_restoration_artist": {
		"id": "expert_restoration_artist", "name": "修复艺术家", "type": CardType.EXPERT,
		"rarity": Rarity.RARE, "cost": 2,
		"desc": "下 2 张工具卡费用 -1（最低 0）且效果 +1。",
		"effect": { "status": "tool_discount", "status_value": 2, "bonus_restore": 1, "duration": 2 },
		"tags": ["减费", "增伤"],
		"art": "res://assets/art/cards/expert_artist.png",
		"unlock_after": "level_2_1",
	},
	"expert_chemist": {
		"id": "expert_chemist", "name": "化学专家", "type": CardType.EXPERT,
		"rarity": Rarity.RARE, "cost": 2,
		"desc": "移除所有展品的 2 层负面状态。所有展品修复 +1。",
		"effect": { "remove_status_all": "dirt", "remove_count": 2, "restore_all": 1 },
		"tags": ["群去污"],
		"art": "res://assets/art/cards/expert_chemist.png",
		"unlock_after": "level_2_2",
	},

	## ============== 史诗/传说卡（高战略权重） ==============
	"tool_vr_reconstruction": {
		"id": "tool_vr_reconstruction", "name": "VR 数字重建", "type": CardType.TOOL,
		"rarity": Rarity.EPIC, "cost": 3,
		"desc": "修复 +8。若目标已修复 ≥50%，额外 +5。",
		"effect": { "restore": 8, "bonus_if_threshold": 50, "bonus_restore": 5, "target": "single" },
		"tags": ["爆发", "处决"],
		"art": "res://assets/art/cards/tool_vr.png",
		"unlock_after": "level_2_3",
	},
	"budget_legacy_donation": {
		"id": "budget_legacy_donation", "name": "遗产捐赠", "type": CardType.BUDGET,
		"rarity": Rarity.EPIC, "cost": 3,
		"desc": "立即 +8 预算；牌库中每张预算卡再 +1 预算。",
		"effect": { "gain_budget": 8, "budget_per_card_type": CardType.BUDGET, "extra_budget": 1, "count_from": "deck" },
		"tags": ["爆发经济"],
		"art": "res://assets/art/cards/budget_legacy.png",
		"unlock_after": "chapter_3_start",
	},
	"expert_chief_curator": {
		"id": "expert_chief_curator", "name": "首席策展人", "type": CardType.EXPERT,
		"rarity": Rarity.LEGENDARY, "cost": 3,
		"desc": "抽 3 张牌，获得 +3 预算。本回合所有卡费用 -1。",
		"effect": { "draw": 3, "gain_budget": 3, "status": "global_discount", "status_value": 1, "duration": 1 },
		"tags": ["万能", "核心引擎"],
		"art": "res://assets/art/cards/expert_curator.png",
		"unlock_after": "level_3_2",
	},
}

func get_card(card_id: String) -> Dictionary:
	if not card_id in CARDS:
		return {}
	return CARDS[card_id].duplicate(true)

func card_exists(card_id: String) -> bool:
	return card_id in CARDS

func get_cards_by_type(t: int) -> Array:
	var arr: Array = []
	for id in CARDS:
		if CARDS[id].type == t:
			arr.append(id)
	return arr

func get_cards_by_rarity(r: int) -> Array:
	var arr: Array = []
	for id in CARDS:
		if CARDS[id].rarity == r:
			arr.append(id)
	return arr

func get_default_deck() -> Array:
	return [
		"tool_basic_brush", "tool_basic_brush", "tool_basic_brush", "tool_basic_brush",
		"tool_cleaning_cloth", "tool_cleaning_cloth", "tool_cleaning_cloth",
		"tool_small_patch", "tool_small_patch",
		"budget_government_grant", "budget_government_grant", "budget_government_grant",
		"budget_sponsorship", "budget_sponsorship",
		"expert_apprentice", "expert_apprentice",
	]

func get_default_collection() -> Array:
	var arr: Array = []
	for id in CARDS:
		if not CARDS[id].has("unlock_after"):
			arr.append(id)
	return arr

func get_unlock_rewards_for(trigger_id: String) -> Array:
	var arr: Array = []
	for id in CARDS:
		if CARDS[id].get("unlock_after", "") == trigger_id:
			arr.append(id)
	return arr

func get_random_unlockable(count: int, exclude: Array = []) -> Array:
	var pool: Array = []
	for id in CARDS:
		if not id in exclude and CARDS[id].rarity >= Rarity.RARE:
			pool.append(id)
	pool.shuffle()
	return pool.slice(0, min(count, pool.size()))

func rarity_color(rarity: int) -> Color:
	match rarity:
		Rarity.COMMON: return Color(0.8, 0.8, 0.85, 1)
		Rarity.RARE: return Color(0.3, 0.6, 1.0, 1)
		Rarity.EPIC: return Color(0.8, 0.3, 0.9, 1)
		Rarity.LEGENDARY: return Color(1.0, 0.8, 0.2, 1)
	return Color.WHITE

func type_color(t: int) -> Color:
	match t:
		CardType.TOOL: return Color(0.35, 0.75, 0.55, 1)
		CardType.BUDGET: return Color(0.95, 0.75, 0.3, 1)
		CardType.EXPERT: return Color(0.55, 0.6, 0.95, 1)
	return Color.GRAY

func type_name(t: int) -> String:
	match t:
		CardType.TOOL: return "修复工具"
		CardType.BUDGET: return "预算"
		CardType.EXPERT: return "专家"
	return ""

func get_all_card_ids() -> Array:
	var arr: Array = []
	for id in CARDS:
		arr.append(id)
	return arr
