extends Node
## 存档管理器 - 处理玩家进度的持久化
## 分槽位存储：全局数据(总星数、已解锁卡) + 槽位数据(章节进度、卡组、统计)

signal save_created(slot_index: int)
signal save_loaded(slot_index: int)
signal save_deleted(slot_index: int)

const SLOT_COUNT := 3
const GLOBAL_PATH := "user://global_save.dat"
const SLOT_PATH_PATTERN := "user://save_slot_%d.dat"
const MAGIC := "MCRB_SAVE_01"

var global_data: Dictionary = {
	"unlocked_cards": [],
	"total_stars": 0,
	"unlocked_chapters": ["chapter_1"],
	"statistics": {
		"total_battles": 0,
		"total_victories": 0,
		"cards_played_total": 0,
		"exhibits_restored": 0,
		"play_time_seconds": 0,
		"most_used_card": "",
		"card_usage_count": {},
	},
	"play_start_time": 0,
}

var slot_data: Array[Dictionary] = []
var current_slot: int = -1

func _ready() -> void:
	_init_slots()
	_load_global()
	global_data.play_start_time = Time.get_unix_time_from_system()

func _init_slots() -> void:
	slot_data.clear()
	for i in SLOT_COUNT:
		slot_data.append(_empty_slot())

func _empty_slot() -> Dictionary:
	return {
		"exists": false,
		"timestamp": 0,
		"chapter_progress": {
			"chapter_1": {
				"unlocked": true,
				"completed_levels": {},
				"current_level": "level_1_1",
			},
		},
		"player_deck": [],
		"player_collection": [],
		"statistics": {
			"battles": 0,
			"wins": 0,
			"cards_played": 0,
			"exhibits_restored": 0,
		},
	}

func _slot_path(idx: int) -> String:
	return SLOT_PATH_PATTERN % idx

func save_global() -> void:
	_update_playtime()
	var f: FileAccess = FileAccess.open(GLOBAL_PATH, FileAccess.WRITE)
	if f:
		f.store_string(MAGIC)
		f.store_var(global_data, true)
		f.close()

func _load_global() -> void:
	if not FileAccess.file_exists(GLOBAL_PATH):
		return
	var f: FileAccess = FileAccess.open(GLOBAL_PATH, FileAccess.READ)
	if f:
		var m: String = f.get_string(MAGIC.length())
		if m == MAGIC:
			global_data = f.get_var(true)
		f.close()

func has_slot(idx: int) -> bool:
	if idx < 0 or idx >= SLOT_COUNT:
		return false
	if slot_data[idx].exists:
		return true
	return FileAccess.file_exists(_slot_path(idx))

func get_slot_info(idx: int) -> Dictionary:
	if idx < 0 or idx >= SLOT_COUNT:
		return {}
	if not slot_data[idx].exists and FileAccess.file_exists(_slot_path(idx)):
		_load_slot(idx)
	return slot_data[idx]

func create_slot(idx: int) -> void:
	if idx < 0 or idx >= SLOT_COUNT:
		return
	slot_data[idx] = _empty_slot()
	slot_data[idx].exists = true
	slot_data[idx].timestamp = Time.get_unix_time_from_system()
	slot_data[idx].player_deck = CardDatabase.get_default_deck()
	slot_data[idx].player_collection = CardDatabase.get_default_collection()
	_save_slot(idx)
	save_global()
	save_created.emit(idx)

func _save_slot(idx: int) -> void:
	if idx < 0 or idx >= SLOT_COUNT:
		return
	slot_data[idx].timestamp = Time.get_unix_time_from_system()
	var f: FileAccess = FileAccess.open(_slot_path(idx), FileAccess.WRITE)
	if f:
		f.store_string(MAGIC)
		f.store_var(slot_data[idx], true)
		f.close()

func _load_slot(idx: int) -> void:
	if idx < 0 or idx >= SLOT_COUNT:
		return
	var path: String = _slot_path(idx)
	if not FileAccess.file_exists(path):
		return
	var f: FileAccess = FileAccess.open(path, FileAccess.READ)
	if f:
		var m: String = f.get_string(MAGIC.length())
		if m == MAGIC:
			slot_data[idx] = f.get_var(true)
			slot_data[idx].exists = true
		f.close()

func load_slot(idx: int) -> void:
	if idx < 0 or idx >= SLOT_COUNT:
		return
	_load_slot(idx)
	current_slot = idx
	save_loaded.emit(idx)

func save_current() -> void:
	if current_slot >= 0:
		_save_slot(current_slot)
		_update_playtime()
		save_global()

