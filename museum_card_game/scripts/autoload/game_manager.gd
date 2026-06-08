extends Node

enum GameState { MENU, TUTORIAL, PLAYING, EVENT, SETTLEMENT }

signal game_state_changed(new_state: GameState)
signal budget_changed(new_budget: int)
signal turn_started(turn_number: int)
signal exhibit_changed(exhibit_index: int)
signal card_played(card_data: Dictionary)
signal event_triggered(event_data: Dictionary)
signal level_completed(level_id: int, victory: bool)

var current_state: GameState = GameState.MENU
var current_level_id: int = -1
var budget: int = 0
var turn_number: int = 0
var max_turns: int = 0
var exhibits: Array = []
var deck: Array = []
var hand: Array = []
var discard: Array = []
var event_chance: float = 0.0
var active_effects: Dictionary = {}
var display_costs: Dictionary = {}
var max_unlocked_level: int = 1

func _ready() -> void:
	load_progress()

func save_progress() -> void:
	var save_data = {
		"max_unlocked_level": max_unlocked_level,
		"unlocked_cards": CardDatabase.get_unlocked_cards()
	}
	var file = FileAccess.open("user://save_game.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data))
		file.close()

func load_progress() -> void:
	if not FileAccess.file_exists("user://save_game.json"):
		return
	var file = FileAccess.open("user://save_game.json", FileAccess.READ)
	if not file:
		return
	var json = JSON.new()
	if json.parse(file.get_as_text()) == OK:
		var data = json.data
		if data is Dictionary:
			max_unlocked_level = int(data.get("max_unlocked_level", 1))
			for card_id in data.get("unlocked_cards", []):
				CardDatabase.unlock_card(card_id)
	file.close()

func start_level(level_id: int) -> void:
	var level_data = LevelDatabase.get_level(level_id)
	if level_data.is_empty():
		push_error("[GM] start_level: level not found: " + str(level_id))
		return

	current_level_id = level_id
	budget = level_data.get("starting_budget", 5)
	max_turns = level_data.get("max_turns", 10)
	event_chance = level_data.get("event_chance", 0.0)
	turn_number = 1
	exhibits.clear()
	deck.clear()
	hand.clear()
	discard.clear()
	active_effects.clear()
	display_costs.clear()

	for exhibit_id in level_data.get("exhibits", []):
		var exhibit_data = LevelDatabase.get_exhibit(exhibit_id)
		if not exhibit_data.is_empty():
			var runtime_exhibit = exhibit_data.duplicate()
			runtime_exhibit["current_condition"] = exhibit_data.get("starting_condition", exhibit_data.get("max_condition", 10))
			runtime_exhibit["marked"] = false
			runtime_exhibit["prevented"] = false
			runtime_exhibit["extra_degradation"] = 0
			runtime_exhibit["buff_amount"] = 0
			exhibits.append(runtime_exhibit)

	deck = level_data.get("deck_cards", []).duplicate()
	_shuffle_deck()

	for i in range(5):
		draw_card()

	print("[GM] start_level: id=", level_id, " budget=", budget, " exhibits=", exhibits.size(), " hand=", hand.size())
	for ex in exhibits:
		print("[GM]   exhibit: ", ex.get("name", "?"), " condition=", ex.get("current_condition", 0), "/", ex.get("max_condition", 0))

	if level_data.get("is_tutorial", false):
		change_state(GameState.TUTORIAL)
	else:
		change_state(GameState.PLAYING)

	turn_started.emit(turn_number)

func play_card(hand_index: int, exhibit_index: int) -> bool:
	if hand_index < 0 or hand_index >= hand.size():
		return false
	if exhibit_index < 0 or exhibit_index >= exhibits.size():
		return false
	if current_state != GameState.PLAYING and current_state != GameState.TUTORIAL:
		return false

	var card_id = hand[hand_index]
	var card_data = CardDatabase.get_card(card_id)
	if card_data.is_empty():
		return false

	var card_type = card_data.get("card_type", "")

	if card_type == "expert" and active_effects.get("block_expert", 0) > 0:
		return false
	if card_type == "tool" and active_effects.get("block_tools", 0) > 0:
		return false

	var cost = card_data.get("cost", 0)

	if card_type == "tool" and active_effects.get("discount", 0) > 0:
		cost = maxi(0, cost - int(active_effects["discount"]))

	if card_type == "expert" and active_effects.get("free_expert", 0) > 0:
		cost = 0
		active_effects["free_expert"] = int(active_effects["free_expert"]) - 1
		if active_effects["free_expert"] <= 0:
			active_effects.erase("free_expert")

	if budget < cost:
		return false

	budget -= cost
	budget_changed.emit(budget)

	_apply_card_effects(card_data, exhibit_index)

	print("[GM] play_card: ", card_data.get("name", "?"), " -> exhibit[", exhibit_index, "]", " budget=", budget)

	hand.remove_at(hand_index)
	discard.append(card_id)

	card_played.emit(card_data)
	exhibit_changed.emit(exhibit_index)

	_apply_discount_to_hand()

	if check_win():
		print("[GM] WIN detected after play_card!")
		level_completed.emit(current_level_id, true)
		change_state(GameState.SETTLEMENT)
	elif check_loss():
		level_completed.emit(current_level_id, false)
		change_state(GameState.SETTLEMENT)

	return true

func end_turn() -> Dictionary:
	var result = {"won": false, "lost": false, "event": null}

	active_effects.clear()
	display_costs.clear()

	_process_degradation()

	for exhibit in exhibits:
		exhibit["marked"] = false
		exhibit["buff_amount"] = 0

	turn_number += 1
	turn_started.emit(turn_number)

	if check_win():
		result["won"] = true
		level_completed.emit(current_level_id, true)
		change_state(GameState.SETTLEMENT)
		return result

	if check_loss():
		result["lost"] = true
		level_completed.emit(current_level_id, false)
		change_state(GameState.SETTLEMENT)
		return result

	var event_data = _roll_event()
	if not event_data.is_empty():
		result["event"] = event_data
		change_state(GameState.EVENT)
	else:
		change_state(GameState.PLAYING)

	draw_card()
	_apply_discount_to_hand()

	return result

func draw_card() -> void:
	if deck.is_empty():
		if discard.is_empty():
			return
		deck = discard.duplicate()
		discard.clear()
		_shuffle_deck()

	if deck.size() > 0:
		hand.append(deck.pop_back())

func check_win() -> bool:
	for exhibit in exhibits:
		if exhibit["current_condition"] < exhibit["max_condition"]:
			return false
	return true

func check_loss() -> bool:
	for exhibit in exhibits:
		if exhibit["current_condition"] <= 0:
			return true
	if turn_number > max_turns:
		return true
	return false

func get_state() -> GameState:
	return current_state

func change_state(new_state: GameState) -> void:
	if current_state != new_state:
		current_state = new_state
		game_state_changed.emit(new_state)

func retry_level() -> void:
	start_level(current_level_id)

func _apply_card_effects(card_data: Dictionary, exhibit_index: int) -> void:
	var effects = card_data.get("effects", [])
	var exhibit = exhibits[exhibit_index] if exhibit_index >= 0 and exhibit_index < exhibits.size() else {}

	for effect in effects:
		var type = effect.get("type", "")
		var value = effect.get("value", 0)

		match type:
			"restore":
				var restore_amount = value + int(active_effects.get("buff_restore", 0))
				if exhibit.get("marked", false):
					restore_amount += int(exhibit.get("buff_amount", 0))
					exhibit["marked"] = false
					exhibit["buff_amount"] = 0
				exhibit["current_condition"] = mini(exhibit["current_condition"] + restore_amount, exhibit["max_condition"])

			"prevent_degradation":
				exhibit["prevented"] = true

			"gain_budget":
				budget += value
				budget_changed.emit(budget)

			"discount":
				active_effects["discount"] = value

			"reveal_hidden":
				if exhibit.get("hidden_damage", 0) > 0:
					var revealed = mini(value, int(exhibit["hidden_damage"]))
					exhibit["hidden_damage"] = int(exhibit["hidden_damage"]) - revealed
					exhibit["current_condition"] -= revealed

			"buff_next_restore":
				exhibit["marked"] = true
				exhibit["buff_amount"] = value

			"reveal_all_hidden":
				for ex in exhibits:
					if ex.get("hidden_damage", 0) > 0:
						var revealed = int(ex["hidden_damage"])
						ex["current_condition"] -= revealed
						ex["hidden_damage"] = 0

			"add_degradation":
				exhibit["extra_degradation"] = int(exhibit.get("extra_degradation", 0)) + value

			"restore_all":
				for ex in exhibits:
					var restore_amount = value + int(active_effects.get("buff_restore", 0))
					if ex.get("marked", false):
						restore_amount += int(ex.get("buff_amount", 0))
						ex["marked"] = false
						ex["buff_amount"] = 0
					ex["current_condition"] = mini(ex["current_condition"] + restore_amount, ex["max_condition"])

			"restore_if_marked":
				if exhibit.get("marked", false):
					var restore_amount = value + int(active_effects.get("buff_restore", 0)) + int(exhibit.get("buff_amount", 0))
					exhibit["current_condition"] = mini(exhibit["current_condition"] + restore_amount, exhibit["max_condition"])
					exhibit["marked"] = false
					exhibit["buff_amount"] = 0

			"prevent_all_degradation":
				for ex in exhibits:
					ex["prevented"] = true

			"full_restore":
				exhibit["current_condition"] = exhibit["max_condition"]
				exhibit["marked"] = false
				exhibit["buff_amount"] = 0

			"block_expert":
				active_effects["block_expert"] = value

func _process_degradation() -> void:
	for exhibit in exhibits:
		if not exhibit.get("prevented", false):
			var degradation = int(exhibit.get("degradation_rate", 0)) + int(exhibit.get("extra_degradation", 0))
			exhibit["current_condition"] = maxi(exhibit["current_condition"] - degradation, 0)
		exhibit["prevented"] = false
		exhibit["extra_degradation"] = 0

func _roll_event() -> Dictionary:
	if event_chance <= 0.0:
		return {}
	if randf() > event_chance:
		return {}

	var eligible = LevelDatabase.get_events_for_turn(turn_number)
	if eligible.is_empty():
		return {}

	var total_weight = 0.0
	for ev in eligible:
		total_weight += float(ev.get("probability", 0.0))

	if total_weight <= 0.0:
		return {}

	var roll = randf() * total_weight
	var cumulative = 0.0
	var chosen_event = {}
	for ev in eligible:
		cumulative += float(ev.get("probability", 0.0))
		if roll <= cumulative:
			chosen_event = ev
			break

	if chosen_event.is_empty():
		chosen_event = eligible[eligible.size() - 1]

	for effect in chosen_event.get("effects", []):
		var type = effect.get("type", "")
		var value = effect.get("value", 0)

		match type:
			"degrade_all":
				for exhibit in exhibits:
					exhibit["current_condition"] = maxi(exhibit["current_condition"] - value, 0)
			"degrade_random":
				if exhibits.size() > 0:
					var idx = randi() % exhibits.size()
					exhibits[idx]["current_condition"] = maxi(exhibits[idx]["current_condition"] - value, 0)
			"gain_budget":
				budget += value
				budget_changed.emit(budget)
			"free_expert":
				active_effects["free_expert"] = value
			"block_tools":
				active_effects["block_tools"] = value
			"buff_restore":
				active_effects["buff_restore"] = value

	event_triggered.emit(chosen_event)
	return chosen_event

func _shuffle_deck() -> void:
	deck.shuffle()

func _apply_discount_to_hand() -> void:
	display_costs.clear()
	var discount_amount = int(active_effects.get("discount", 0))
	for i in range(hand.size()):
		var card_id = hand[i]
		var card_data = CardDatabase.get_card(card_id)
		if not card_data.is_empty():
			var cost = card_data.get("cost", 0)
			if card_data.get("card_type", "") == "tool" and discount_amount > 0:
				cost = maxi(0, cost - discount_amount)
			if card_data.get("card_type", "") == "expert" and active_effects.get("free_expert", 0) > 0:
				cost = 0
			display_costs[i] = cost
