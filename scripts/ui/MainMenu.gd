extends Control
## 主菜单场景 - 游戏入口界面

@onready var title_label: Label = $DecorativeFrame/VBoxContainer/TitleLabel
@onready var subtitle_label: Label = $DecorativeFrame/VBoxContainer/SubtitleLabel
@onready var new_game_button: Button = $DecorativeFrame/VBoxContainer/ButtonContainer/NewGameButton
@onready var continue_button: Button = $DecorativeFrame/VBoxContainer/ButtonContainer/ContinueButton
@onready var level_select_button: Button = $DecorativeFrame/VBoxContainer/ButtonContainer/LevelSelectButton
@onready var stats_label: Label = $DecorativeFrame/VBoxContainer/StatsLabel
@onready var version_label: Label = $Footer/VersionLabel

func _ready() -> void:
	anchor_right = 1.0
	anchor_bottom = 1.0
	_connect_buttons()
	_refresh_stats()
	_check_continue_available()

func _connect_buttons() -> void:
	if new_game_button:
		new_game_button.pressed.connect(_on_new_game_pressed)
	if continue_button:
		continue_button.pressed.connect(_on_continue_pressed)
	if level_select_button:
		level_select_button.pressed.connect(_on_level_select_pressed)

func _refresh_stats() -> void:
	if not stats_label:
		return
	var stats: Dictionary = SaveSystem.get_global_stats()
	var parts: Array = []
	parts.append("累计游戏: %d 次" % stats.get("total_games_played", 0))
	parts.append("通关关卡: %d" % stats.get("total_levels_completed", 0))
	parts.append("解锁卡牌: %d 张" % stats.get("unlocked_cards", []).size())
	stats_label.text = "  ".join(parts)

func _check_continue_available() -> void:
	if not continue_button:
		return
	var slots: Array = SaveSystem.get_save_slots()
	var has_save: bool = false
	for s in slots:
		if s.data != null:
			has_save = true
			break
	continue_button.disabled = not has_save
	if has_save:
		var last_save = slots.filter(func(x): return x.data != null)
		if last_save.size() > 0:
			var ts: int = last_save[-1].data.get("timestamp", 0)
			if ts > 0:
				var formatted: String = Time.get_datetime_string_from_unix_time(ts, true)
				continue_button.text = "继续游戏 (%s)" % formatted

func _on_new_game_pressed() -> void:
	AudioManager.play_ui_click()
	GameManager.start_new_run()
	_transition_to_scene("res://scenes/LevelSelect.tscn")

func _on_continue_pressed() -> void:
	AudioManager.play_ui_click()
	if GameManager.load_run(0):
		_transition_to_scene("res://scenes/LevelSelect.tscn")
	else:
		EventBus.publish("ui_toast", ["没有可读取的存档", "warning", 2.0])

func _on_level_select_pressed() -> void:
	AudioManager.play_ui_click()
	GameManager.start_new_run()
	_transition_to_scene("res://scenes/LevelSelect.tscn")

func _transition_to_scene(path: String) -> void:
	EventBus.publish("scene_changing", [path])
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE)
	t.tween_property(self, "modulate:a", 0.0, 0.35)
	t.tween_callback(func():
		get_tree().change_scene_to_file(path)
	)