func delete_slot(idx: int) -> void:
	if idx < 0 or idx >= SLOT_COUNT:
		return
	slot_data[idx] = _empty_slot()
	var p: String = _slot_path(idx)
	if FileAccess.file_exists(p):
		DirAccess.remove_absolute(p)
	save_deleted.emit(idx)

func get_current_deck() -> Array:
	if current_slot < 0:
		return []
	return slot_data[current_slot].player_deck.duplicate()

func set_current_deck(deck: Array) -> void:
	if current_slot < 0:
		return
	slot_data[current_slot].player_deck = deck.duplicate()
	save_current()

func get_current_collection() -> Array:
	if current_slot < 0:
		return []
	return slot_data[current_slot].player_collection.duplicate()

func add_to_collection(card_id: String) -> bool:
	if current_slot < 0:
		return false
	var coll: Array = slot_data[current_slot].player_collection
	if not card_id in coll:
		coll.append(card_id)
		global_data.unlocked_cards = global_data.get("unlocked_cards", [])
		if not card_id in global_data.unlocked_cards:
			global_data.unlocked_cards.append(card_id)
		save_current()
		GameEvents.card_unlocked.emit(card_id)
		return true
	return false

func record_level_completed(level_id: String, stars: int, stats: Dictionary) -> void:
	if current_slot < 0:
		return
	var sd: Dictionary = slot_data[current_slot]
	var ch_id: String = _chapter_from_level(level_id)
	if not ch_id in sd.chapter_progress:
		sd.chapter_progress[ch_id] = {
			"unlocked": true, "completed_levels": {}, "current_level": level_id
		}
	var prev: int = sd.chapter_progress[ch_id].completed_levels.get(level_id, 0)
	if stars > prev:
		sd.chapter_progress[ch_id].completed_levels[level_id] = stars
	sd.statistics.battles += 1
	if stars > 0:
		sd.statistics.wins += 1
	sd.statistics.cards_played += int(stats.get("cards_played", 0))
	sd.statistics.exhibits_restored += int(stats.get("exhibits_restored", 0))
	global_data.total_battles += 1
	if stars > 0:
		global_data.total_victories += 1
	global_data.cards_played_total += int(stats.get("cards_played", 0))
	global_data.exhibits_restored += int(stats.get("exhibits_restored", 0))
	var usage: Dictionary = global_data.statistics.get("card_usage_count", {})
	for cid in stats.get("cards_used_list", []):
		usage[cid] = usage.get(cid, 0) + 1
	global_data.statistics.card_usage_count = usage
	var delta_stars: int = max(0, stars - prev)
	global_data.total_stars += delta_stars
	save_current()
	GameEvents.level_completed.emit(level_id, stars, stats)

func get_level_stars(level_id: String) -> int:
	if current_slot < 0:
		return 0
	var ch_id: String = _chapter_from_level(level_id)
	var sd: Dictionary = slot_data[current_slot]
	if ch_id in sd.chapter_progress:
		return sd.chapter_progress[ch_id].completed_levels.get(level_id, 0)
	return 0

func unlock_chapter(chapter_id: String) -> void:
	if not chapter_id in global_data.unlocked_chapters:
		global_data.unlocked_chapters.append(chapter_id)
		save_global()
		GameEvents.chapter_unlocked.emit(chapter_id)
	if current_slot >= 0:
		if not chapter_id in slot_data[current_slot].chapter_progress:
			slot_data[current_slot].chapter_progress[chapter_id] = {
				"unlocked": true, "completed_levels": {}, "current_level": ""
			}
		save_current()

func _chapter_from_level(level_id: String) -> String:
	var parts: PackedStringArray = level_id.split("_")
	if parts.size() >= 3:
		return "chapter_%s" % parts[1]
	return "chapter_1"

func _update_playtime() -> void:
	var now: int = Time.get_unix_time_from_system()
	if global_data.play_start_time > 0:
		global_data.statistics.play_time_seconds += (now - global_data.play_start_time)
	global_data.play_start_time = now

## ============== 统计视图公共 API ==============
func get_global_stats() -> Dictionary:
	_update_playtime()
	return global_data.statistics.duplicate(true)

func get_unlocked_cards() -> Array:
	return global_data.get("unlocked_cards", []).duplicate()

func get_unlocked_chapters() -> Array:
	return global_data.get("unlocked_chapters", []).duplicate()

func get_slot_data(idx: int) -> Dictionary:
	if idx < 0 or idx >= SLOT_COUNT:
		return {}
	get_slot_info(idx)
	return slot_data[idx].duplicate(true)

func get_total_stars() -> int:
	return int(global_data.get("total_stars", 0))
