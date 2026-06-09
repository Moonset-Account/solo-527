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
	global_data["play_start_time"] = Time.get_unix_time_from_system()

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
	if slot_data[idx].get("exists", false):
		return true
	return FileAccess.file_exists(_slot_path(idx))

func get_slot_info(idx: int) -> Dictionary:
	if idx < 0 or idx >= SLOT_COUNT:
		return {}
	if not slot_data[idx].get("exists", false) and FileAccess.file_exists(_slot_path(idx)):
		_load_slot(idx)
	return slot_data[idx]

func create_slot(idx: int) -> void:
	if idx < 0 or idx >= SLOT_COUNT:
		return
	slot_data[idx] = _empty_slot()
	slot_data[idx]["exists"] = true
	slot_data[idx]["timestamp"] = Time.get_unix_time_from_system()
	slot_data[idx]["player_deck"] = CardDatabase.get_default_deck()
	slot_data[idx]["player_collection"] = CardDatabase.get_default_collection()
	_save_slot(idx)
	save_global()
	save_created.emit(idx)

func _save_slot(idx: int) -> void:
	if idx < 0 or idx >= SLOT_COUNT:
		return
	slot_data[idx]["timestamp"] = Time.get_unix_time_from_system()
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
			slot_data[idx]["exists"] = true
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
	return slot_data[current_slot].get("player_deck", []).duplicate()

func set_current_deck(deck: Array) -> void:
	if current_slot < 0:
		return
	slot_data[current_slot]["player_deck"] = deck.duplicate()
	save_current()

func get_current_collection() -> Array:
	if current_slot < 0:
		return []
	return slot_data[current_slot].get("player_collection", []).duplicate()

func add_to_collection(card_id: String) -> bool:
	if current_slot < 0:
		return false
	var coll: Array = slot_data[current_slot].get("player_collection", [])
	if not card_id in coll:
		coll.append(card_id)
		slot_data[current_slot]["player_collection"] = coll
		if not global_data.has("unlocked_cards"):
			global_data["unlocked_cards"] = []
		var gl: Array = global_data["unlocked_cards"]
		if not card_id in gl:
			gl.append(card_id)
			global_data["unlocked_cards"] = gl
		save_current()
		GameEvents.card_unlocked.emit(card_id)
		return true
	return false

func record_level_completed(level_id: String, stars: int, stats: Dictionary) -> void:
	if current_slot < 0:
		return
	var sd: Dictionary = slot_data[current_slot]
	var ch_id: String = _chapter_from_level(level_id)
	if not sd.has("chapter_progress"):
		sd["chapter_progress"] = {}
	if not ch_id in sd["chapter_progress"]:
		sd["chapter_progress"][ch_id] = {
			"unlocked": true, "completed_levels": {}, "current_level": level_id
		}
	var ch_prog: Dictionary = sd["chapter_progress"][ch_id]
	if not ch_prog.has("completed_levels"):
		ch_prog["completed_levels"] = {}
	var prev: int = int(ch_prog["completed_levels"].get(level_id, 0))
	if stars > prev:
		ch_prog["completed_levels"][level_id] = stars
	if not sd.has("statistics"):
		sd["statistics"] = {"battles": 0, "wins": 0, "cards_played": 0, "exhibits_restored": 0}
	var sst: Dictionary = sd["statistics"]
	sst["battles"] = int(sst.get("battles", 0)) + 1
	if stars > 0:
		sst["wins"] = int(sst.get("wins", 0)) + 1
	sst["cards_played"] = int(sst.get("cards_played", 0)) + int(stats.get("cards_played", 0))
	sst["exhibits_restored"] = int(sst.get("exhibits_restored", 0)) + int(stats.get("exhibits_restored", 0))
	sd["statistics"] = sst
	if not global_data.has("statistics"):
		global_data["statistics"] = {}
	var gst: Dictionary = global_data["statistics"]
	gst["total_battles"] = int(gst.get("total_battles", 0)) + 1
	if stars > 0:
		gst["total_victories"] = int(gst.get("total_victories", 0)) + 1
	gst["cards_played_total"] = int(gst.get("cards_played_total", 0)) + int(stats.get("cards_played", 0))
	gst["exhibits_restored"] = int(gst.get("exhibits_restored", 0)) + int(stats.get("exhibits_restored", 0))
	var usage: Dictionary = gst.get("card_usage_count", {})
	for cid in stats.get("cards_used_list", []):
		usage[cid] = int(usage.get(cid, 0)) + 1
	gst["card_usage_count"] = usage
	var max_cnt: int = 0
	var best_id: String = ""
	for key in usage.keys():
		if int(usage[key]) > max_cnt:
			max_cnt = int(usage[key])
			best_id = key
	if best_id != "":
		gst["most_used_card"] = best_id
	global_data["statistics"] = gst
	var delta_stars: int = max(0, stars - prev)
	global_data["total_stars"] = int(global_data.get("total_stars", 0)) + delta_stars
	save_current()
	GameEvents.level_completed.emit(level_id, stars, stats)

func get_level_stars(level_id: String) -> int:
	if current_slot < 0:
		return 0
	var ch_id: String = _chapter_from_level(level_id)
	var sd: Dictionary = slot_data[current_slot]
	if sd.has("chapter_progress") and ch_id in sd["chapter_progress"]:
		var ch_prog: Dictionary = sd["chapter_progress"][ch_id]
		if ch_prog.has("completed_levels"):
			return int(ch_prog["completed_levels"].get(level_id, 0))
	return 0

func unlock_chapter(chapter_id: String) -> void:
	if not global_data.has("unlocked_chapters"):
		global_data["unlocked_chapters"] = ["chapter_1"]
	if not chapter_id in global_data["unlocked_chapters"]:
		var chs: Array = global_data["unlocked_chapters"]
		chs.append(chapter_id)
		global_data["unlocked_chapters"] = chs
		save_global()
		GameEvents.chapter_unlocked.emit(chapter_id)
	if current_slot >= 0:
		if not slot_data[current_slot].has("chapter_progress"):
			slot_data[current_slot]["chapter_progress"] = {}
		if not chapter_id in slot_data[current_slot]["chapter_progress"]:
			slot_data[current_slot]["chapter_progress"][chapter_id] = {
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
	var pst: int = int(global_data.get("play_start_time", 0))
	if pst > 0:
		if not global_data.has("statistics"):
			global_data["statistics"] = {}
		var gst: Dictionary = global_data["statistics"]
		gst["play_time_seconds"] = int(gst.get("play_time_seconds", 0)) + (now - pst)
		global_data["statistics"] = gst
	global_data["play_start_time"] = now

## ============== 统计视图公共 API ==============
func get_global_stats() -> Dictionary:
	_update_playtime()
	return global_data.get("statistics", {}).duplicate(true)

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
