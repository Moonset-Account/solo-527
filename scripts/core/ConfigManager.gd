extends Node

const CONFIG_DIR := "res://configs/"
const LEVEL_CONFIG_PATH := CONFIG_DIR + "levels/"
const GAME_CONFIG_PATH := CONFIG_DIR + "game_config.json"
const SCORING_CONFIG_PATH := CONFIG_DIR + "scoring.json"
const HINTS_CONFIG_PATH := CONFIG_DIR + "hints.json"

var game_config: Dictionary = {}
var scoring_config: Dictionary = {}
var level_configs: Dictionary = {}

func _ready() -> void:
	_load_configs()

func _load_configs() -> void:
	_load_game_config()
	_load_scoring_config()
	_load_all_levels()

func _load_game_config() -> void:
	if FileAccess.file_exists(GAME_CONFIG_PATH):
		var file: FileAccess = FileAccess.open(GAME_CONFIG_PATH, FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var parsed: Variant = JSON.parse_string(content)
			if parsed is Dictionary:
				game_config = parsed
	else:
		game_config = _get_default_game_config()
		_save_json(GAME_CONFIG_PATH, game_config)

func _load_scoring_config() -> void:
	if FileAccess.file_exists(SCORING_CONFIG_PATH):
		var file: FileAccess = FileAccess.open(SCORING_CONFIG_PATH, FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var parsed: Variant = JSON.parse_string(content)
			if parsed is Dictionary:
				scoring_config = parsed
	else:
		scoring_config = _get_default_scoring_config()
		_save_json(SCORING_CONFIG_PATH, scoring_config)

func _load_all_levels() -> void:
	level_configs.clear()
	if DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(LEVEL_CONFIG_PATH)):
		var dir: DirAccess = DirAccess.open(LEVEL_CONFIG_PATH)
		if dir:
			dir.list_dir_begin()
			var file_name: String = dir.get_next()
			while file_name != "":
				if file_name.ends_with(".json"):
					var level_id: String = file_name.get_basename()
					var level_data: Dictionary = _load_level_config(level_id)
					if level_data:
						level_configs[level_id] = level_data
				file_name = dir.get_next()
			dir.list_dir_end()
	else:
		DirAccess.make_dir_absolute(ProjectSettings.globalize_path(CONFIG_DIR))
		DirAccess.make_dir_absolute(ProjectSettings.globalize_path(LEVEL_CONFIG_PATH))
		_create_default_levels()

func _load_level_config(level_id: String) -> Dictionary:
	var path: String = LEVEL_CONFIG_PATH + level_id + ".json"
	if FileAccess.file_exists(path):
		var file: FileAccess = FileAccess.open(path, FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var parsed: Variant = JSON.parse_string(content)
			if parsed is Dictionary:
				return parsed
	return {}

func save_level_config(level_id: String, data: Dictionary) -> void:
	var path: String = LEVEL_CONFIG_PATH + level_id + ".json"
	_save_json(path, data)
	level_configs[level_id] = data

func get_level_ids() -> Array:
	return level_configs.keys()

func get_level_config(level_id: String) -> Dictionary:
	if level_configs.has(level_id):
		return level_configs[level_id].duplicate(true)
	return {}

func _save_json(path: String, data: Dictionary) -> void:
	var dir: String = path.get_base_dir()
	if not DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(dir)):
		DirAccess.make_dir_absolute(ProjectSettings.globalize_path(dir))
	var file: FileAccess = FileAccess.open(path, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data, "\t"))
		file.close()

func _get_default_game_config() -> Dictionary:
	return {
		"game": {
			"title": "档案室时间线推理",
			"version": "1.0.0",
			"max_attempts": 3,
			"auto_save_interval": 30
		},
		"display": {
			"default_resolution": [1280, 720],
			"vsync": true,
			"frame_rate_limit": 60,
			"fullscreen": false
		},
		"audio": {
			"master_volume": 0.0,
			"music_volume": -5.0,
			"sfx_volume": -3.0,
			"ui_volume": -2.0
		},
		"gameplay": {
			"show_hint_button": true,
			"enable_drag_preview": true,
			"animation_speed": 1.0,
			"confirm_submit": true
		}
	}

