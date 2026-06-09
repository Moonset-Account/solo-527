extends Node
## AchievementSystem - 成就与每日挑战系统

signal achievement_unlocked(achievement_id: String)
signal daily_challenge_completed(challenge_id: String)
signal progress_updated(achievement_id: String, progress: float)

const ACHIEVEMENTS := {
	"first_order": {"name": "初试锋芒", "desc": "完成第一个订单", "reward": 100, "icon": "📦"},
	"ten_orders": {"name": "熟练工", "desc": "累计完成10个订单", "reward": 300, "icon": "🏭"},
	"hundred_orders": {"name": "生产大师", "desc": "累计完成100个订单", "reward": 2000, "icon": "🏆"},
	"first_machine": {"name": "第一台机器", "desc": "放置第一台生产机器", "reward": 50, "icon": "⚙️"},
	"five_machines": {"name": "小型车间", "desc": "同时拥有5台工作机器", "reward": 500, "icon": "🔧"},
	"first_upgrade": {"name": "升级！", "desc": "首次升级任意机器", "reward": 100, "icon": "⬆️"},
	"max_upgrade": {"name": "满级强化", "desc": "将一台机器升到5级", "reward": 1500, "icon": "💎"},
	"rich": {"name": "小富翁", "desc": "金币达到10000", "reward": 2000, "icon": "💰"},
	"no_fail": {"name": "完美主义者", "desc": "连续完成20个订单不失败", "reward": 1000, "icon": "✨"},
	"level_5": {"name": "晋升", "desc": "玩家等级达到5级", "reward": 500, "icon": "🎖️"},
	"level_10": {"name": "精英", "desc": "玩家等级达到10级", "reward": 2000, "icon": "👑"},
	"first_quality": {"name": "质量第一", "desc": "放置第一个质检点", "reward": 150, "icon": "✅"},
	"speed_demon": {"name": "极速工厂", "desc": "在30秒内完成一个订单", "reward": 800, "icon": "⚡"},
	"playtime_30min": {"name": "勤劳蜜蜂", "desc": "累计游戏时长30分钟", "reward": 1000, "icon": "🐝"}
}

const DAILY_CHALLENGES_POOL := [
	{"id": "daily_5_orders", "name": "每日5单", "desc": "今日完成5个订单", "target": 5, "type": "orders_today", "reward": 500},
	{"id": "daily_earn_2000", "name": "日入2000", "desc": "今日赚取2000金币", "target": 2000, "type": "money_today", "reward": 800},
	{"id": "daily_place_3", "name": "扩建工厂", "desc": "今日放置3台机器", "target": 3, "type": "placed_today", "reward": 400},
	{"id": "daily_upgrade_2", "name": "升级狂潮", "desc": "今日升级2次机器", "target": 2, "type": "upgrades_today", "reward": 600},
	{"id": "daily_perfect_10", "name": "零失误", "desc": "今日连续完成10个订单", "target": 10, "type": "streak_today", "reward": 1000}
]

var _unlocked: Dictionary = {}
var _daily_progress: Dictionary = {}
var _daily_challenges: Array = []
var _consecutive_completed: int = 0
var _today_date: String = ""
var _stats_cache: Dictionary = {}

func _ready() -> void:
	_today_date = _get_today_date()
	_init_daily_challenges()
	_connect_game_state_signals()
	_stats_cache = _create_stats_cache()

func _connect_game_state_signals() -> void:
	GameState.order_completed.connect(_on_order_completed)
	GameState.order_failed.connect(_on_order_failed)
	GameState.money_changed.connect(_on_money_changed)
	GameState.level_changed.connect(_on_level_changed)
	GameState.machine_placed.connect(_on_machine_placed)
	GameState.machine_upgraded.connect(_on_machine_upgraded)

func _create_stats_cache() -> Dictionary:
	return {
		"orders_today": 0,
		"money_today": 0,
		"placed_today": 0,
		"upgrades_today": 0,
		"streak_today": 0,
		"best_streak": 0,
		"fastest_order_ms": 999999
	}

func _get_today_date() -> String:
	var dt: Dictionary = Time.get_datetime_dict_from_system()
	return "%04d-%02d-%02d" % [dt.get("year", 2025), dt.get("month", 1), dt.get("day", 1)]

func _init_daily_challenges() -> void:
	_daily_challenges.clear()
	var shuffled: Array = DAILY_CHALLENGES_POOL.duplicate()
	shuffled.shuffle()
	for i in min(3, shuffled.size()):
		_daily_challenges.append(shuffled[i].duplicate())

func check_and_unlock(achievement_id: String, condition: bool) -> void:
	if not condition:
		return
	unlock(achievement_id)

