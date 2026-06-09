extends Node

signal achievement_unlocked(id: String, name: String, description: String)

const ACHIEVEMENTS = {
	"first_step": {
		"name": "第一步",
		"description": "完成第一关",
		"icon": "🚶"
	},
	"stealth_master": {
		"name": "潜行大师",
		"description": "在一关中完全不被发现",
		"icon": "🥷"
	},
	"speed_runner": {
		"name": "极速运行",
		"description": "在30秒内完成任意关卡",
		"icon": "⚡"
	},
	"scanner_pro": {
		"name": "扫描专家",
		"description": "累计扫描100个货架",
		"icon": "📡"
	},
	"fixer": {
		"name": "修复专家",
		"description": "累计修复50个错误标签",
		"icon": "🔧"
	},
	"all_levels": {
		"name": "仓库征服者",
		"description": "完成所有关卡",
		"icon": "🏆"
	},
	"perfect_level": {
		"name": "完美主义者",
		"description": "任意关卡获得3星评价",
		"icon": "⭐"
	},
	"no_death_run": {
		"name": "不死传说",
		"description": "连续完成3关不被发现",
		"icon": "💎"
	},
	"energy_saver": {
		"name": "节能先锋",
		"description": "完成一关剩余能量超过80%",
		"icon": "🔋"
	},
	"daily_winner": {
		"name": "每日冠军",
		"description": "每日挑战得分超过1000分",
		"icon": "🏅"
	}
}

var _consecutive_no_detect = 0

func _ready():
	DebugLog.info("成就系统初始化完成，共 %d 个成就" % ACHIEVEMENTS.size())

func is_unlocked(id: String) -> bool:
	return SaveManager.save_data["achievements"].get(id, false)

func unlock(id: String):
	if is_unlocked(id):
		return
	if not ACHIEVEMENTS.has(id):
		DebugLog.warning("尝试解锁未知成就: %s" % id)
		return
	SaveManager.save_data["achievements"][id] = true
	SaveManager.save_game()
	var data = ACHIEVEMENTS[id]
	DebugLog.success("成就解锁: %s - %s" % [data["name"], data["description"]])
	emit_signal("achievement_unlocked", id, data["name"], data["description"])

func check_level_complete(level_id: int, time: float, detected: bool, remaining_energy: float, stars: int, total_levels: int = 3):
	if level_id == 1:
		unlock("first_step")
	if not detected:
		unlock("stealth_master")
		_consecutive_no_detect += 1
		if _consecutive_no_detect >= 3:
			unlock("no_death_run")
	else:
		_consecutive_no_detect = 0
	if time <= 30.0:
		unlock("speed_runner")
	if stars >= 3:
		unlock("perfect_level")
	if remaining_energy >= 80.0:
		unlock("energy_saver")
	var all_done = true
	for i in range(1, total_levels + 1):
		if not SaveManager.get_level_progress(i).get("completed", false):
			all_done = false
			break
	if all_done:
		unlock("all_levels")

func check_scans(total_scans: int):
	if total_scans >= 100:
		unlock("scanner_pro")

func check_fixes(total_fixes: int):
	if total_fixes >= 50:
		unlock("fixer")

func check_daily_challenge(score: int):
	if score >= 1000:
		unlock("daily_winner")

func get_all_achievements() -> Dictionary:
	return ACHIEVEMENTS.duplicate()

func get_unlocked_count() -> int:
	var count = 0
	for id in SaveManager.save_data["achievements"].keys():
		if SaveManager.save_data["achievements"][id]:
			count += 1
	return count
