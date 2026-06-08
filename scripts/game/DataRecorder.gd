extends Node

var log_file: FileAccess = null
var session_start_time: int = 0
var game_sessions_count: int = 0

const DATA_PATH: String = "user://game_data.csv"
const EVENT_PATH: String = "user://game_events.log"

func _ready() -> void:
    name = "DataRecorder"
    session_start_time = Time.get_unix_time_from_system()
    _init_files()
    _register_listeners()
    print("[DataRecorder] 数据记录系统初始化完成")

func _init_files() -> void:
    if not FileAccess.file_exists(DATA_PATH):
        var data_file = FileAccess.open(DATA_PATH, FileAccess.WRITE)
        if data_file:
            data_file.store_line("timestamp,event_type,level,day,phase,money,inventory_count,customers_served,stall_level,details")
            data_file.close()
    
    var evt = FileAccess.open(EVENT_PATH, FileAccess.WRITE)
    if evt:
        evt.store_line("=== 游戏事件记录 ===")
        evt.store_line("启动时间: " + Time.get_datetime_string_from_system())
        evt.store_line("")
        evt.close()

func _append_to_file(path: String, content: String) -> void:
    var existing: String = ""
    if FileAccess.file_exists(path):
        var rf = FileAccess.open(path, FileAccess.READ)
        if rf:
            existing = rf.get_as_text()
            rf.close()
    
    var wf = FileAccess.open(path, FileAccess.WRITE)
    if wf:
        wf.store_string(existing + content)
        wf.close()

func _register_listeners() -> void:
    EventBus.on_event("game_state_changed", func(s): record_event("state_change", {"new_state": str(s)}))
    EventBus.on_event("day_started", func(d): record_event("day_start", {"day": d}))
    EventBus.on_event("day_ended", func(d, r): record_event("day_end", {"day": d, "report": r}))
    EventBus.on_event("phase_changed", func(p): record_event("phase_change", {"phase": str(p)}))
    EventBus.on_event("money_changed", func(a, t): record_event("money_change", {"amount": a, "total": t}))
    EventBus.on_event("inventory_changed", func(i, c): record_event("inventory_change", {"item": i, "count": c}))
    EventBus.on_event("customer_served", func(c, i, p): record_event("sale", {"item": i, "price": p}))
    EventBus.on_event("stall_upgraded", func(s, l): record_event("upgrade", {"stall": s, "level": l}))
    EventBus.on_event("level_completed", func(l, s): record_event("level_complete", {"level": l, "stars": s}))
    EventBus.on_event("input_mode_changed", func(m): record_event("input_mode", {"mode": str(m)}))

func record_event(event_type: String, details: Dictionary) -> void:
    var timestamp = Time.get_datetime_string_from_system()
    
    var level: String = GameManager.current_level_id if GameManager.current_level_id else "none"
    var day = GameManager.current_day
    var phase = str(GameManager.current_phase)
    var money = GameManager.money
    var inv_count = 0
    for v in GameManager.inventory.values():
        inv_count += v
    var cust = GameManager.total_customers_served
    var stall_lv = GameManager.stall_level
    var details_str: String = JSON.stringify(details) if details else "{}"
    
    var csv_line: String = "%s,%s,%s,%d,%s,%d,%d,%d,%d,\"%s\"\n" % [
        timestamp, event_type, level, day, phase, money, inv_count, cust, stall_lv, details_str
    ]
    _append_to_file(DATA_PATH, csv_line)
    
    var evt_line: String = "[%s] %s: %s\n" % [timestamp, event_type, JSON.stringify(details)]
    _append_to_file(EVENT_PATH, evt_line)

func get_session_duration() -> int:
    return Time.get_unix_time_from_system() - session_start_time

func get_statistics() -> Dictionary:
    return {
        "session_duration_seconds": get_session_duration(),
        "total_games_played": SaveManager.games_played,
        "total_money_earned": SaveManager.total_money_earned,
        "completed_levels": _count_completed_levels(),
        "average_stars": _calculate_average_stars(),
        "current_level": GameManager.current_level_id,
        "current_day": GameManager.current_day,
        "current_money": GameManager.money,
        "stall_level": GameManager.stall_level
    }

func _count_completed_levels() -> int:
    var count = 0
    for level_id in SaveManager.level_progress.keys():
        if SaveManager.level_progress[level_id].get("completed", false):
            count += 1
    return count

func _calculate_average_stars() -> float:
    var total = 0
    var count = 0
    for level_id in SaveManager.level_progress.keys():
        var stars = SaveManager.level_progress[level_id].get("best_stars", 0)
        total += stars
        count += 1
    if count == 0:
        return 0.0
    return float(total) / float(count)

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(n):
        result += s
    return result

func print_statistics() -> void:
    var stats = get_statistics()
    var sep = _repeat_str("=", 50)
    print("\n📊 游戏数据统计")
    print(sep)
    print("会话时长: %d 秒 (%d 分钟)" % [stats["session_duration_seconds"], int(stats["session_duration_seconds"] / 60)])
    print("累计游玩: %d 局" % stats["total_games_played"])
    print("累计赚取: %d 金币" % stats["total_money_earned"])
    print("完成关卡: %d 关" % stats["completed_levels"])
    print("平均星级: %.2f / 3" % stats["average_stars"])
    if not stats["current_level"].is_empty():
        print("当前进度: %s - 第%d天 - %d金币" % [stats["current_level"], stats["current_day"], stats["current_money"]])
    print(sep + "\n")

func export_data_report() -> String:
    var stats = get_statistics()
    var sep = _repeat_str("=", 50)
    var report = "\n🏪 小镇集市经营模拟 - 游戏数据报告\n"
    report += "生成时间: %s\n\n" % Time.get_datetime_string_from_system()
    
    report += "📈 玩家统计:\n"
    report += "  累计游玩: %d 局\n" % stats["total_games_played"]
    report += "  累计赚取: %d 金币\n" % stats["total_money_earned"]
    var num_levels = LevelConfig.get_level_ids().size()
    report += "  完成关卡: %d / %d\n" % [stats["completed_levels"], num_levels]
    report += "  平均星级: %.2f / 3.00\n\n" % stats["average_stars"]
    
    report += "🗺️  关卡进度:\n"
    for level_id in LevelConfig.get_level_ids():
        var progress = SaveManager.get_level_progress(level_id)
        var level = LevelConfig.get_level(level_id)
        var n_stars: int = progress.get("best_stars", 0)
        var stars = _repeat_str("⭐", n_stars) + _repeat_str("☆", 3 - n_stars)
        var status = "✅" if progress.get("completed", false) else "⏳"
        var unlocked = "🔓" if SaveManager.is_level_unlocked(level_id) else "🔒"
        report += "  %s %s %s: %s | 最佳 %d 金币\n" % [
            unlocked, status, level.get("name", level_id), stars, progress.get("best_money", 0)
        ]
    
    report += "\n⚙️  当前设置:\n"
    for key in SaveManager.settings.keys():
        report += "  %s = %s\n" % [key, str(SaveManager.settings[key])]
    
    return report

func save_report_to_file() -> String:
    var report = export_data_report()
    var path: String = "user://data_report_" + str(Time.get_unix_time_from_system()) + ".txt"
    var file = FileAccess.open(path, FileAccess.WRITE)
    if file:
        file.store_string(report)
        file.close()
        return path
    return ""
