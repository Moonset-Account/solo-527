class_name ChapterData
extends RefCounted

var chapter_index: int = 0
var chapter_name: String = ""
var base_budget: int = 3
var difficulty_scale: float = 1.0
var new_rule: String = ""
var levels: Array[LevelData] = []
var reward_card_ids: Array[String] = []

func get_exhibits_for_level(level_index: int) -> Array[ExhibitData]:
	if level_index < 0 or level_index >= levels.size():
		return []
	var result: Array[ExhibitData] = []
	for exhibit in levels[level_index].exhibits:
		result.append(exhibit.duplicate_data())
	return result

func get_events_for_level(level_index: int) -> Array[String]:
	if level_index < 0 or level_index >= levels.size():
		return []
	return levels[level_index].events

func get_level_count() -> int:
	return levels.size()

func get_rule_description() -> String:
	match new_rule:
		"hidden_damage":
			return "展品可能存在隐藏损伤，需要用紫外线灯揭示！"
		"events":
			return "随机事件会在回合结束时触发，小心应对！"
		_:
			return ""
