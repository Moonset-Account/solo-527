extends Node

signal game_state_changed(new_state: int)
signal level_started(level_data: Dictionary)
signal level_completed(result: Dictionary)
signal level_failed(reason: String)
signal score_updated(score: int)
signal timer_updated(time_left: float, elapsed: float)
signal fragile_item_damaged(item)
signal item_placed(item)
signal item_removed(item)

enum GameState {
	MAIN_MENU,
	LEVEL_SELECT,
	PLAYING,
	PAUSED,
	RESULT_SCREEN,
	CREDITS
}

const UNDO_HISTORY_LIMIT := 50

var current_level: Dictionary = {}
var current_level_id: int = 0
var game_state: int = GameState.MAIN_MENU
var score: int = 0
var time_elapsed: float = 0.0
var time_limit: float = 120.0
var timer_enabled: bool = true
var mistakes_count: int = 0
var items_placed_count: int = 0
var fragile_broken_count: int = 0
var undo_history: Array = []
var redo_history: Array = []
var is_processing_input: bool = false
var max_container_weight: float = 500.0
var current_container_weight: float = 0.0
var unlocked_levels: Array = [1]
var unlocked_items: Array = []
var total_stars_earned: int = 0

func _ready() -> void:
	randomize()
	_change_state(GameState.MAIN_MENU)

func start_level(level_id_param: int) -> void:
	PlaySessionRecorder.start_session(level_id_param)
	var levels := load("res://config/levels.tres")
	if levels and levels.get_level_data().has(level_id_param):
		current_level = levels.get_level_data()[level_id_param].duplicate(true)
		current_level_id = level_id_param
		_reset_level_state()
		_change_state(GameState.PLAYING)
		level_started.emit(current_level)
		PlaySessionRecorder.record_event("level_start", {
			"level_id": level_id_param,
			"item_count": current_level.get("items", []).size()
		})

func _reset_level_state() -> void:
	score = 0
	time_elapsed = 0.0
	time_limit = current_level.get("time_limit", 120.0)
	timer_enabled = current_level.get("timer_enabled", true)
	mistakes_count = 0
	items_placed_count = 0
	fragile_broken_count = 0
	undo_history.clear()
	redo_history.clear()
	current_container_weight = 0.0
	max_container_weight = current_level.get("max_weight", 500.0)

func update(delta: float) -> void:
	if game_state != GameState.PLAYING:
		return
	if timer_enabled and time_limit > 0:
		time_elapsed += delta
		var time_left: float = max(0.0, time_limit - time_elapsed)
		timer_updated.emit(time_left, time_elapsed)
		if time_left <= 0.0:
			fail_level("时间耗尽！")

func add_mistake(reason: String) -> void:
	mistakes_count += 1
	PlaySessionRecorder.record_event("mistake", {"reason": reason, "count": mistakes_count})

func add_score(points: int, reason: String = "") -> void:
	score += points
	score = max(0, score)
	score_updated.emit(score)
	if reason != "":
		PlaySessionRecorder.record_event("score_change", {"delta": points, "reason": reason, "total": score})

func place_item(item) -> void:
	items_placed_count += 1
	current_container_weight += item.weight
	item_placed.emit(item)
	PlaySessionRecorder.record_event("item_placed", {
		"item_type": item.item_name,
		"weight": item.weight,
		"fragile": item.is_fragile,
		"rotation": item.rotation_degrees
	})

func remove_item(item) -> void:
	if items_placed_count > 0:
		items_placed_count -= 1
	current_container_weight = max(0.0, current_container_weight - item.weight)
	item_removed.emit(item)

func damage_fragile(item) -> void:
	fragile_broken_count += 1
	add_mistake("易碎品损坏")
	fragile_item_damaged.emit(item)

