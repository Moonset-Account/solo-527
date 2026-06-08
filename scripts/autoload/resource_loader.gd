extends Node

var _card_database: Dictionary = {}
var _chapter_database: Dictionary = {}
var _loaded: bool = false

func _ready() -> void:
	_load_databases()

func _load_databases() -> void:
	_load_card_database()
	_load_chapter_database()
	_loaded = true

func _load_card_database() -> void:
	var path = "res://data/card_database.json"
	if not FileAccess.file_exists(path):
		_init_default_cards()
		return
	var file = FileAccess.open(path, FileAccess.READ)
	if file == null:
		_init_default_cards()
		return
	var json = JSON.new()
	var err = json.parse(file.get_as_text())
	file.close()
	if err != OK:
		_init_default_cards()
		return
	_card_database = json.data

func _load_chapter_database() -> void:
	var path = "res://data/chapter_database.json"
	if not FileAccess.file_exists(path):
		_init_default_chapters()
		return
	var file = FileAccess.open(path, FileAccess.READ)
	if file == null:
		_init_default_chapters()
		return
	var json = JSON.new()
	var err = json.parse(file.get_as_text())
	file.close()
	if err != OK:
		_init_default_chapters()
		return
	_chapter_database = json.data

func _init_default_cards() -> void:
	_card_database = {
		"repair_basic": {"name": "基础修复", "type": "repair", "cost": 1, "repair_value": 2, "description": "修复2点损坏", "rarity": "common"},
		"repair_advanced": {"name": "精细修复", "type": "repair", "cost": 2, "repair_value": 4, "description": "修复4点损坏", "rarity": "uncommon"},
		"repair_masterwork": {"name": "大师修复", "type": "repair", "cost": 3, "repair_value": 7, "description": "修复7点损坏", "rarity": "rare"},
		"budget_grant": {"name": "预算拨款", "type": "budget", "cost": 0, "budget_gain": 2, "description": "获得2点预算", "rarity": "common"},
		"budget_emergency": {"name": "紧急拨款", "type": "budget", "cost": 0, "budget_gain": 1, "draw": 1, "description": "获得1点预算，抽1张牌", "rarity": "uncommon"},
		"expert_historian": {"name": "历史学家", "type": "expert", "cost": 1, "effect": "exhibit_info", "description": "查看展品隐藏信息", "rarity": "common"},
		"expert_conservator": {"name": "修复师", "type": "expert", "cost": 2, "effect": "repair_boost", "repair_bonus": 2, "description": "下一次修复+2", "rarity": "uncommon"},
		"expert_chemist": {"name": "化学家", "type": "expert", "cost": 2, "effect": "stabilize", "description": "稳定所有展品状态", "rarity": "rare"},
		"tool_brush": {"name": "软毛刷", "type": "repair", "cost": 1, "repair_value": 1, "effect": "clean", "description": "清除1点污损+修复1点", "rarity": "common"},
		"tool_glue": {"name": "专用胶水", "type": "repair", "cost": 1, "repair_value": 3, "self_damage": 1, "description": "修复3点但展品受1点冲击", "rarity": "uncommon"},
		"tool_uv": {"name": "紫外线灯", "type": "repair", "cost": 2, "repair_value": 2, "effect": "reveal", "description": "修复2点并揭示隐藏损伤", "rarity": "rare"},
		"budget_negotiate": {"name": "谈判协商", "type": "budget", "cost": 0, "budget_gain": 3, "discard": 1, "description": "获得3点预算，弃1张牌", "rarity": "uncommon"},
		"expert_curator": {"name": "策展人", "type": "expert", "cost": 1, "effect": "skip_event", "description": "跳过下一个负面事件", "rarity": "rare"},
		"repair_gentle": {"name": "温和修复", "type": "repair", "cost": 1, "repair_value": 1, "effect": "prevent_decay", "description": "修复1点并防止退化", "rarity": "common"},
		"tool_climate": {"name": "气候控制", "type": "expert", "cost": 2, "effect": "global_stabilize", "description": "所有展品本回合不退化", "rarity": "rare"},
	}

