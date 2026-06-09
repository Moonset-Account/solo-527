extends Control

class_name PauseMenu

var resume_btn: Button
var settings_btn: Button
var level_select_btn: Button
var retry_btn: Button
var quit_btn: Button
var title: Label

var _initialized: bool = false

func _ready():
	if resume_btn and title and not _initialized:
		initialize()

func initialize():
	if _initialized:
		return
	_initialized = true
	if title:
		title.text = "⏸ 游戏暂停"
	_connect_buttons()
	AudioManager.play_sfx("ui_click")

func _connect_buttons():
	if resume_btn:
		if not resume_btn.is_connected("pressed", Callable(self, "_on_resume")):
			resume_btn.pressed.connect(_on_resume)
	if settings_btn:
		if not settings_btn.is_connected("pressed", Callable(self, "_on_settings")):
			settings_btn.pressed.connect(_on_settings)
	if level_select_btn:
		if not level_select_btn.is_connected("pressed", Callable(self, "_on_level_select")):
			level_select_btn.pressed.connect(_on_level_select)
	if retry_btn:
		if not retry_btn.is_connected("pressed", Callable(self, "_on_retry")):
			retry_btn.pressed.connect(_on_retry)
	if quit_btn:
		if not quit_btn.is_connected("pressed", Callable(self, "_on_quit")):
			quit_btn.pressed.connect(_on_quit)

func _get_bootstrap():
	var b = get_tree().get_first_node_in_group("main_bootstrap")
	return b

func _on_resume():
	AudioManager.play_sfx("ui_click")
	DebugLog.info("[按钮] 继续游戏 → 关闭暂停菜单")
	GameManager.resume_game()
	queue_free()

func _on_settings():
	AudioManager.play_sfx("ui_click")
	DebugLog.info("[按钮] 打开设置")
	var settings = preload("res://scenes/ui/SettingsPanel.tscn").instantiate()
	add_child(settings)

func _on_level_select():
	AudioManager.play_sfx("ui_click")
	DebugLog.info("[按钮] 关卡选择 → 返回主菜单")
	get_tree().paused = false
	var bs = _get_bootstrap()
	if bs:
		bs._build_main_menu()
	else:
		GameManager.return_to_menu()

func _on_retry():
	AudioManager.play_sfx("ui_click")
	DebugLog.info("[按钮] 重玩本关 → 关卡 %d" % GameManager.current_level)
	get_tree().paused = false
	var level_id = GameManager.current_level
	var bs = _get_bootstrap()
	if bs:
		bs.build_game_level(level_id)
	else:
		GameManager.start_game(level_id)

func _on_quit():
	AudioManager.play_sfx("ui_click")
	DebugLog.info("[按钮] 返回主菜单")
	get_tree().paused = false
	var bs = _get_bootstrap()
	if bs:
		bs._build_main_menu()
	else:
		GameManager.return_to_menu()

func _input(event):
	if event.is_action_pressed("pause") and not event.is_echo():
		_on_resume()
