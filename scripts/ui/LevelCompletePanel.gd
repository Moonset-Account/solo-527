extends Control

class_name LevelCompletePanel

var next_btn: Button
var retry_btn: Button
var levels_btn: Button
var menu_btn: Button
var title: Label
var stars_label: Label
var stats_label: RichTextLabel
var score_label: Label

var _final_score: int = 0
var _initialized: bool = false

func _ready():
	if next_btn and stars_label and stats_label and not _initialized:
		initialize()

func initialize():
	if _initialized:
		return
	_initialized = true
	if title:
		title.text = "🎉 关卡完成！"
	_connect_buttons()
	_show_stats()
	AudioManager.play_sfx("level_complete", 1.0, 0.8)

func _connect_buttons():
	if next_btn:
		if not next_btn.is_connected("pressed", Callable(self, "_on_next_level")):
			next_btn.pressed.connect(_on_next_level)
	if retry_btn:
		if not retry_btn.is_connected("pressed", Callable(self, "_on_retry")):
			retry_btn.pressed.connect(_on_retry)
	if levels_btn:
		if not levels_btn.is_connected("pressed", Callable(self, "_on_level_select")):
			levels_btn.pressed.connect(_on_level_select)
	if menu_btn:
		if not menu_btn.is_connected("pressed", Callable(self, "_on_menu")):
			menu_btn.pressed.connect(_on_menu)

func _get_bootstrap():
	var b = get_tree().get_first_node_in_group("main_bootstrap")
	return b

func _show_stats():
	var progress = GameManager.get_progress()
	var level_data = LevelConfig.get_level(progress["level"])
	var time = progress["time"]
	var detections = progress["detections"]
	var energy = progress["energy"]
	var stars = 1
	if detections == 0:
		stars += 1
	if energy >= 60:
		stars += 1
	var stars_str = ""
	for i in range(3):
		if i < stars:
			stars_str += "[color=yellow]★[/color]"
		else:
			stars_str += "☆"
	if stars_label:
		stars_label.text = stars_str
	var m = int(time) / 60
	var s = int(time) % 60
	var time_bonus = max(0, 3000 - int(time * 20))
	var detect_penalty = detections * 200
	var energy_bonus = int(energy * 10)
	var scan_bonus = progress["scans"] * 100
	var fix_bonus = progress["fixes"] * 150
	_final_score = time_bonus - detect_penalty + energy_bonus + scan_bonus + fix_bonus + 500
	_final_score = max(0, _final_score)
	SaveManager.add_leaderboard_entry("玩家", _final_score, progress["level"])
	if level_data.get("difficulty_stars", 1) == 2:
		SaveManager.set_daily_challenge_score(_final_score)
		AchievementManager.check_daily_challenge(_final_score)
	if stats_label:
		stats_label.bbcode_enabled = true
		stats_label.text = """
[b]%s[/b]

用时: [b]%02d:%02d[/b]  +%d
被发现次数: [b]%d[/b]  -%d
剩余能量: [b]%d%%[/b]  +%d
扫描货架: [b]%d/%d[/b]  +%d
修复标签: [b]%d/%d[/b]  +%d
""" % [level_data.get("name", ""), m, s, time_bonus, detections, detect_penalty, int(energy), energy_bonus, progress["scans"], progress["total_scans"], scan_bonus, progress["fixes"], progress["total_fixes"], fix_bonus]
	if score_label:
		score_label.text = "总分: %d" % _final_score
	if GameManager.current_level >= LevelConfig.get_level_count():
		if next_btn:
			next_btn.text = "游戏通关！"
			if next_btn.is_connected("pressed", Callable(self, "_on_next_level")):
				next_btn.pressed.disconnect(Callable(self, "_on_next_level"))
			next_btn.pressed.connect(_on_menu)

func _on_next_level():
	AudioManager.play_sfx("ui_click")
	var next_id = GameManager.current_level + 1
	if next_id > LevelConfig.get_level_count():
		DebugLog.info("[按钮] 游戏通关 → 返回主菜单")
		_on_menu()
		return
	DebugLog.info("[按钮] 下一关 → 关卡 %d" % next_id)
	var bs = _get_bootstrap()
	if bs:
		bs.build_game_level(next_id)
	else:
		GameManager.start_game(next_id)

func _on_retry():
	AudioManager.play_sfx("ui_click")
	DebugLog.info("[按钮] 重玩本关 → 关卡 %d" % GameManager.current_level)
	var level_id = GameManager.current_level
	var bs = _get_bootstrap()
	if bs:
		bs.build_game_level(level_id)
	else:
		GameManager.start_game(level_id)

func _on_level_select():
	AudioManager.play_sfx("ui_click")
	DebugLog.info("[按钮] 关卡选择 → 返回主菜单")
	var bs = _get_bootstrap()
	if bs:
		bs._build_main_menu()
	else:
		GameManager.return_to_menu()

func _on_menu():
	AudioManager.play_sfx("ui_click")
	DebugLog.info("[按钮] 返回主菜单")
	var bs = _get_bootstrap()
	if bs:
		bs._build_main_menu()
	else:
		GameManager.return_to_menu()
