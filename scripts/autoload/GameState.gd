extends Node

const LEVELS_DATA := "res://scripts/data/levels.gd"
const CHARACTERS_DATA := "res://scripts/data/characters.gd"
const SKILLS_DATA := "res://scripts/data/skills.gd"
const STORY_EVENTS_DATA := "res://scripts/data/story_events.gd"

enum AppScene { MENU, TUTORIAL, LEVEL_SELECT, BATTLE, RESULT, SETTINGS }

var current_scene_state: int = AppScene.MENU
var current_level_id: String = ""
var previous_scene_path: String = ""

var _levels: Dictionary = {}
var _characters: Dictionary = {}
var _skills: Dictionary = {}
var _story_events: Dictionary = {}

var battle_stats: Dictionary = {
	"turns_used": 0,
	"tasks_completed": 0,
	"tasks_total": 0,
	"final_satisfaction": 0,
	"target_satisfaction": 0,
	"characters_used": [],
	"skills_used": 0,
	"events_triggered": 0,
}

var last_battle_victory: bool = false

func _ready() -> void:
	_load_static_data()
	DebugLog.log_info("GameState 初始化完成，已加载 %d 个关卡、%d 名角色" % [_levels.size(), _characters.size()])

func _load_static_data() -> void:
	var levels_script := load(LEVELS_DATA)
	if levels_script:
		_levels = levels_script.get_all_levels()
	var chars_script := load(CHARACTERS_DATA)
	if chars_script:
		_characters = chars_script.get_all_characters()
	var skills_script := load(SKILLS_DATA)
	if skills_script:
		_skills = skills_script.get_all_skills()
	var events_script := load(STORY_EVENTS_DATA)
	if events_script:
		_story_events = events_script.get_all_events()

func get_levels() -> Dictionary: return _levels
func get_characters() -> Dictionary: return _characters
func get_skills() -> Dictionary: return _skills
func get_story_events() -> Dictionary: return _story_events

func get_level(level_id: String) -> Dictionary:
	return _levels.get(level_id, {})

func get_character(char_id: String) -> Dictionary:
	return _characters.get(char_id, {})

func get_skill(skill_id: String) -> Dictionary:
	return _skills.get(skill_id, {})

func get_story_event(event_id: String) -> Dictionary:
	return _story_events.get(event_id, {})

func reset_battle_stats() -> void:
	battle_stats = {
		"turns_used": 0,
		"tasks_completed": 0,
		"tasks_total": 0,
		"final_satisfaction": 0,
		"target_satisfaction": 0,
		"characters_used": [],
		"skills_used": 0,
		"events_triggered": 0,
	}

func set_current_level(level_id: String) -> void:
	current_level_id = level_id
	DebugLog.log_info("选择关卡: %s" % level_id)
	SaveSystem.set_last_level(level_id)

func goto_scene(scene_path: String, new_state: int) -> void:
	previous_scene_path = get_tree().current_scene.scene_path
	current_scene_state = new_state
	get_tree().change_scene_to_file(scene_path)
	AudioManager.play_sfx("click")

func goto_main_menu() -> void:
	goto_scene("res://scenes/ui/MainMenu.tscn", AppScene.MENU)

func goto_level_select() -> void:
	goto_scene("res://scenes/ui/LevelSelect.tscn", AppScene.LEVEL_SELECT)

func goto_tutorial() -> void:
	goto_scene("res://scenes/ui/Tutorial.tscn", AppScene.TUTORIAL)

func goto_settings() -> void:
	var caller: String = get_tree().current_scene.scene_path
	previous_scene_path = caller
	goto_scene("res://scenes/ui/Settings.tscn", AppScene.SETTINGS)

func goto_battle(level_id: String) -> void:
	set_current_level(level_id)
	reset_battle_stats()
	EventBus.level_started.emit(level_id)
	goto_scene("res://scenes/battle/BattleScene.tscn", AppScene.BATTLE)

func goto_result(victory: bool) -> void:
	last_battle_victory = victory
	battle_stats["final_satisfaction"] = battle_stats.get("final_satisfaction", 0)
	if victory:
		SaveSystem.unlock_next_level(current_level_id)
		SaveSystem.set_level_score(current_level_id, battle_stats["final_satisfaction"])
	DebugLog.log_success("战斗结束, 胜利: %s, 满意度: %d" % [victory, battle_stats["final_satisfaction"]])
	get_tree().change_scene_to_file("res://scenes/ui/ResultScreen.tscn")
	current_scene_state = AppScene.RESULT

func get_level_ids_sorted() -> Array:
	var ids := _levels.keys()
	ids.sort_custom(func(a, b): return _levels[a]["order"] < _levels[b]["order"])
	return ids
