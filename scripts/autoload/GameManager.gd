extends Node

enum GameState {
	MENU,
	PLAYING,
	PAUSED,
	LEVEL_COMPLETE,
	GAME_OVER
}

signal state_changed(new_state: int, old_state: int)

var current_state: int = GameState.MENU
var current_level: int = 0
var level_time: float = 0.0
var was_detected: bool = false
var detect_count: int = 0
var scan_count: int = 0
var fix_count: int = 0
var total_scans_needed: int = 0
var total_fixes_needed: int = 0
var checkpoints: Array = []
var current_checkpoint: int = 0
var remaining_energy: float = 100.0

func _ready():
	DebugLog.success("游戏管理器初始化完成")
	_change_state(GameState.MENU)

func start_game(level_id: int):
	current_level = level_id
	level_time = 0.0
	was_detected = false
	detect_count = 0
	scan_count = 0
	fix_count = 0
	checkpoints.clear()
	current_checkpoint = 0
	remaining_energy = 100.0
	SaveManager.check_daily_challenge()
	_change_state(GameState.PLAYING)
	DebugLog.info("开始关卡 %d" % level_id)

func pause_game():
	if current_state == GameState.PLAYING:
		_change_state(GameState.PAUSED)
		get_tree().paused = true
		DebugLog.info("游戏已暂停")

func resume_game():
	if current_state == GameState.PAUSED:
		_change_state(GameState.PLAYING)
		get_tree().paused = false
		DebugLog.info("游戏已继续")

func return_to_menu():
	get_tree().paused = false
	_change_state(GameState.MENU)
	current_level = 0
	DebugLog.info("返回主菜单")

func on_detected():
	was_detected = true
	detect_count += 1
	DebugLog.warning("被发现了！重置到检查点 %d" % current_checkpoint)

func complete_level():
	var time = level_time
	var stars = _calculate_stars(time, detect_count, remaining_energy)
	SaveManager.set_level_progress(current_level, true, time, stars)
	SaveManager.increment_stat("total_scans", scan_count)
	SaveManager.increment_stat("total_fixes", fix_count)
	SaveManager.add_total_time(time)
	SaveManager.unlock_level(current_level + 1)
	AchievementManager.check_level_complete(current_level, time, was_detected, remaining_energy, stars)
	AchievementManager.check_scans(SaveManager.save_data["total_scans"])
	AchievementManager.check_fixes(SaveManager.save_data["total_fixes"])
	_change_state(GameState.LEVEL_COMPLETE)
	DebugLog.success("关卡 %d 完成！用时: %.1fs, 被发现: %d次, 评价: %d星" % [current_level, time, detect_count, stars])

func _calculate_stars(time: float, detections: int, energy: float) -> int:
	var stars = 1
	if detections == 0:
		stars += 1
	if energy >= 60.0:
		stars += 1
	return clamp(stars, 1, 3)

func add_checkpoint(checkpoint_data: Dictionary):
	checkpoints.append(checkpoint_data.duplicate())
	current_checkpoint = checkpoints.size() - 1
	DebugLog.debug("检查点 %d 已记录" % current_checkpoint)

func get_current_checkpoint() -> Dictionary:
	if current_checkpoint >= 0 and current_checkpoint < checkpoints.size():
		return checkpoints[current_checkpoint].duplicate()
	return {}

func increment_scan():
	scan_count += 1
	SaveManager.increment_stat("total_scans")
	AchievementManager.check_scans(SaveManager.save_data["total_scans"])
	DebugLog.debug("已扫描货架 (%d/%d)" % [scan_count, total_scans_needed])

func increment_fix():
	fix_count += 1
	SaveManager.increment_stat("total_fixes")
	AchievementManager.check_fixes(SaveManager.save_data["total_fixes"])
	DebugLog.debug("已修复标签 (%d/%d)" % [fix_count, total_fixes_needed])

func update_time(delta: float):
	if current_state == GameState.PLAYING:
		level_time += delta

func _change_state(new_state: int):
	var old_state = current_state
	current_state = new_state
	emit_signal("state_changed", new_state, old_state)

func is_playing() -> bool:
	return current_state == GameState.PLAYING

func set_objectives(total_scans: int, total_fixes: int):
	total_scans_needed = total_scans
	total_fixes_needed = total_fixes
	DebugLog.info("关卡目标: 扫描 %d 个货架, 修复 %d 个标签" % [total_scans, total_fixes])

func get_progress() -> Dictionary:
	return {
		"scans": scan_count,
		"total_scans": total_scans_needed,
		"fixes": fix_count,
		"total_fixes": total_fixes_needed,
		"time": level_time,
		"detections": detect_count,
		"energy": remaining_energy,
		"level": current_level
	}
