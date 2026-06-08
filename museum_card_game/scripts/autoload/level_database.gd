extends Node

var levels: Array = []
var exhibits: Dictionary = {}
var events: Array = []

func _ready() -> void:
	_load_levels()
	_load_exhibits()
	_load_events()

func _load_levels() -> void:
	var file = FileAccess.open("res://data/levels.json", FileAccess.READ)
	if file:
		var json = JSON.new()
		if json.parse(file.get_as_text()) == OK:
			var data = json.data
			if data is Dictionary and data.has("levels"):
				levels = data["levels"]
		file.close()

func _load_exhibits() -> void:
	var file = FileAccess.open("res://data/exhibits.json", FileAccess.READ)
	if file:
		var json = JSON.new()
		if json.parse(file.get_as_text()) == OK:
			var data = json.data
			if data is Dictionary and data.has("exhibits"):
				for exhibit in data["exhibits"]:
					exhibits[exhibit["id"]] = exhibit
		file.close()

func _load_events() -> void:
	var file = FileAccess.open("res://data/events.json", FileAccess.READ)
	if file:
		var json = JSON.new()
		if json.parse(file.get_as_text()) == OK:
			var data = json.data
			if data is Dictionary and data.has("events"):
				events = data["events"]
		file.close()

func get_level(id: int) -> Dictionary:
	for level in levels:
		if level.get("id") == id:
			return level
	return {}

func get_exhibit(id: String) -> Dictionary:
	if exhibits.has(id):
		return exhibits[id]
	return {}

func get_events_for_turn(turn: int) -> Array:
	var result = []
	for event in events:
		if event.get("min_turn", 0) <= turn:
			result.append(event)
	return result

func get_all_levels() -> Array:
	return levels
