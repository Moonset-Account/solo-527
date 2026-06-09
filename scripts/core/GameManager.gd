extends Node

enum GameState {
	MENU,
	LEVEL_SELECT,
	TUTORIAL,
	PLAYING,
	PAUSED,
	SETTINGS,
	LEVEL_COMPLETE,
	LEVEL_FAILED
}

var current_state: int = GameState.MENU
var current_level_id: String = ""
var current_level_config: Dictionary = {}
var game_state_data: Dictionary = {}
var play_time: float = 0.0
var attempts: int = 0
var hints_used: int = 0
var last_auto_save: float = 0.0
var is_paused: bool = false
var animation_speed: float = 1.0

signal state_changed(new_state: int, old_state: int)

func _ready() -> void:
	animation_speed = float(SaveManager.get_setting("gameplay.animation_speed", 1.0))
	SaveManager.apply_settings_to_engine()

func _process(delta: float) -> void:
	if current_state == GameState.PLAYING and not is_paused:
		play_time += delta
		SaveManager.update_play_time(delta)
		var auto_save_interval: float = float(ConfigManager.get_game_setting("game.auto_save_interval", 30.0))
		if play_time - last_auto_save >= auto_save_interval:
			last_auto_save = play_time
			_do_auto_save()

func change_state(new_state: int) -> void:
	var old_state: int = current_state
	current_state = new_state
	is_paused = (new_state == GameState.PAUSED)
	get_tree().paused = is_paused
	emit_signal("state_changed", new_state, old_state)

func start_level(level_id: String) -> void:
	var config: Dictionary = ConfigManager.get_level_config(level_id)
	if config.is_empty():
		push_warning("Level config not found: %s" % level_id)
		return
	current_level_id = level_id
	current_level_config = config
	play_time = 0.0
	attempts = 0
	hints_used = 0
	last_auto_save = 0.0
	_init_game_state(config)
	change_state(GameState.PLAYING)
	EventBus.emit_signal("level_started", level_id)

func _init_game_state(config: Dictionary) -> void:
	var cards: Array = config.get("cards", [])
	var slots_count: int = int(config.get("timeline_slots", cards.size()))
	var timeline: Array = []
	for i: int in range(slots_count):
		timeline.append(null)
	var unplaced: Array = []
	for c: Dictionary in cards:
		unplaced.append(c["id"])
	var card_tags: Dictionary = {}
	for c: Dictionary in cards:
		card_tags[c["id"]] = []
	var linked_pairs: Array = []
	game_state_data = {
		"timeline": timeline,
		"unplaced_cards": unplaced,
		"card_tags": card_tags,
		"linked_pairs": linked_pairs,
		"hints_revealed": [],
		"play_time": 0.0,
		"submission_count": 0
	}

func _do_auto_save() -> void:
	game_state_data["play_time"] = play_time
	SaveManager.auto_save(current_level_id, game_state_data)

func resume_from_auto_save() -> bool:
	var save_data: Dictionary = SaveManager.load_auto_save()
	if save_data.is_empty():
		return false
	current_level_id = str(save_data.get("level_id", ""))
	if current_level_id.is_empty():
		return false
	var config: Dictionary = ConfigManager.get_level_config(current_level_id)
	if config.is_empty():
		return false
	current_level_config = config
	game_state_data = save_data.get("game_state", {})
	play_time = float(save_data.get("play_time", 0.0))
	attempts = 0
	hints_used = Array(game_state_data.get("hints_revealed", [])).size()
	last_auto_save = play_time
	change_state(GameState.PLAYING)
	return true

func place_card(card_id: String, slot_index: int) -> void:
	if not game_state_data.has("timeline"):
		return
	var timeline: Array = game_state_data["timeline"]
	if slot_index < 0 or slot_index >= timeline.size():
		return
	for i: int in range(timeline.size()):
		if timeline[i] == card_id:
			timeline[i] = null
	var old_card: Variant = timeline[slot_index]
	timeline[slot_index] = card_id
	var unplaced: Array = game_state_data.get("unplaced_cards", [])
	if unplaced.has(card_id):
		unplaced.erase(card_id)
	if old_card and not unplaced.has(old_card):
		unplaced.append(old_card)
	EventBus.emit_signal("card_dropped", card_id, slot_index)
	EventBus.emit_signal("audio_play", "card_place", -5.0)

func remove_card_from_slot(slot_index: int) -> void:
	var timeline: Array = game_state_data.get("timeline", [])
	if slot_index < 0 or slot_index >= timeline.size():
		return
	var card_id: Variant = timeline[slot_index]
	if card_id:
		timeline[slot_index] = null
		var unplaced: Array = game_state_data.get("unplaced_cards", [])
		if not unplaced.has(card_id):
			unplaced.append(card_id)
		EventBus.emit_signal("audio_play", "card_remove", -5.0)

