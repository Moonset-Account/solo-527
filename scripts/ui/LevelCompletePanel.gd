extends Control

class_name LevelCompletePanel

@onready var next_btn: Button = $Panel/VBoxContainer/NextLevelButton
@onready var retry_btn: Button = $Panel/VBoxContainer/RetryButton
@onready var levels_btn: Button = $Panel/VBoxContainer/LevelSelectButton
@onready var menu_btn: Button = $Panel/VBoxContainer/MainMenuButton
@onready var title: Label = $Panel/VBoxContainer/TitleLabel
@onready var stars_label: Label = $Panel/VBoxContainer/StarsLabel
@onready var stats_label: RichTextLabel = $Panel/VBoxContainer/StatsLabel
@onready var score_label: Label = $Panel/VBoxContainer/ScoreLabel

var _final_score: int = 0

func _ready():
	title.text = "关卡完成！"
	_connect_buttons()
	_show_stats()
	AudioManager.play_sfx("level_complete", 1.0, 0.8)

func _connect_buttons():
	next_btn.pressed.connect(_on_next_level)
	retry_btn.pressed.connect(_on_retry)
	levels_btn.pressed.connect(_on_level_select)
	menu_btn.pressed.connect(_on_menu)

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
	var leaderboard_entry = SaveManager.add_leaderboard_entry("玩家", _final_score, progress["level"])
	if level_data.get("difficulty_stars", 1) == 2:
		SaveManager.set_daily_challenge_score(_final_score)
		AchievementManager.check_daily_challenge(_final_score)
	stats_label.bbcode_enabled = true
	stats_label.text = """
[b]%s[/b]

用时: [b]%02d:%02d[/b]  +%d
被发现次数: [b]%d[/b]  -%d
剩余能量: [b]%d%%[/b]  +%d
扫描货架: [b]%d/%d[/b]  +%d
修复标签: [b]%d/%d[/b]  +%d
""" % [level_data.get("name", ""), m, s, time_bonus, detections, detect_penalty, int(energy), energy_bonus, progress["scans"], progress["total_scans"], scan_bonus, progress["fixes"], progress["total_fixes"], fix_bonus]
	score_label.text = "总分: %d" % _final_score
	if GameManager.current_level >= LevelConfig.get_level_count():
		next_btn.text = "游戏通关！"
		next_btn.pressed.disconnect(_on_next_level)
		next_btn.pressed.connect(_on_menu)

func _on_next_level():
	AudioManager.play_sfx("ui_click")
	var next_id = GameManager.current_level + 1
	if next_id > LevelConfig.get_level_count():
		_on_menu()
		return
	var level_scene = preload("res://scenes/levels/GameLevel.tscn")
	get_tree().change_scene_to_packed(level_scene)
	await get_tree().process_frame
	var level_mgr = get_tree().get_first_node_in_group("level_manager")
	if level_mgr:
		level_mgr.load_level(next_id)

func _on_retry():
	AudioManager.play_sfx("ui_click")
	var level_id = GameManager.current_level
	var level_scene = preload("res://scenes/levels/GameLevel.tscn")
	get_tree().change_scene_to_packed(level_scene)
	await get_tree().process_frame
	var level_mgr = get_tree().get_first_node_in_group("level_manager")
	if level_mgr:
		level_mgr.load_level(level_id)

func _on_level_select():
	AudioManager.play_sfx("ui_click")
	var main_scene = preload("res://scenes/main/Main.tscn")
	get_tree().change_scene_to_packed(main_scene)
	GameManager.return_to_menu()

func _on_menu():
	AudioManager.play_sfx("ui_click")
	var main_scene = preload("res://scenes/main/Main.tscn")
	get_tree().change_scene_to_packed(main_scene)
	GameManager.return_to_menu()
