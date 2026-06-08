extends Node

const SAVE_PATH := "user://museum_card_repair_save.json"

signal save_completed(success: bool)
signal load_completed(success: bool)

func save_game() -> bool:
	var save_data := {
		"version": 1,
		"game_manager": _serialize_game_manager(),
		"deck": _serialize_deck(),
		"analytics": GameManager.get_analytics(),
	}
	var json_string = JSON.stringify(save_data, "\t")
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		save_completed.emit(false)
		return false
	file.store_string(json_string)
	file.close()
	save_completed.emit(true)
	return true

func load_game() -> bool:
	if not FileAccess.file_exists(SAVE_PATH):
		load_completed.emit(false)
		return false
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		load_completed.emit(false)
		return false
	var json_string = file.get_as_text()
	file.close()
	var json = JSON.new()
	var error = json.parse(json_string)
	if error != OK:
		load_completed.emit(false)
		return false
	var save_data = json.data
	if not save_data is Dictionary:
		load_completed.emit(false)
		return false
	_deserialize_game_manager(save_data.get("game_manager", {}))
	_deserialize_deck(save_data.get("deck", {}))
	_deserialize_analytics(save_data.get("analytics", {}))
	load_completed.emit(true)
	return true

func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

func delete_save() -> bool:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)
		return true
	return false

func _serialize_game_manager() -> Dictionary:
	return {
		"current_chapter": GameManager.current_chapter,
		"current_level": GameManager.current_level,
		"difficulty_multiplier": GameManager.difficulty_multiplier,
	}

func _serialize_deck() -> Dictionary:
	var deck = GameManager.player_deck
	if not deck:
		return {"cards": []}
	var cards := []
	for card_id in deck.get_all_card_ids():
		cards.append(card_id)
	return {"cards": cards}

func _deserialize_game_manager(data: Dictionary) -> void:
	if data.has("current_chapter"):
		GameManager.current_chapter = int(data["current_chapter"])
	if data.has("current_level"):
		GameManager.current_level = int(data["current_level"])
	if data.has("difficulty_multiplier"):
		GameManager.difficulty_multiplier = float(data["difficulty_multiplier"])

func _deserialize_deck(data: Dictionary) -> void:
	GameManager.player_deck = Deck.new()
	if data.has("cards"):
		for card_id in data["cards"]:
			var card = GameResources.create_card_by_id(str(card_id))
			if card:
				GameManager.player_deck.add_card(card)

func _deserialize_analytics(data: Dictionary) -> void:
	var analytics = GameManager.get_analytics()
	if data.has("failure_steps"):
		analytics["failure_steps"] = data["failure_steps"]
	if data.has("retry_counts"):
		analytics["retry_counts"] = data["retry_counts"]
	if data.has("tutorial_skipped"):
		analytics["tutorial_skipped"] = data["tutorial_skipped"]
	if data.has("total_plays"):
		analytics["total_plays"] = int(data["total_plays"])
	if data.has("total_wins"):
		analytics["total_wins"] = int(data["total_wins"])
	if data.has("chapters_completed"):
		analytics["chapters_completed"] = int(data["chapters_completed"])

func _ready() -> void:
	if has_save():
		load_game()
