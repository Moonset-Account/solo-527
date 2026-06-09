extends Node
## 成就系统 - 定义和解锁成就

signal achievement_unlocked(achievement_id: String, achievement_data: Dictionary)

var ACHIEVEMENTS: Dictionary = {}

func _init() -> void:
    ACHIEVEMENTS = {
        "first_steps": {
            "name": "迈出第一步",
            "description": "完成第一个关卡",
            "icon": "🏠",
            "check_id": "completed_levels",
            "check_value": 1
        },
        "fragile_master": {
            "name": "易碎品大师",
            "description": "在一个关卡中放置3个以上易碎品且无损坏",
            "icon": "🏺",
            "check_id": "fragile_safe_levels",
            "check_value": 1
        },
        "packing_pro": {
            "name": "打包专家",
            "description": "完成5个关卡",
            "icon": "📦",
            "check_id": "completed_levels",
            "check_value": 5
        },
        "star_collector": {
            "name": "星星收集者",
            "description": "获得10颗星星",
            "icon": "⭐",
            "check_id": "total_stars",
            "check_value": 10
        },
        "three_star_king": {
            "name": "三星之王",
            "description": "获得三星评价3次",
            "icon": "👑",
            "check_id": "three_star_count",
            "check_value": 3
        },
        "light_touch": {
            "name": "轻拿轻放",
            "description": "累计放置100个物品",
            "icon": "✋",
            "check_id": "total_items_placed",
            "check_value": 100
        },
        "weight_watcher": {
            "name": "重量控制师",
            "description": "在关卡中使用低于70%的重量限制完成",
            "icon": "⚖️",
            "check_id": "lightweight_completions",
            "check_value": 1
        },
        "no_mistakes": {
            "name": "完美主义者",
            "description": "不使用撤销功能完成一个关卡",
            "icon": "🎯",
            "check_id": "no_undo_levels",
            "check_value": 1
        },
        "daily_challenger": {
            "name": "每日挑战者",
            "description": "完成每日挑战",
            "icon": "📅",
            "check_id": "daily_completed_count",
            "check_value": 1
        },
        "dedicated_mover": {
            "name": "专职搬家工",
            "description": "游玩超过20局游戏",
            "icon": "🚚",
            "check_id": "games_played",
            "check_value": 20
        }
    }

var _check_state: Dictionary = {}

func _ready() -> void:
    SaveSystem.save_loaded.connect(_on_save_loaded)

func _on_save_loaded() -> void:
    _rebuild_check_state()

func _rebuild_check_state() -> void:
    _check_state.clear()
    var completed_levels: int = 0
    var three_star_count: int = 0
    var total_stars: int = 0
    for level_data in SaveSystem.save_data["level_progress"].values():
        if level_data.get("completed", false):
            completed_levels += 1
        var stars: int = int(level_data.get("stars", 0))
        total_stars += stars
        if stars == 3:
            three_star_count += 1
    _check_state["completed_levels"] = completed_levels
    _check_state["three_star_count"] = three_star_count
    _check_state["total_stars"] = total_stars
    _check_state["total_items_placed"] = SaveSystem.save_data.get("items_placed", 0)
    _check_state["games_played"] = SaveSystem.save_data.get("games_played", 0)
    _check_state["fragile_safe_levels"] = SaveSystem.save_data.get("fragile_safe_levels", 0)
    _check_state["lightweight_completions"] = SaveSystem.save_data.get("lightweight_completions", 0)
    _check_state["no_undo_levels"] = SaveSystem.save_data.get("no_undo_levels", 0)
    _check_state["daily_completed_count"] = SaveSystem.save_data.get("daily_completed_count", 0)

func check_all() -> void:
    _rebuild_check_state()
    for id in ACHIEVEMENTS.keys():
        check_achievement(id)

func check_achievement(achievement_id: String) -> bool:
    if SaveSystem.is_achievement_unlocked(achievement_id):
        return true
    if not ACHIEVEMENTS.has(achievement_id):
        return false
    var data: Dictionary = ACHIEVEMENTS[achievement_id]
    var check_id: String = data.get("check_id", "")
    var check_value: int = int(data.get("check_value", 0))
    if check_id.is_empty():
        return false
    var current: int = int(_check_state.get(check_id, 0))
    if current >= check_value:
        unlock(achievement_id)
        return true
    return false

func unlock(achievement_id: String) -> void:
    if SaveSystem.is_achievement_unlocked(achievement_id):
        return
    if not ACHIEVEMENTS.has(achievement_id):
        return
    SaveSystem.set_achievement_unlocked(achievement_id, true)
    var ach_data: Dictionary = ACHIEVEMENTS[achievement_id]
    achievement_unlocked.emit(achievement_id, ach_data)
    UIManager.show_toast("🏆 成就解锁: %s" % ach_data["name"])
    AudioManager.play_sfx("star")

func get_all_achievements() -> Dictionary:
    var result: Dictionary = {}
    for id in ACHIEVEMENTS.keys():
        var data: Dictionary = ACHIEVEMENTS[id].duplicate(true)
        data.erase("check_id")
        data.erase("check_value")
        data["unlocked"] = SaveSystem.is_achievement_unlocked(id)
        if data["unlocked"] and SaveSystem.save_data["achievements"].has(id):
            data["unlock_date"] = SaveSystem.save_data["achievements"][id].get("unlock_date", "")
        result[id] = data
    return result

func report_stat(stat_name: String, amount: int = 1) -> void:
    if not SaveSystem.save_data.has(stat_name):
        SaveSystem.save_data[stat_name] = 0
    SaveSystem.save_data[stat_name] = int(SaveSystem.save_data[stat_name]) + amount
    SaveSystem.save_game()
    _rebuild_check_state()
    check_all()

func report_game_result(result_data: Dictionary) -> void:
    SaveSystem.add_stats(int(result_data.get("items_placed", 0)), true)
    if result_data.get("all_fragile_safe", false):
        report_stat("fragile_safe_levels", 1)
    if result_data.get("weight_ratio", 1.0) < 0.7:
        report_stat("lightweight_completions", 1)
    if result_data.get("undo_count", 0) == 0 and result_data.get("completed", false):
        report_stat("no_undo_levels", 1)
    _rebuild_check_state()
    check_all()