func _get_default_scoring_config() -> Dictionary:
	return {
		"base_score": 1000,
		"per_card_correct": 150,
		"per_tag_correct": 50,
		"per_link_correct": 100,
		"time_bonus_multiplier": 0.5,
		"hint_penalty": [0, 100, 250, 500],
		"attempt_penalty": 200,
		"perfect_bonus": 500,
		"no_hint_bonus": 300,
		"first_try_bonus": 200,
		"grades": [
			{"min_score": 1800, "grade": "S", "color": "#FFD700"},
			{"min_score": 1400, "grade": "A", "color": "#2ECC71"},
			{"min_score": 1000, "grade": "B", "color": "#3498DB"},
			{"min_score": 600, "grade": "C", "color": "#E67E22"},
			{"min_score": 0, "grade": "D", "color": "#E74C3C"}
		]
	}

func _create_default_levels() -> void:
	var tutorial_level := _get_tutorial_level_config()
	save_level_config("tutorial", tutorial_level)
	var chapter1 := _get_chapter1_level_config()
	save_level_config("chapter1", chapter1)

func _get_tutorial_level_config() -> Dictionary:
	return {
		"id": "tutorial",
		"title": "新手教程：第一份档案",
		"description": "学习如何整理档案：阅读卡片、按时间排序、添加标签、关联证据。",
		"difficulty": 1,
		"time_limit": 0,
		"cards": [
			{
				"id": "card_t1",
				"type": "letter",
				"title": "家书 - 三月",
				"content": "吾儿亲启：三月春寒，家中一切安好。昨日收到你寄来的照片，见你身形消瘦，甚为挂念。",
				"correct_year": 1921,
				"correct_month": 3,
				"correct_day": 15,
				"image_hint": "信纸泛黄，有折痕",
				"tags": ["家书", "春天"],
				"correct_tags": ["家书", "春天"]
			},
			{
				"id": "card_t2",
				"type": "photo",
				"title": "毕业合影",
				"content": "照片背面写着：民国十年七月，毕业于县立高等小学。前排左三为本人。",
				"correct_year": 1921,
				"correct_month": 7,
				"correct_day": 10,
				"image_hint": "黑白照片，学生装",
				"tags": ["照片", "毕业"],
				"correct_tags": ["照片", "毕业"]
			},
			{
				"id": "card_t3",
				"type": "document",
				"title": "入职通知书",
				"content": "兹委任XXX为本局书记员，月薪大洋二十元，即日起报到。民国十年十月五日。",
				"correct_year": 1921,
				"correct_month": 10,
				"correct_day": 5,
				"image_hint": "公文纸，红色印章",
				"tags": ["公文", "工作"],
				"correct_tags": ["公文", "工作"]
			}
		],
		"timeline_slots": 3,
		"available_tags": ["家书", "公文", "照片", "春天", "夏天", "秋天", "冬天", "毕业", "工作", "节日"],
		"hints": [
			{
				"level": 1,
				"text": "提示级别1：注意每张卡片上都有明确的日期线索。"
			},
			{
				"level": 2,
				"text": "提示级别2：信件日期最早，照片在中间，通知书最晚。"
			},
			{
				"level": 3,
				"text": "提示级别3：正确顺序是：家书(3月)→毕业照(7月)→入职通知(10月)。"
			}
		],
		"evidence_links": [],
		"success_message": "太棒了！你已经掌握了档案整理的基本方法。继续加油！",
		"failure_messages": [
			"时间顺序不对，请再仔细查看日期。",
			"部分卡片的标签可能不正确。"
		]
	}

