extends Node

const SAVE_PATH = "user://save_game.json"

var _auto_save_timer: Timer

func _ready() -> void:
	_auto_save_timer = Timer.new()
	_auto_save_timer.wait_time = 60.0
	_auto_save_timer.autostart = true
	_auto_save_timer.timeout.connect(auto_save)
	add_child(_auto_save_timer)

func save_game(data: SaveData) -> bool:
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	var json_string = JSON.stringify(data.to_dict())
	file.store_string(json_string)
	file.close()
	return true

func load_game() -> SaveData:
	if not FileAccess.file_exists(SAVE_PATH):
		return null
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return null
	var json_string = file.get_as_text()
	file.close()
	var json = JSON.new()
	var error = json.parse(json_string)
	if error != OK:
		return null
	if not json.data is Dictionary:
		return null
	return SaveData.from_dict(json.data)

func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

func delete_save() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)

func auto_save() -> void:
	if not GameManager or not GameManager.is_game_active:
		return
	var data: SaveData = load_game()
	if data == null:
		data = SaveData.new()
	data.money = GameManager.money
	data.reputation = GameManager.reputation
	data.last_save_timestamp = int(Time.get_unix_time_from_system())
	data.play_time_seconds += 60.0
	save_game(data)

func get_save_info() -> Dictionary:
	var data = load_game()
	if data == null:
		return {}
	return {
		"level": data.current_level,
		"money": data.money,
		"play_time": data.play_time_seconds
	}

func record_level_completion(level_id: String, stars: int) -> void:
	var data: SaveData = load_game()
	if data == null:
		data = SaveData.new()
	if not data.completed_levels.has(level_id):
		data.completed_levels[level_id] = {"stars": stars}
	else:
		var existing: Dictionary = data.completed_levels[level_id]
		if stars > existing.get("stars", 0):
			existing["stars"] = stars
	data.last_save_timestamp = int(Time.get_unix_time_from_system())
	save_game(data)

func record_level_failure(level_id: String, reason: String) -> void:
	var data: SaveData = load_game()
	if data == null:
		data = SaveData.new()
	data.total_failures += 1
	data.last_save_timestamp = int(Time.get_unix_time_from_system())
	save_game(data)