func complete_level() -> Dictionary:
	var time_bonus: int = 0
	if timer_enabled and time_limit > 0:
		var remaining_ratio: float = (time_limit - time_elapsed) / time_limit
		time_bonus = int(max(0.0, remaining_ratio) * 500)
	var weight_usage: float = current_container_weight / max_container_weight
	var weight_bonus: int = int(weight_usage * 300)
	var fragile_bonus: int = 0
	var fragile_total: int = current_level.get("fragile_count", 0)
	if fragile_total > 0 and fragile_broken_count == 0:
		fragile_bonus = 400
	var penalty: int = mistakes_count * 50
	var final_score: int = score + time_bonus + weight_bonus + fragile_bonus - penalty
	var stars: int = 0
	var perfect_threshold: float = current_level.get("perfect_threshold", 0.85)
	var good_threshold: float = current_level.get("good_threshold", 0.65)
	var usage_ratio: float = float(items_placed_count) / max(1, current_level.get("total_items", 1))
	if usage_ratio >= perfect_threshold and fragile_broken_count == 0 and mistakes_count <= 1:
		stars = 3
	elif usage_ratio >= good_threshold and fragile_broken_count <= 1:
		stars = 2
	elif usage_ratio >= 0.35:
		stars = 1
	total_stars_earned += stars
	var result := {
		"success": true,
		"level_id": current_level_id,
		"final_score": final_score,
		"base_score": score,
		"time_bonus": time_bonus,
		"weight_bonus": weight_bonus,
		"fragile_bonus": fragile_bonus,
		"penalty": penalty,
		"time_elapsed": time_elapsed,
		"mistakes": mistakes_count,
		"items_placed": items_placed_count,
		"items_total": current_level.get("total_items", 0),
		"fragile_broken": fragile_broken_count,
		"fragile_total": fragile_total,
		"weight_used": current_container_weight,
		"weight_max": max_container_weight,
		"stars": stars,
		"unlocked_next": stars >= 1,
		"unlocked_items": []
	}
	SaveManager.save_level_result(current_level_id, result)
	var next_level_id: int = current_level_id + 1
	if result["unlocked_next"]:
		if not unlocked_levels.has(next_level_id):
			unlocked_levels.append(next_level_id)
		var level_unlocks: Array = current_level.get("unlocks", [])
		for item_id in level_unlocks:
			if not unlocked_items.has(item_id):
				unlocked_items.append(item_id)
		result["unlocked_items"] = level_unlocks
	PlaySessionRecorder.record_event("level_complete", result)
	PlaySessionRecorder.end_session()
	_change_state(GameState.RESULT_SCREEN)
	level_completed.emit(result)
	return result

func fail_level(reason: String) -> void:
	var result := {
		"success": false,
		"level_id": current_level_id,
		"fail_reason": reason,
		"time_elapsed": time_elapsed,
		"mistakes": mistakes_count,
		"items_placed": items_placed_count,
		"score": score,
		"fragile_broken": fragile_broken_count
	}
	PlaySessionRecorder.record_event("level_fail", result)
	PlaySessionRecorder.end_session()
	_change_state(GameState.RESULT_SCREEN)
	level_failed.emit(reason)

func push_undo_state(state: Dictionary) -> void:
	undo_history.append(state.duplicate(true))
	if undo_history.size() > UNDO_HISTORY_LIMIT:
		undo_history.pop_front()
	redo_history.clear()

func can_undo() -> bool:
	return undo_history.size() > 0 and game_state == GameState.PLAYING

func can_redo() -> bool:
	return redo_history.size() > 0 and game_state == GameState.PLAYING

func pop_undo_state() -> Dictionary:
	if undo_history.is_empty():
		return {}
	var state: Dictionary = undo_history.pop_back()
	PlaySessionRecorder.record_event("undo", {})
	return state

func push_redo_state(state: Dictionary) -> void:
	redo_history.append(state.duplicate(true))

func pop_redo_state() -> Dictionary:
	if redo_history.is_empty():
		return {}
	var state: Dictionary = redo_history.pop_back()
	PlaySessionRecorder.record_event("redo", {})
	return state

func toggle_pause() -> void:
	if game_state == GameState.PLAYING:
		_change_state(GameState.PAUSED)
		PlaySessionRecorder.record_event("pause", {})
	elif game_state == GameState.PAUSED:
		_change_state(GameState.PLAYING)
		PlaySessionRecorder.record_event("resume", {})

func go_to_main_menu() -> void:
	if game_state == GameState.PLAYING:
		PlaySessionRecorder.record_event("abandon_level", {})
		PlaySessionRecorder.end_session()
	_change_state(GameState.MAIN_MENU)

func go_to_level_select() -> void:
	_change_state(GameState.LEVEL_SELECT)

func _change_state(new_state: int) -> void:
	if game_state == new_state:
		return
	game_state = new_state
	game_state_changed.emit(new_state)

func is_playing() -> bool:
	return game_state == GameState.PLAYING

func get_weight_warning_threshold() -> float:
	return max_container_weight * 0.9