func swap_cards(slot_a: int, slot_b: int) -> void:
	var timeline: Array = game_state_data.get("timeline", [])
	if slot_a < 0 or slot_a >= timeline.size():
		return
	if slot_b < 0 or slot_b >= timeline.size():
		return
	var temp: Variant = timeline[slot_a]
	timeline[slot_a] = timeline[slot_b]
	timeline[slot_b] = temp
	EventBus.emit_signal("audio_play", "card_swap", -3.0)

func apply_tag(card_id: String, tag_id: String) -> void:
	var card_tags: Dictionary = game_state_data.get("card_tags", {})
	if not card_tags.has(card_id):
		card_tags[card_id] = []
	var tags: Array = card_tags[card_id]
	if not tags.has(tag_id):
		tags.append(tag_id)
		EventBus.emit_signal("tag_applied", card_id, tag_id)
		EventBus.emit_signal("audio_play", "tag_add", -3.0)

func remove_tag(card_id: String, tag_id: String) -> void:
	var card_tags: Dictionary = game_state_data.get("card_tags", {})
	if not card_tags.has(card_id):
		return
	var tags: Array = card_tags[card_id]
	if tags.has(tag_id):
		tags.erase(tag_id)
		EventBus.emit_signal("tag_removed", card_id, tag_id)
		EventBus.emit_signal("audio_play", "tag_remove", -3.0)

func add_evidence_link(card_a_id: String, card_b_id: String) -> void:
	var pairs: Array = game_state_data.get("linked_pairs", [])
	var key_a: String = "%s|%s" % [card_a_id, card_b_id]
	var key_b: String = "%s|%s" % [card_b_id, card_a_id]
	var exists: bool = false
	for p: Dictionary in pairs:
		var pkey: String = "%s|%s" % [p.get("from", ""), p.get("to", "")]
		var pkey2: String = "%s|%s" % [p.get("to", ""), p.get("from", "")]
		if pkey == key_a or pkey2 == key_a or pkey == key_b or pkey2 == key_b:
			exists = true
			break
	if not exists:
		pairs.append({"from": card_a_id, "to": card_b_id})
		EventBus.emit_signal("evidence_linked", card_a_id, card_b_id)
		EventBus.emit_signal("audio_play", "link_add", -5.0)

func remove_evidence_link(card_a_id: String, card_b_id: String) -> void:
	var pairs: Array = game_state_data.get("linked_pairs", [])
	var key_a: String = "%s|%s" % [card_a_id, card_b_id]
	var key_b: String = "%s|%s" % [card_b_id, card_a_id]
	for i: int in range(pairs.size() - 1, -1, -1):
		var p: Dictionary = pairs[i]
		var pkey: String = "%s|%s" % [p.get("from", ""), p.get("to", "")]
		var pkey2: String = "%s|%s" % [p.get("to", ""), p.get("from", "")]
		if pkey == key_a or pkey2 == key_a or pkey == key_b or pkey2 == key_b:
			pairs.remove_at(i)
			EventBus.emit_signal("evidence_unlinked", card_a_id, card_b_id)
			EventBus.emit_signal("audio_play", "link_remove", -5.0)
			break

func request_hint() -> String:
	if not SaveManager.get_setting("gameplay.hint_enabled", true):
		return ""
	var hints: Array = current_level_config.get("hints", [])
	var revealed: Array = game_state_data.get("hints_revealed", [])
	var next_level: int = revealed.size() + 1
	if next_level > hints.size():
		return ""
	for h: Dictionary in hints:
		if int(h.get("level", 0)) == next_level:
			if not revealed.has(next_level):
				revealed.append(next_level)
				game_state_data["hints_revealed"] = revealed
			hints_used = max(hints_used, next_level)
			EventBus.emit_signal("hint_revealed", h.get("text", ""), next_level)
			EventBus.emit_signal("audio_play", "hint_reveal", -5.0)
			return str(h.get("text", ""))
	return ""

func get_revealed_hints() -> Array:
	var hints: Array = current_level_config.get("hints", [])
	var revealed: Array = game_state_data.get("hints_revealed", [])
	var result: Array = []
	for h: Dictionary in hints:
		if revealed.has(int(h.get("level", 0))):
			result.append(h)
	return result

