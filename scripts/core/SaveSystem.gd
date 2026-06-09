extends Node
## 存档系统 - 管理玩家进度、设置、成就数据

signal save_loaded()
signal save_saved()

const SAVE_FILE := "user://savegame.save"
const SETTINGS_FILE := "user://settings.save"

var save_data: Dictionary = {
    "level_progress": {},
    "achievements": {},
    "leaderboard_scores": {},
    "daily_completed": false,
    "daily_date": "",
    "total_score": 0,
    "games_played": 0,
    "items_placed": 0,
    "perfect_levels": 0
}

var settings_data: Dictionary = {
    "master_volume": 0.8,
    "sfx_volume": 0.8,
    "music_volume": 0.6,
    "vibration_enabled": true,
    "show_hints": true,
    "high_contrast": false,
    "language": "zh_CN"
}

func _ready() -> void:
    load_all()

func load_all() -> void:
    load_settings()
    load_game()

func load_settings() -> bool:
    var file := FileAccess.open(SETTINGS_FILE, FileAccess.READ)
    if file == null:
        return false
    var data: String = file.get_as_text()
    file.close()
    if data.is_empty():
        return false
    var parsed: Variant = JSON.parse_string(data)
    if typeof(parsed) == TYPE_DICTIONARY:
        for key in parsed.keys():
            settings_data[key] = parsed[key]
    return true

func save_settings() -> bool:
    var file := FileAccess.open(SETTINGS_FILE, FileAccess.WRITE)
    if file == null:
        return false
    file.store_string(JSON.stringify(settings_data))
    file.close()
    return true

func load_game() -> bool:
    var file := FileAccess.open(SAVE_FILE, FileAccess.READ)
    if file == null:
        save_loaded.emit()
        return false
    var data: String = file.get_as_text()
    file.close()
    if data.is_empty():
        save_loaded.emit()
        return false
    var parsed: Variant = JSON.parse_string(data)
    if typeof(parsed) == TYPE_DICTIONARY:
        for key in parsed.keys():
            save_data[key] = parsed[key]
    save_loaded.emit()
    return true

func save_game() -> bool:
    var file := FileAccess.open(SAVE_FILE, FileAccess.WRITE)
    if file == null:
        return false
    file.store_string(JSON.stringify(save_data))
    file.close()
    save_saved.emit()
    return true

func set_level_progress(level_id: int, score: int, stars: int, completed: bool = true) -> void:
    var key: String = str(level_id)
    if not save_data["level_progress"].has(key):
        save_data["level_progress"][key] = {"score": 0, "stars": 0, "completed": false}
    var level_data: Dictionary = save_data["level_progress"][key]
    if score > level_data["score"]:
        level_data["score"] = score
    if stars > level_data["stars"]:
        level_data["stars"] = stars
    if completed:
        level_data["completed"] = true
    save_data["total_score"] = int(save_data["total_score"]) + max(0, score - int(level_data.get("previous_score", 0)))
    level_data["previous_score"] = score
    if stars == 3:
        save_data["perfect_levels"] = int(save_data["perfect_levels"]) + 1
    save_game()

func get_level_progress(level_id: int) -> Dictionary:
    var key: String = str(level_id)
    if save_data["level_progress"].has(key):
        return save_data["level_progress"][key].duplicate(true)
    return {"score": 0, "stars": 0, "completed": false}

func is_level_unlocked(level_id: int) -> bool:
    if level_id <= 1:
        return true
    var prev: Dictionary = get_level_progress(level_id - 1)
    return prev.get("completed", false) or prev.get("stars", 0) > 0

func set_achievement_unlocked(achievement_id: String, unlocked: bool = true) -> void:
    save_data["achievements"][achievement_id] = {
        "unlocked": unlocked,
        "unlock_date": Time.get_date_string_from_system()
    }
    save_game()

func is_achievement_unlocked(achievement_id: String) -> bool:
    if save_data["achievements"].has(achievement_id):
        return save_data["achievements"][achievement_id].get("unlocked", false)
    return false

func record_daily_completed(score: int) -> void:
    var today: String = Time.get_date_string_from_system()
    save_data["daily_completed"] = true
    save_data["daily_date"] = today
    if not save_data["leaderboard_scores"].has("daily"):
        save_data["leaderboard_scores"]["daily"] = []
    var daily_scores: Array = save_data["leaderboard_scores"]["daily"]
    daily_scores.append({"date": today, "score": score})
    if daily_scores.size() > 30:
        daily_scores.remove_at(0)
    save_game()

func is_daily_completed() -> bool:
    var today: String = Time.get_date_string_from_system()
    return save_data.get("daily_completed", false) and save_data.get("daily_date", "") == today

func add_stats(items_placed: int = 0, game_played: bool = false) -> void:
    save_data["items_placed"] = int(save_data["items_placed"]) + items_placed
    if game_played:
        save_data["games_played"] = int(save_data["games_played"]) + 1
    save_game()

func reset_all() -> void:
    save_data = {
        "level_progress": {},
        "achievements": {},
        "leaderboard_scores": {},
        "daily_completed": false,
        "daily_date": "",
        "total_score": 0,
        "games_played": 0,
        "items_placed": 0,
        "perfect_levels": 0
    }
    save_game()

func get_total_stars() -> int:
    var total: int = 0
    for level_data in save_data["level_progress"].values():
        total += int(level_data.get("stars", 0))
    return total
