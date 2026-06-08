extends Node

signal stats_changed
signal budget_changed(new_value: int)
signal chapter_changed(chapter_index: int)
signal game_over(victory: bool)
signal turn_started
signal turn_ended

var current_chapter: int = 0
var current_level: int = 0
var player_budget: int = 0
var max_budget_per_turn: int = 3
var player_deck: Deck = null
var exhibit_list: Array[ExhibitData] = []
var current_turn: int = 0
var is_in_battle: bool = false
var last_battle_victory: bool = false
var difficulty_multiplier: float = 1.0

var _analytics: Dictionary = {}

func _ready() -> void:
	player_deck = Deck.new()
	_init_analytics()

func _init_analytics() -> void:
	_analytics = {
		"failure_steps": {},
		"retry_counts": {},
		"tutorial_skipped": false,
		"total_plays": 0,
		"total_wins": 0,
		"chapters_completed": 0,
	}

func start_battle(chapter: int, level: int) -> void:
	current_chapter = chapter
	current_level = level
	current_turn = 0
	is_in_battle = true
	var chapter_data = GameResources.get_chapter_data(chapter)
	if chapter_data:
		max_budget_per_turn = chapter_data.base_budget
		difficulty_multiplier = chapter_data.difficulty_scale
		exhibit_list = chapter_data.get_exhibits_for_level(level)
	player_budget = max_budget_per_turn
	_analytics["total_plays"] += 1
	var key = "%d_%d" % [chapter, level]
	if not _analytics["retry_counts"].has(key):
		_analytics["retry_counts"][key] = 0
	budget_changed.emit(player_budget)
	turn_started.emit()

func end_turn() -> void:
	turn_ended.emit()
	current_turn += 1
	player_budget = max_budget_per_turn
	budget_changed.emit(player_budget)
	turn_started.emit()
	_check_battle_state()

func spend_budget(amount: int) -> bool:
	if player_budget < amount:
		return false
	player_budget -= amount
	budget_changed.emit(player_budget)
	return true

func record_failure(step: String) -> void:
	if not _analytics["failure_steps"].has(step):
		_analytics["failure_steps"][step] = 0
	_analytics["failure_steps"][step] += 1
	var key = "%d_%d" % [current_chapter, current_level]
	_analytics["retry_counts"][key] = _analytics["retry_counts"].get(key, 0) + 1

func record_victory() -> void:
	_analytics["total_wins"] += 1
	if current_level == 0:
		_analytics["chapters_completed"] = max(_analytics["chapters_completed"], current_chapter + 1)

func set_tutorial_skipped(skipped: bool) -> void:
	_analytics["tutorial_skipped"] = skipped
	SaveManager.save_game()

func get_analytics() -> Dictionary:
	return _analytics.duplicate()

func get_smoothed_difficulty() -> float:
	var key = "%d_%d" % [current_chapter, current_level]
	var retries = _analytics["retry_counts"].get(key, 0)
	if retries <= 1:
		return difficulty_multiplier
	elif retries <= 3:
		return difficulty_multiplier * 0.85
	else:
		return difficulty_multiplier * 0.7

func _check_battle_state() -> void:
	var all_repaired = true
	var any_destroyed = false
	for exhibit in exhibit_list:
		if exhibit.state == ExhibitData.ExhibitState.REPAIRED:
			pass
		elif exhibit.state == ExhibitData.ExhibitState.DESTROYED:
			any_destroyed = true
			all_repaired = false
		else:
			all_repaired = false
	if all_repaired and exhibit_list.size() > 0:
		is_in_battle = false
		last_battle_victory = true
		record_victory()
		game_over.emit(true)
	elif any_destroyed:
		is_in_battle = false
		last_battle_victory = false
		game_over.emit(false)

func reset_run() -> void:
	current_chapter = 0
	current_level = 0
	player_budget = 0
	current_turn = 0
	is_in_battle = false
	exhibit_list.clear()
	player_deck = Deck.new()
