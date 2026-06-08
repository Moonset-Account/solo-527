extends Node
## 关卡注册表 - 管理所有章节、关卡配置
## 可扩展：新增关卡只需在 LEVEL_DEFINITIONS 中添加条目

const LEVEL_DEFINITIONS: Dictionary = {
	"level_1_1": {
		"id": "level_1_1",
		"chapter_id": "chapter_1",
		"name": "第一章：青铜展厅 - 入门",
		"description": "三件青铜器需要紧急修复。熟悉基础工具，合理分配预算。",
		"difficulty": "easy",
		"scene_name": "BattleScene",
		"max_turns": 10,
		"budget_per_turn": 3,
		"starting_budget": 0,
		"starting_tools": 2,
		"starting_experts": 0,
		"required_exhibits": 3,
		"allowed_failures": 0,
		"reward_cards_count": 3,
		"reward_difficulty": "easy",
		"unlock_chapter": "",
		"exhibits": [
			{
				"id": "bronze_ding",
				"name": "青铜鼎",
				"description": "周代青铜礼器，表面有氧化锈蚀。",
				"category": "bronze",
				"tags": ["metal", "large"],
				"repair_target": 60,
				"max_condition": 100,
				"start_condition": 70,
				"damage_per_turn": 3,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 2}
			},
			{
				"id": "bronze_jue",
				"name": "青铜爵",
				"description": "商代酒器，纹饰精美但有轻微破损。",
				"category": "bronze",
				"tags": ["metal", "small"],
				"repair_target": 45,
				"max_condition": 100,
				"start_condition": 85,
				"damage_per_turn": 2,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 1}
			},
			{
				"id": "bronze_sword",
				"name": "青铜剑",
				"description": "战国兵器，剑刃有缺口。",
				"category": "bronze",
				"tags": ["metal", "weapon"],
				"repair_target": 55,
				"max_condition": 100,
				"start_condition": 75,
				"damage_per_turn": 2,
				"turns_until_irreparable": 0,
				"reward": {"type": "tool", "value": 1}
			}
		],
		"events": [],
		"rewards": [
			{"type": "cards", "count": 3},
			{"type": "unlock", "level_id": "level_1_2"}
		]
	},
	"level_1_2": {
		"id": "level_1_2",
		"chapter_id": "chapter_1",
		"name": "第一章：青铜展厅 - 挑战",
		"description": "更多展品，且出现了限时修复的展品。合理安排优先级！",
		"difficulty": "normal",
		"scene_name": "BattleScene",
		"max_turns": 12,
		"budget_per_turn": 3,
		"starting_budget": 0,
		"starting_tools": 2,
		"starting_experts": 0,
		"required_exhibits": 4,
		"allowed_failures": 1,
		"reward_cards_count": 3,
		"reward_difficulty": "normal",
		"unlock_chapter": "chapter_2",
		"exhibits": [
			{
				"id": "bronze_ding_2",
				"name": "大型青铜鼎",
				"description": "重器，修复工程量大。",
				"category": "bronze",
				"tags": ["metal", "large"],
				"repair_target": 80,
				"max_condition": 100,
				"start_condition": 60,
				"damage_per_turn": 4,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 3}
			},
			{
				"id": "bronze_mirror",
				"name": "透光铜镜",
				"description": "汉代青铜镜，镜面需精细抛光。【限时】",
				"category": "bronze",
				"tags": ["metal", "urgent", "small"],
				"repair_target": 50,
				"max_condition": 100,
				"start_condition": 90,
				"damage_per_turn": 0,
				"turns_until_irreparable": 5,
				"reward": {"type": "tool", "value": 2}
			},
			{
				"id": "bronze_hu",
				"name": "青铜壶",
				"description": "盛酒器，有裂纹。",
				"category": "bronze",
				"tags": ["metal"],
				"repair_target": 55,
				"max_condition": 100,
				"start_condition": 65,
				"damage_per_turn": 3,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 2}
			},
			{
				"id": "bronze_yi",
				"name": "青铜匜",
				"description": "古代盥洗用具，需修复流口。",
				"category": "bronze",
				"tags": ["metal", "small"],
				"repair_target": 45,
				"max_condition": 100,
				"start_condition": 80,
				"damage_per_turn": 2,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 1}
			},
			{
				"id": "bronze_chime",
				"name": "编钟组件",
				"description": "曾侯乙编钟残留件，需修复音梁。",
				"category": "bronze",
				"tags": ["metal", "instrument"],
				"repair_target": 65,
				"max_condition": 100,
				"start_condition": 55,
				"damage_per_turn": 3,
				"turns_until_irreparable": 0,
				"reward": {"type": "tool", "value": 1}
			}
		],
		"events": [
			{
				"id": "event_humidity",
				"name": "湿度异常",
				"description": "展厅湿度突然升高，所有展品本回合损坏+2。",
				"trigger_turn": 4,
				"effect": {"type": "global_damage", "value": 2}
			}
		],
		"rewards": [
			{"type": "cards", "count": 3},
			{"type": "unlock_chapter", "chapter_id": "chapter_2"}
		]
	},
	"level_2_1": {
		"id": "level_2_1",
		"chapter_id": "chapter_2",
		"name": "第二章：书画修复室 - 专家入场",
		"description": "珍贵书画需要专家介入。开始引入专家卡机制！",
		"difficulty": "normal",
		"scene_name": "BattleScene",
		"max_turns": 12,
		"budget_per_turn": 4,
		"starting_budget": 1,
		"starting_tools": 3,
		"starting_experts": 1,
		"required_exhibits": 4,
		"allowed_failures": 1,
		"reward_cards_count": 3,
		"reward_difficulty": "normal",
		"unlock_chapter": "",
		"exhibits": [
			{
				"id": "scroll_landscape",
				"name": "山水画长卷",
				"description": "绢本设色，有霉斑需小心处理。",
				"category": "painting",
				"tags": ["silk", "long"],
				"repair_target": 70,
				"max_condition": 100,
				"start_condition": 50,
				"damage_per_turn": 4,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 3}
			},
			{
				"id": "scroll_calligraphy",
				"name": "行书真迹",
				"description": "名家行书，墨迹有洇散。【限时】",
				"category": "painting",
				"tags": ["paper", "urgent"],
				"repair_target": 55,
				"max_condition": 100,
				"start_condition": 70,
				"damage_per_turn": 0,
				"turns_until_irreparable": 6,
				"reward": {"type": "budget", "value": 2}
			},
			{
				"id": "fan_painting",
				"name": "山水扇面",
				"description": "折扇面画，折痕处有破损。",
				"category": "painting",
				"tags": ["paper", "small"],
				"repair_target": 40,
				"max_condition": 100,
				"start_condition": 80,
				"damage_per_turn": 2,
				"turns_until_irreparable": 0,
				"reward": {"type": "tool", "value": 1}
			},
			{
				"id": "mural_fragment",
				"name": "壁画残片",
				"description": "壁画残片，颜料层起甲。需专家处理。",
				"category": "painting",
				"tags": ["wall", "fragile"],
				"repair_target": 85,
				"max_condition": 100,
				"start_condition": 40,
				"damage_per_turn": 5,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 4}
			},
			{
				"id": "manuscript",
				"name": "古籍抄本",
				"description": "宋版残本，纸张脆化。【限时】",
				"category": "painting",
				"tags": ["paper", "rare", "urgent"],
				"repair_target": 60,
				"max_condition": 100,
				"start_condition": 60,
				"damage_per_turn": 0,
				"turns_until_irreparable": 7,
				"reward": {"type": "tool", "value": 2}
			}
		],
		"events": [
			{
				"id": "event_pests",
				"name": "虫害警报",
				"description": "发现蠹虫痕迹！书画类展品本回合损坏+3。",
				"trigger_turn": 3,
				"effect": {"type": "tagged_damage", "tag": "paper", "value": 3}
			},
			{
				"id": "event_volunteers",
				"name": "志愿者团队",
				"description": "一批志愿者前来支援。立即获得+2预算。",
				"trigger_turn": 6,
				"effect": {"type": "gain_budget", "value": 2}
			}
		],
		"rewards": [
			{"type": "cards", "count": 3},
			{"type": "unlock", "level_id": "level_2_2"}
		]
	},
	"level_2_2": {
		"id": "level_2_2",
		"chapter_id": "chapter_2",
		"name": "第二章：陶瓷修复室 - 专家挑战",
		"description": "高难度陶瓷修复，考验你的资源调度与专家运用。",
		"difficulty": "hard",
		"scene_name": "BattleScene",
		"max_turns": 14,
		"budget_per_turn": 4,
		"starting_budget": 1,
		"starting_tools": 3,
		"starting_experts": 1,
		"required_exhibits": 5,
		"allowed_failures": 1,
		"reward_cards_count": 3,
		"reward_difficulty": "hard",
		"unlock_chapter": "",
		"exhibits": [
			{
				"id": "porcelain_vase",
				"name": "青花瓷瓶",
				"description": "元代青花，口沿有冲线。",
				"category": "porcelain",
				"tags": ["ceramic", "large"],
				"repair_target": 75,
				"max_condition": 100,
				"start_condition": 55,
				"damage_per_turn": 4,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 3}
			},
			{
				"id": "porcelain_teacup",
				"name": "斗彩鸡缸杯",
				"description": "名品，有冲线和缺损。【限时】",
				"category": "porcelain",
				"tags": ["ceramic", "rare", "urgent"],
				"repair_target": 50,
				"max_condition": 100,
				"start_condition": 65,
				"damage_per_turn": 0,
				"turns_until_irreparable": 5,
				"reward": {"type": "tool", "value": 2}
			},
			{
				"id": "porcelain_bowl",
				"name": "青瓷碗",
				"description": "宋代汝窑，釉面有裂纹。",
				"category": "porcelain",
				"tags": ["ceramic"],
				"repair_target": 55,
				"max_condition": 100,
				"start_condition": 70,
				"damage_per_turn": 3,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 2}
			},
			{
				"id": "porcelain_figurine",
				"name": "三彩俑",
				"description": "唐三彩仕女俑，头部有缺损。",
				"category": "porcelain",
				"tags": ["ceramic", "sculpture"],
				"repair_target": 80,
				"max_condition": 100,
				"start_condition": 45,
				"damage_per_turn": 5,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 4}
			},
			{
				"id": "porcelain_dish",
				"name": "粉彩大盘",
				"description": "清代粉彩，彩料有脱落。【限时】",
				"category": "porcelain",
				"tags": ["ceramic", "urgent", "large"],
				"repair_target": 65,
				"max_condition": 100,
				"start_condition": 50,
				"damage_per_turn": 2,
				"turns_until_irreparable": 8,
				"reward": {"type": "tool", "value": 1}
			},
			{
				"id": "porcelain_pot",
				"name": "釉里红罐",
				"description": "明初釉里红，罐底有窑裂。",
				"category": "porcelain",
				"tags": ["ceramic", "large"],
				"repair_target": 60,
				"max_condition": 100,
				"start_condition": 60,
				"damage_per_turn": 3,
				"turns_until_irreparable": 0,
				"reward": {"type": "budget", "value": 2}
			}
		],
		"events": [
			{
				"id": "event_accident",
				"name": "搬运事故",
				"description": "工作人员失手！所有完好度低于50的展品额外损坏5。",
				"trigger_turn": 4,
				"effect": {"type": "low_condition_damage", "threshold": 50, "value": 5}
			},
			{
				"id": "event_donation",
				"name": "匿名捐赠",
				"description": "收到匿名捐赠，+3修复工具。",
				"trigger_turn": 7,
				"effect": {"type": "gain_tools", "value": 3}
			}
		],
		"rewards": [
			{"type": "cards", "count": 3}
		]
	}
}

