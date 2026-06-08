extends Node

var cards: Dictionary = {}
var unlocked_cards: Array = []

func _ready() -> void:
	var file = FileAccess.open("res://data/cards.json", FileAccess.READ)
	if file:
		var json = JSON.new()
		if json.parse(file.get_as_text()) == OK:
			var data = json.data
			if data is Dictionary and data.has("cards"):
				for card in data["cards"]:
					cards[card["id"]] = card
		file.close()

func get_card(id: String) -> Dictionary:
	if cards.has(id):
		return cards[id]
	return {}

func unlock_card(id: String) -> void:
	if not id in unlocked_cards:
		unlocked_cards.append(id)

func get_unlocked_cards() -> Array:
	return unlocked_cards

func get_cards_for_level(level_id: int) -> Array:
	var result = []
	for card_id in unlocked_cards:
		if cards.has(card_id):
			var card = cards[card_id]
			if card.get("unlock_level", 0) <= level_id:
				result.append(card_id)
	return result
