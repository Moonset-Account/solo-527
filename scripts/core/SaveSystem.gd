extends Node
## 存档系统 - 管理试玩数据记录、进度保存
## 独立模块，不依赖游戏逻辑

const SAVE_PATH: String = "user://museum_card_saves.json"
const MAX_SLOTS: int = 3

var save_data: Dictionary = {
	"slots": {},
	"global_stats": {
		"total_games_played": 0,
		"total_levels_completed": 0,
		"total_cards_played": 0,
		"unlocked_cards": [],
		"unlocked_chapters": ["chapter_1"]
	}
}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_from_disk()

func save_game(slot_id: int, game_state: Dictionary) -> bool:
	if slot_id < 0 or slot_id >= MAX_SLOTS:
		push_warning("SaveSystem: Invalid slot %d" % slot_id)
		return false
	
	var slot_data: Dictionary = {
		"timestamp": Time.get_unix_time_from_system(),
		"current_level": game_state.get("current_level", ""),
		"current_chapter": game_state.get("current_chapter", ""),
		"player_deck": game_state.get("player_deck", []),
		"level_progress": game_state.get("level_progress", {}),
		"session_stats": game_state.get("session_stats", {})
	}
	save_data.slots[str(slot_id)] = slot_data
	_save_to_disk()
	EventBus.publish("save_created", [slot_id, slot_data])
	return true

func load_game(slot_id: int) -> Dictionary:
	var slot_key: String = str(slot_id)
	if not save_data.slots.has(slot_key):
		push_warning("SaveSystem: No save in slot %d" % slot_id)
		return {}
	var data: Dictionary = save_data.slots[slot_key]
	EventBus.publish("save_loaded", [slot_id, data])
	return data

func delete_save(slot_id: int) -> bool:
	var slot_key: String = str(slot_id)
	if not save_data.slots.has(slot_key):
		return false
	save_data.slots.erase(slot_key)
	_save_to_disk()
	return true

func get_save_slots() -> Array:
	var slots: Array = []
	for i in range(MAX_SLOTS):
		var key: String = str(i)
		if save_data.slots.has(key):
			slots.append({"id": i, "data": save_data.slots[key]})
		else:
			slots.append({"id": i, "data": null})
	return slots

func record_stat(stat_name: String, value: int = 1) -> void:
	if save_data.global_stats.has(stat_name):
		save_data.global_stats[stat_name] = (save_data.global_stats[stat_name] as int) + value
	_save_to_disk()

func unlock_card(card_id: String) -> void:
	var unlocked: Array = save_data.global_stats.unlocked_cards
	if card_id not in unlocked:
		unlocked.append(card_id)
		_save_to_disk()

func is_card_unlocked(card_id: String) -> bool:
	return card_id in save_data.global_stats.unlocked_cards

func unlock_chapter(chapter_id: String) -> void:
	var unlocked: Array = save_data.global_stats.unlocked_chapters
	if chapter_id not in unlocked:
		unlocked.append(chapter_id)
		_save_to_disk()

func is_chapter_unlocked(chapter_id: String) -> bool:
	return chapter_id in save_data.global_stats.unlocked_chapters

func get_global_stats() -> Dictionary:
	return save_data.global_stats.duplicate(true)

func _save_to_disk() -> void:
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("SaveSystem: Failed to open save file for writing")
		return
	file.store_string(JSON.stringify(save_data))
	file.close()

func _load_from_disk() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		push_error("SaveSystem: Failed to open save file for reading")
		return
	var content: String = file.get_as_text()
	file.close()
	var result: Variant = JSON.parse_string(content)
	if typeof(result) == TYPE_DICTIONARY:
		save_data = result
	else:
		push_warning("SaveSystem: Save file corrupted, starting fresh")
