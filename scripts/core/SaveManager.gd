extends Node

const SAVE_PATH: String = "user://savegame.cfg"
const SETTINGS_PATH: String = "user://settings.cfg"

var level_progress: Dictionary = {}
var total_money_earned: int = 0
var games_played: int = 0
var settings: Dictionary = {
    "master_volume": 0.8,
    "bgm_volume": 0.6,
    "sfx_volume": 0.9,
    "language": "zh_CN",
    "fullscreen": false,
    "show_hints": true,
    "input_mode": 0
}

func _ready() -> void:
    load_settings()
    load_progress()
    print("[SaveManager] 初始化完成")

func save_level_progress(level_id: String, stars: int, final_money: int) -> void:
    var current = level_progress.get(level_id, {
        "best_stars": 0,
        "best_money": 0,
        "completed": false
    })
    
    if stars > current["best_stars"]:
        current["best_stars"] = stars
    if final_money > current["best_money"]:
        current["best_money"] = final_money
    if stars >= 1:
        current["completed"] = true
    
    level_progress[level_id] = current
    total_money_earned += final_money
    save_progress()

func get_level_progress(level_id: String) -> Dictionary:
    return level_progress.get(level_id, {
        "best_stars": 0,
        "best_money": 0,
        "completed": false
    })

func is_level_unlocked(level_id: String) -> bool:
    var level = LevelConfig.get_level(level_id)
    var prerequisite = level.get("prerequisite", "")
    
    if prerequisite.is_empty():
        return true
    
    var prereq_progress = get_level_progress(prerequisite)
    return prereq_progress.get("completed", false)

func save_progress() -> void:
    var config = ConfigFile.new()
    config.set_value("Progress", "total_money_earned", total_money_earned)
    config.set_value("Progress", "games_played", games_played)
    config.set_value("Progress", "levels", level_progress)
    
    var error = config.save(SAVE_PATH)
    if error != OK:
        push_warning("存档保存失败: " + str(error))
    else:
        print("[SaveManager] 进度已保存")

func load_progress() -> void:
    var config = ConfigFile.new()
    var error = config.load(SAVE_PATH)
    if error == OK:
        total_money_earned = config.get_value("Progress", "total_money_earned", 0)
        games_played = config.get_value("Progress", "games_played", 0)
        level_progress = config.get_value("Progress", "levels", {})
        print("[SaveManager] 进度已加载")
    else:
        print("[SaveManager] 无存档文件，使用默认数据")

func save_settings() -> void:
    var config = ConfigFile.new()
    for key in settings.keys():
        config.set_value("Settings", key, settings[key])
    
    var error = config.save(SETTINGS_PATH)
    if error == OK:
        print("[SaveManager] 设置已保存")

func load_settings() -> void:
    var config = ConfigFile.new()
    var error = config.load(SETTINGS_PATH)
    if error == OK:
        for key in settings.keys():
            settings[key] = config.get_value("Settings", key, settings[key])
        print("[SaveManager] 设置已加载")
        _apply_settings()

func _apply_settings() -> void:
    AudioManager.set_master_volume(settings["master_volume"])
    AudioManager.set_bgm_volume(settings["bgm_volume"])
    AudioManager.set_sfx_volume(settings["sfx_volume"])
    
    var display = DisplayServer
    if settings["fullscreen"]:
        display.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
    else:
        display.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)

func update_setting(key: String, value: Variant) -> void:
    if key in settings:
        settings[key] = value
        save_settings()
        _apply_settings()

func reset_progress() -> void:
    level_progress.clear()
    total_money_earned = 0
    games_played = 0
    save_progress()

func export_save() -> Dictionary:
    return {
        "level_progress": level_progress.duplicate(true),
        "total_money_earned": total_money_earned,
        "games_played": games_played,
        "settings": settings.duplicate(true)
    }

func import_save(data: Dictionary) -> bool:
    if data.is_empty():
        return false
    
    if "level_progress" in data:
        level_progress = data["level_progress"]
    if "total_money_earned" in data:
        total_money_earned = data["total_money_earned"]
    if "games_played" in data:
        games_played = data["games_played"]
    if "settings" in data:
        for key in data["settings"].keys():
            settings[key] = data["settings"][key]
    
    save_progress()
    save_settings()
    _apply_settings()
    return true