func submit_timeline() -> Dictionary:
	attempts += 1
	var submission_count: int = int(game_state_data.get("submission_count", 0)) + 1
	game_state_data["submission_count"] = submission_count
	var result: Dictionary = _evaluate_solution()
	result["attempts"] = attempts
	result["hints_used"] = hints_used
	result["play_time"] = play_time
	result["submission_count"] = submission_count
	EventBus.emit_signal("timeline_submitted")
	EventBus.emit_signal("timeline_validated", result)
	if result.get("passed", false):
		var final_score: int = _calculate_final_score(result)
		result["final_score"] = final_score
		result["grade"] = _get_grade(final_score)
		result["perfect"] = result.get("all_cards_correct", true) and result.get("all_tags_correct", true) and result.get("all_links_correct", true) and hints_used == 0 and attempts == 1
		SaveManager.complete_level(current_level_id, result)
		SaveManager.delete_save("autosave")
		change_state(GameState.LEVEL_COMPLETE)
		EventBus.emit_signal("level_completed", result)
		EventBus.emit_signal("audio_play", "level_complete", -2.0)
	else:
		var max_attempts: int = int(ConfigManager.get_game_setting("game.max_attempts", 3))
		if attempts >= max_attempts:
			result["final_score"] = _calculate_final_score(result)
			result["grade"] = _get_grade(int(result["final_score"]))
			change_state(GameState.LEVEL_FAILED)
			EventBus.emit_signal("level_failed", result.get("failure_reasons", []))
			EventBus.emit_signal("audio_play", "level_fail", -2.0)
		else:
			EventBus.emit_signal("audio_play", "submit_fail", -5.0)
	return result

func _evaluate_solution() -> Dictionary:
	var cards: Array = current_level_config.get("cards", [])
	var timeline: Array = game_state_data.get("timeline", [])
	var card_tags: Dictionary = game_state_data.get("card_tags", {})
	var linked_pairs: Array = game_state_data.get("linked_pairs", [])
	var expected_links_arr: Array = current_level_config.get("evidence_links", [])
	var result: Dictionary = {
		"passed": false,
		"cards_correct": 0,
		"cards_total": cards.size(),
		"cards_wrong": [],
		"all_cards_correct": false,
		"tags_correct": 0,
		"tags_total": 0,
		"tags_wrong": [],
		"all_tags_correct": false,
		"links_correct": 0,
		"links_total": expected_links_arr.size(),
		"links_wrong": [],
		"all_links_correct": false,
		"failure_reasons": []
	}
	var sorted_cards: Array = cards.duplicate()
	sorted_cards.sort_custom(func(a, b):
		var da: float = float(a.get("correct_year", 0)) * 10000.0 + float(a.get("correct_month", 0)) * 100.0 + float(a.get("correct_day", 0))
		var db: float = float(b.get("correct_year", 0)) * 10000.0 + float(b.get("correct_month", 0)) * 100.0 + float(b.get("correct_day", 0))
		return da < db
	)
	var filled_slots: Array = []
	for t: String in timeline:
		if t:
			filled_slots.append(t)
	if filled_slots.size() < cards.size():
		result["failure_reasons"].append("还有卡片未放置到时间线上。")
	else:
		for i: int in range(min(sorted_cards.size(), timeline.size())):
			var expected_id: String = sorted_cards[i]["id"]
			var placed_id: String = timeline[i]
			if placed_id == expected_id:
				result["cards_correct"] = int(result["cards_correct"]) + 1
			else:
				result["cards_wrong"].append({
					"slot": i,
					"expected": expected_id,
					"actual": placed_id
				})
	result["all_cards_correct"] = int(result["cards_correct"]) == int(result["cards_total"])
	for c: Dictionary in cards:
		var cid: String = c["id"]
		var correct_tags: Array = c.get("correct_tags", [])
		var player_tags: Array = card_tags.get(cid, [])
		result["tags_total"] = int(result["tags_total"]) + correct_tags.size()
		for ct: String in correct_tags:
			if player_tags.has(ct):
				result["tags_correct"] = int(result["tags_correct"]) + 1
			else:
				result["tags_wrong"].append({"card_id": cid, "missing_tag": ct})
		for pt: String in player_tags:
			if not correct_tags.has(pt):
				result["tags_wrong"].append({"card_id": cid, "wrong_tag": pt})
	result["all_tags_correct"] = int(result["tags_correct"]) == int(result["tags_total"]) and Array(result["tags_wrong"]).size() == 0
	if expected_links_arr.size() > 0:
		for el: Dictionary in expected_links_arr:
			var matched: bool = false
			for pl: Dictionary in linked_pairs:
				var pa_match: bool = (str(pl.get("from", "")) == str(el.get("from", "")) and str(pl.get("to", "")) == str(el.get("to", "")))
				var pb_match: bool = (str(pl.get("from", "")) == str(el.get("to", "")) and str(pl.get("to", "")) == str(el.get("from", "")))
				if pa_match or pb_match:
					matched = true
					result["links_correct"] = int(result["links_correct"]) + 1
					break
			if not matched:
				result["links_wrong"].append(el)
		result["all_links_correct"] = int(result["links_correct"]) == int(result["links_total"])
	var failures: Array = current_level_config.get("failure_messages", [])
	if not result["all_cards_correct"]:
		if failures.size() > 0:
			result["failure_reasons"].append(failures[0])
	if not result["all_tags_correct"] and failures.size() > 1:
		result["failure_reasons"].append(failures[1])
	if not result["all_links_correct"] and failures.size() > 2:
		result["failure_reasons"].append(failures[2])
	var denom: float = float(int(result["cards_total"]) + int(result["tags_total"]) + max(1, int(result["links_total"])))
	var score_ratio: float = 0.0
	if denom > 0.0:
		score_ratio = float(int(result["cards_correct"]) + int(result["tags_correct"]) + int(result["links_correct"])) / denom
	result["passed"] = result["all_cards_correct"] and result["all_tags_correct"] and result["all_links_correct"]
	result["score_ratio"] = score_ratio
	return result