func _init_default_chapters() -> void:
	_chapter_database = {
		"0": {
			"name": "第一章：初识修复",
			"base_budget": 3,
			"difficulty_scale": 1.0,
			"new_rule": null,
			"levels": [
				{"exhibits": [{"name": "瓷瓶", "max_hp": 5, "type": "ceramic"}, {"name": "油画", "max_hp": 4, "type": "painting"}], "events": []},
				{"exhibits": [{"name": "青铜器", "max_hp": 6, "type": "metal"}, {"name": "丝织品", "max_hp": 4, "type": "textile"}], "events": ["decay"]},
				{"exhibits": [{"name": "石雕", "max_hp": 7, "type": "stone"}, {"name": "古籍", "max_hp": 3, "type": "paper"}, {"name": "玉器", "max_hp": 5, "type": "jade"}], "events": ["decay", "surprise_damage"]},
			],
			"rewards": ["repair_advanced", "budget_grant"],
		},
		"1": {
			"name": "第二章：隐藏损伤",
			"base_budget": 3,
			"difficulty_scale": 1.2,
			"new_rule": "hidden_damage",
			"levels": [
				{"exhibits": [{"name": "彩陶", "max_hp": 5, "type": "ceramic", "hidden_damage": 2}, {"name": "壁画", "max_hp": 6, "type": "painting", "hidden_damage": 3}], "events": ["decay"]},
				{"exhibits": [{"name": "银器", "max_hp": 5, "type": "metal", "hidden_damage": 2}, {"name": "漆器", "max_hp": 4, "type": "lacquer", "hidden_damage": 2}, {"name": "木雕", "max_hp": 6, "type": "wood", "hidden_damage": 1}], "events": ["decay", "hidden_reveal"]},
				{"exhibits": [{"name": "玻璃器", "max_hp": 4, "type": "glass", "hidden_damage": 3}, {"name": "牙雕", "max_hp": 5, "type": "ivory", "hidden_damage": 2}, {"name": "铁器", "max_hp": 7, "type": "metal", "hidden_damage": 2}], "events": ["decay", "surprise_damage", "hidden_reveal"]},
			],
			"rewards": ["expert_conservator", "tool_uv"],
		},
		"2": {
			"name": "第三章：紧急事态",
			"base_budget": 4,
			"difficulty_scale": 1.4,
			"new_rule": "events",
			"levels": [
				{"exhibits": [{"name": "法老面具", "max_hp": 6, "type": "metal"}, {"name": "莎草纸", "max_hp": 3, "type": "paper"}, {"name": "琥珀", "max_hp": 5, "type": "organic"}], "events": ["decay", "earthquake"]},
				{"exhibits": [{"name": "唐三彩", "max_hp": 5, "type": "ceramic"}, {"name": "敦煌绢画", "max_hp": 4, "type": "textile"}, {"name": "青铜鼎", "max_hp": 8, "type": "metal"}], "events": ["decay", "flood", "theft_attempt"]},
				{"exhibits": [{"name": "紫檀屏风", "max_hp": 7, "type": "wood"}, {"name": "翡翠山子", "max_hp": 5, "type": "jade"}, {"name": "珐琅钟", "max_hp": 6, "type": "metal"}, {"name": "缂丝龙袍", "max_hp": 4, "type": "textile"}], "events": ["decay", "earthquake", "flood", "surprise_damage"]},
			],
			"rewards": ["expert_curator", "tool_climate"],
		},
	}

func create_card_by_id(card_id: String) -> CardData:
	if not _card_database.has(card_id):
		return null
	var data = _card_database[card_id]
	var card = CardData.new()
	card.id = card_id
	card.card_name = data.get("name", "Unknown")
	card.type = CardData.CardType.keys().find(data.get("type", "repair").to_upper()) if CardData.CardType.keys().has(data.get("type", "repair").to_upper()) else 0
	card.cost = data.get("cost", 1)
	card.repair_value = data.get("repair_value", 0)
	card.budget_gain = data.get("budget_gain", 0)
	card.description = data.get("description", "")
	card.rarity = data.get("rarity", "common")
	card.effect = data.get("effect", "")
	card.repair_bonus = data.get("repair_bonus", 0)
	card.self_damage = data.get("self_damage", 0)
	card.draw_count = data.get("draw", 0)
	card.discard_count = data.get("discard", 0)
	return card

func get_card_database() -> Dictionary:
	return _card_database.duplicate()

func get_chapter_data(chapter_index: int) -> ChapterData:
	var key = str(chapter_index)
	if not _chapter_database.has(key):
		return null
	var data = _chapter_database[key]
	var chapter = ChapterData.new()
	chapter.chapter_index = chapter_index
	chapter.chapter_name = data.get("name", "")
	chapter.base_budget = data.get("base_budget", 3)
	chapter.difficulty_scale = data.get("difficulty_scale", 1.0)
	chapter.new_rule = data.get("new_rule", "")
	for reward_id in data.get("rewards", []):
		chapter.reward_card_ids.append(reward_id)
	for level_data in data.get("levels", []):
		var level = LevelData.new()
		for exhibit_data in level_data.get("exhibits", []):
			var exhibit = ExhibitData.new()
			exhibit.exhibit_name = exhibit_data.get("name", "")
			exhibit.max_hp = exhibit_data.get("max_hp", 5)
			exhibit.current_hp = exhibit.max_hp
			exhibit.exhibit_type = exhibit_data.get("type", "")
			exhibit.hidden_damage = exhibit_data.get("hidden_damage", 0)
			exhibit.state = ExhibitData.ExhibitState.DAMAGED
			level.exhibits.append(exhibit)
		for event_name in level_data.get("events", []):
			level.events.append(event_name)
		chapter.levels.append(level)
	return chapter

func get_chapter_count() -> int:
	return _chapter_database.size()

func get_starter_deck_card_ids() -> Array[String]:
	var ids: Array[String] = []
	ids.append("repair_basic")
	ids.append("repair_basic")
	ids.append("repair_basic")
	ids.append("repair_gentle")
	ids.append("tool_brush")
	ids.append("tool_brush")
	ids.append("budget_grant")
	ids.append("budget_grant")
	ids.append("expert_historian")
	return ids