const CHAPTER_DEFINITIONS: Dictionary = {
	"chapter_1": {
		"id": "chapter_1",
		"name": "第一章：青铜时代",
		"description": "青铜器的保护与修复",
		"levels": ["level_1_1", "level_1_2"],
		"unlock_requirements": [],
		"rewards": ["卡片：精密激光仪"]
	},
	"chapter_2": {
		"id": "chapter_2",
		"name": "第二章：纸墨陶瓷",
		"description": "书画与陶瓷的复杂修复",
		"levels": ["level_2_1", "level_2_2"],
		"unlock_requirements": ["chapter_1"],
		"rewards": ["卡片：遗产保护网络"]
	}
}

var _level_cache: Dictionary = {}
var _chapter_cache: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for lid in LEVEL_DEFINITIONS:
		_level_cache[lid] = LEVEL_DEFINITIONS[lid]
	for cid in CHAPTER_DEFINITIONS:
		_chapter_cache[cid] = CHAPTER_DEFINITIONS[cid]

func get_level(level_id: String) -> Dictionary:
	if not _level_cache.has(level_id):
		push_warning("LevelRegistry: Unknown level '%s'" % level_id)
		return {}
	return (_level_cache[level_id] as Dictionary).duplicate(true)

func get_chapter(chapter_id: String) -> Dictionary:
	if not _chapter_cache.has(chapter_id):
		push_warning("LevelRegistry: Unknown chapter '%s'" % chapter_id)
		return {}
	return (_chapter_cache[chapter_id] as Dictionary).duplicate(true)

func get_all_chapters() -> Dictionary:
	return _chapter_cache.duplicate(true)

func get_levels_for_chapter(chapter_id: String) -> Array:
	var chapter: Dictionary = get_chapter(chapter_id)
	if chapter.is_empty():
		return []
	var levels: Array = []
	for lid in chapter.get("levels", []):
		levels.append(get_level(lid))
	return levels

func is_level_unlocked(level_id: String) -> bool:
	var level: Dictionary = get_level(level_id)
	if level.is_empty():
		return false
	var chapter_id: String = level.get("chapter_id", "")
	return SaveSystem.is_chapter_unlocked(chapter_id)

func is_chapter_unlocked(chapter_id: String) -> bool:
	return SaveSystem.is_chapter_unlocked(chapter_id)