func _calculate_final_score(result: Dictionary) -> int:
	var sc: Dictionary = (ConfigManager.scoring_config).duplicate(true)
	var score: int = int(sc.get("base_score", 0))
	score += int(result.get("cards_correct", 0)) * int(sc.get("per_card_correct", 0))
	score += int(result.get("tags_correct", 0)) * int(sc.get("per_tag_correct", 0))
	score += int(result.get("links_correct", 0)) * int(sc.get("per_link_correct", 0))
	var time_limit: float = float(current_level_config.get("time_limit", 0))
	if time_limit > 0.0 and play_time < time_limit:
		var saved: float = time_limit - play_time
		score += int(saved * float(sc.get("time_bonus_multiplier", 0.0)))
	var hint_penalties: Array = sc.get("hint_penalty", [0, 0, 0, 0])
	if hints_used >= 0 and hints_used < hint_penalties.size():
		score -= int(hint_penalties[hints_used])
	var attempt_penalty: int = int(sc.get("attempt_penalty", 0))
	score -= (attempts - 1) * attempt_penalty
	if hints_used == 0:
		score += int(sc.get("no_hint_bonus", 0))
	if attempts == 1 and result.get("all_cards_correct", false):
		score += int(sc.get("first_try_bonus", 0))
	if result.get("perfect", false):
		score += int(sc.get("perfect_bonus", 0))
	return max(0, score)

func _get_grade(score: int) -> String:
	var grades: Array = ConfigManager.scoring_config.get("grades", [])
	for g: Dictionary in grades:
		if score >= int(g.get("min_score", 0)):
			return str(g.get("grade", "D"))
	return "D"

func get_grade_color(grade: String) -> Color:
	var grades: Array = ConfigManager.scoring_config.get("grades", [])
	for g: Dictionary in grades:
		if str(g.get("grade", "")) == grade:
			return Color(str(g.get("color", "#FFFFFF")))
	return Color.WHITE

func toggle_pause() -> void:
	if current_state == GameState.PLAYING:
		change_state(GameState.PAUSED)
		EventBus.emit_signal("game_paused")
	elif current_state == GameState.PAUSED:
		change_state(GameState.PLAYING)
		EventBus.emit_signal("game_resumed")

func restart_level() -> void:
	if not current_level_id.is_empty():
		start_level(current_level_id)

func back_to_menu() -> void:
	change_state(GameState.MENU)
	current_level_id = ""
	current_level_config = {}
	game_state_data = {}

func get_card_data(card_id: String) -> Dictionary:
	var cards: Array = current_level_config.get("cards", [])
	for c: Dictionary in cards:
		if str(c["id"]) == card_id:
			return c.duplicate(true)
	return {}

func get_unplaced_card_ids() -> Array:
	return Array(game_state_data.get("unplaced_cards", [])).duplicate()

func get_timeline_slot_card_id(slot_index: int) -> String:
	var timeline: Array = game_state_data.get("timeline", [])
	if slot_index >= 0 and slot_index < timeline.size():
		return str(timeline[slot_index])
	return ""

func get_timeline_size() -> int:
	return Array(game_state_data.get("timeline", [])).size()

func get_card_tags(card_id: String) -> Array:
	var card_tags: Dictionary = game_state_data.get("card_tags", {})
	return Array(card_tags.get(card_id, [])).duplicate()

func get_linked_pairs() -> Array:
	return Array(game_state_data.get("linked_pairs", [])).duplicate()

func set_animation_speed(speed: float) -> void:
	animation_speed = clamp(speed, 0.1, 3.0)