func unlock(achievement_id: String) -> void:
	if not ACHIEVEMENTS.has(achievement_id):
		return
	if _unlocked.has(achievement_id) and _unlocked[achievement_id]:
		return
	_unlocked[achievement_id] = true
	var ach: Dictionary = ACHIEVEMENTS[achievement_id]
	GameState.add_money(ach.get("reward", 0))
	achievement_unlocked.emit(achievement_id)
	AudioManager.play_sfx("success")
	PlaytestRecorder.record_event("achievement_unlock", {"id": achievement_id})

func update_progress(achievement_id: String, current: int, target: int) -> void:
	if _unlocked.has(achievement_id) and _unlocked[achievement_id]:
		return
	var p: float = float(current) / float(max(target, 1))
	progress_updated.emit(achievement_id, clamp(p, 0.0, 1.0))
	if current >= target:
		unlock(achievement_id)

func _on_order_completed(order_id: String) -> void:
	var total: int = GameState.total_orders_completed
	_consecutive_completed += 1
	_stats_cache["orders_today"] += 1
	_stats_cache["streak_today"] = _consecutive_completed
	_stats_cache["best_streak"] = max(_stats_cache["best_streak"], _consecutive_completed)
	check_and_unlock("first_order", total >= 1)
	update_progress("ten_orders", total, 10)
	update_progress("hundred_orders", total, 100)
	update_progress("no_fail", _consecutive_completed, 20)
	_update_daily_progress("orders_today", _stats_cache["orders_today"])
	_update_daily_progress("streak_today", _stats_cache["streak_today"])

func _on_order_failed(order_id: String) -> void:
	_consecutive_completed = 0
	_stats_cache["streak_today"] = 0

func _on_money_changed(new_amount: int) -> void:
	check_and_unlock("rich", new_amount >= 10000)
	if new_amount > GameState.money - 1:
		var diff: int = new_amount - (GameState.money - new_amount)
		_stats_cache["money_today"] = max(_stats_cache["money_today"], new_amount)
		_update_daily_progress("money_today", _stats_cache["money_today"])

func _on_level_changed(new_level: int) -> void:
	check_and_unlock("level_5", new_level >= 5)
	check_and_unlock("level_10", new_level >= 10)
	var playtime_min: int = GameState.get_playtime_seconds() / 60
	if playtime_min >= 30:
		unlock("playtime_30min")

func _on_machine_placed(machine_data: Dictionary) -> void:
	var count: int = GameState.machines.size()
	check_and_unlock("first_machine", count >= 1)
	check_and_unlock("five_machines", count >= 5)
	var qc_count: int = 0
	for m in GameState.machines.values():
		if m.get("type") == "quality":
			qc_count += 1
	check_and_unlock("first_quality", qc_count >= 1)
	_stats_cache["placed_today"] += 1
	_update_daily_progress("placed_today", _stats_cache["placed_today"])

func _on_machine_upgraded(machine_id: String, new_level: int) -> void:
	check_and_unlock("first_upgrade", true)
	if new_level >= 5:
		unlock("max_upgrade")
	_stats_cache["upgrades_today"] += 1
	_update_daily_progress("upgrades_today", _stats_cache["upgrades_today"])

func _update_daily_progress(type_name: String, value: int) -> void:
	for ch in _daily_challenges:
		if ch.get("type") == type_name:
			var current_val: int = min(value, ch.get("target", 1))
			_daily_progress[ch.get("id")] = current_val
			if current_val >= ch.get("target", 1) and not ch.get("claimed", false):
				ch["claimed"] = true
				GameState.add_money(ch.get("reward", 0))
				daily_challenge_completed.emit(ch.get("id"))
				AudioManager.play_sfx("success")

func get_unlocked_achievements() -> Array:
	var result: Array = []
	for key in _unlocked.keys():
		if _unlocked[key]:
			result.append(key)
	return result

func is_unlocked(achievement_id: String) -> bool:
	return _unlocked.get(achievement_id, false)

func get_all_achievements() -> Dictionary:
	return ACHIEVEMENTS

func get_achievement(achievement_id: String) -> Dictionary:
	return ACHIEVEMENTS.get(achievement_id, {})

func get_daily_challenges() -> Array:
	var result: Array = []
	for ch in _daily_challenges:
		var ch_copy: Dictionary = ch.duplicate()
		ch_copy["progress"] = _daily_progress.get(ch.get("id"), 0)
		result.append(ch_copy)
	return result

func load_achievements(unlocked_list: Array) -> void:
	_unlocked.clear()
	for id_str in unlocked_list:
		_unlocked[id_str] = true

func load_daily_progress(data: Dictionary) -> void:
	if data.get("date") != _today_date:
		_daily_progress.clear()
		_stats_cache = _create_stats_cache()
		_init_daily_challenges()
	else:
		_stats_cache = data.get("stats", _create_stats_cache())
		_consecutive_completed = _stats_cache.get("streak_today", 0)

func get_daily_progress() -> Dictionary:
	return {
		"date": _today_date,
		"progress": _daily_progress,
		"stats": _stats_cache,
		"challenges": _daily_challenges
	}