func _get_chapter1_level_config() -> Dictionary:
	return {
		"id": "chapter1",
		"title": "第一章：失踪的收藏家",
		"description": "1935年冬，著名收藏家林墨轩神秘失踪。整理他留下的档案，找出真相。",
		"difficulty": 2,
		"time_limit": 600,
		"cards": [
			{
				"id": "card_c1_1",
				"type": "letter",
				"title": "匿名威胁信",
				"content": "林先生：识时务者为俊杰。那件东西不属于你，三日内交出，否则后果自负。——知情人 十一月三日",
				"correct_year": 1935,
				"correct_month": 11,
				"correct_day": 3,
				"image_hint": "打字机字体，无签名",
				"tags": ["威胁", "秋天"],
				"correct_tags": ["威胁", "秋天"],
				"linked_cards": ["card_c1_4"]
			},
			{
				"id": "card_c1_2",
				"type": "photo",
				"title": "藏品照片：玉璧",
				"content": "照片背面：汉代龙纹玉璧，民国二十三年秋得于沪上。估值三千大洋。",
				"correct_year": 1934,
				"correct_month": 9,
				"correct_day": 20,
				"image_hint": "精美玉器照片",
				"tags": ["照片", "藏品", "秋天"],
				"correct_tags": ["照片", "藏品", "秋天"],
				"linked_cards": ["card_c1_4", "card_c1_5"]
			},
			{
				"id": "card_c1_3",
				"type": "document",
				"title": "保险单",
				"content": "被保险人：林墨轩，保险标的：汉代玉璧，保险金额：伍仟大洋，有效期民国二十四年一月至十二月。",
				"correct_year": 1935,
				"correct_month": 1,
				"correct_day": 15,
				"image_hint": "保险公司正式单据",
				"tags": ["公文", "保险", "冬天"],
				"correct_tags": ["公文", "保险", "冬天"],
				"linked_cards": ["card_c1_2"]
			},
			{
				"id": "card_c1_4",
				"type": "letter",
				"title": "给友人的信",
				"content": "伯吾兄：近日心绪不宁，有人觊觎我那件玉璧。若我出事，请务必报警，并告知舍弟处理藏品。十一月六日",
				"correct_year": 1935,
				"correct_month": 11,
				"correct_day": 6,
				"image_hint": "手写信封，墨迹潦草",
				"tags": ["家书", "预警", "秋天"],
				"correct_tags": ["预警", "秋天"],
				"linked_cards": ["card_c1_1", "card_c1_2"]
			},
			{
				"id": "card_c1_5",
				"type": "document",
				"title": "警局报案记录",
				"content": "报案人：林宅管家王福，报案时间：民国二十四年十二月二日。事由：主人林墨轩于昨晚未归，家中玉璧失踪。",
				"correct_year": 1935,
				"correct_month": 12,
				"correct_day": 2,
				"image_hint": "警局正式记录簿",
				"tags": ["公文", "报警", "冬天"],
				"correct_tags": ["公文", "报警", "冬天"],
				"linked_cards": ["card_c1_2", "card_c1_6"]
			},
			{
				"id": "card_c1_6",
				"type": "newspaper",
				"title": "新闻剪报",
				"content": "申报 - 民国二十四年十二月五日：本市收藏家林墨轩失踪一案，警方已介入调查，据悉家中贵重玉器同时失窃。",
				"correct_year": 1935,
				"correct_month": 12,
				"correct_day": 5,
				"image_hint": "报纸剪报，泛黄",
				"tags": ["新闻", "冬天"],
				"correct_tags": ["新闻", "冬天"],
				"linked_cards": ["card_c1_5"]
			}
		],
		"timeline_slots": 6,
		"available_tags": ["家书", "公文", "照片", "新闻", "藏品", "威胁", "预警", "报警", "保险", "春天", "夏天", "秋天", "冬天"],
		"hints": [
			{
				"level": 1,
				"text": "提示级别1：仔细查看每张卡片上的民国年份，民国元年是1912年。"
			},
			{
				"level": 2,
				"text": "提示级别2：照片上写的是民国二十三年(1934)，其他多为民国二十四年(1935)。按月份排序。"
			},
			{
				"level": 3,
				"text": "提示级别3：正确顺序：玉璧照片(1934.9)→保险单(1935.1)→威胁信(1935.11.3)→给友人信(1935.11.6)→报案(1935.12.2)→新闻(1935.12.5)。"
			}
		],
		"evidence_links": [
			{"from": "card_c1_1", "to": "card_c1_4", "reason": "威胁信后写信给友人预警"},
			{"from": "card_c1_2", "to": "card_c1_3", "reason": "玉璧购买后购买保险"},
			{"from": "card_c1_2", "to": "card_c1_5", "reason": "玉璧与主人同时失踪"},
			{"from": "card_c1_4", "to": "card_c1_2", "reason": "友人信中提到的藏品即玉璧"},
			{"from": "card_c1_5", "to": "card_c1_6", "reason": "报案后新闻报道"}
		],
		"success_message": "推理成功！你还原了收藏家失踪的完整时间线。玉璧是案件的核心。",
		"failure_messages": [
			"时间线存在错误：注意民国纪年的换算方式。",
			"证据关联不完整：威胁、预警、失踪之间有因果链。",
			"部分标签不正确：请根据卡片内容和季节仔细判断。"
		]
	}

func get_game_setting(key: String, default_value = null):
	var keys = key.split(".")
	var current = game_config
	for k in keys:
		if current is Dictionary and current.has(k):
			current = current[k]
		else:
			return default_value
	return current

func set_game_setting(key: String, value) -> void:
	var keys = key.split(".")
	var current = game_config
	for i in range(keys.size() - 1):
		var k = keys[i]
		if not current.has(k) or not current[k] is Dictionary:
			current[k] = {}
		current = current[k]
	current[keys[keys.size() - 1]] = value
	_save_json(GAME_CONFIG_PATH, game_config)
	EventBus.emit_signal("settings_changed", keys[0])
