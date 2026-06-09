extends Control

class_name PauseMenu

var resume_btn: Button
var settings_btn: Button
var level_select_btn: Button
var retry_btn: Button
var quit_btn: Button
var title: Label

func _ready():
	title.text = "⏸ 游戏暂停"
	_connect_buttons()
	AudioManager.play_sfx("ui_click")

func _connect_buttons():
	if resume_btn:
		resume_btn.pressed.connect(_on_resume)
	if settings_btn:
		settings_btn.pressed.connect(_on_settings)
	if level_select_btn:
		level_select_btn.pressed.connect(_on_level_select)
	if retry_btn:
		retry_btn.pressed.connect(_on_retry)
	if quit_btn:
		quit_btn.pressed.connect(_on_quit)

func _get_bootstrap():
	var b = get_tree().get_first_node_in_group("main_bootstrap")
	return b

func _on_resume():
	AudioManager.play_sfx("ui_click")
	GameManager.resume_game()
	queue_free()

func _on_settings():
	AudioManager.play_sfx("ui_click")
	var settings = preload("res://scenes/ui/SettingsPanel.tscn").instantiate()
	add_child(settings)

func _on_level_select():
	AudioManager.play_sfx("ui_click")
	get_tree().paused = false
	var bs = _get_bootstrap()
	if bs:
		bs._build_main_menu()
	else:
		GameManager.return_to_menu()

func _on_retry():
	AudioManager.play_sfx("ui_click")
	get_tree().paused = false
	var level_id = GameManager.current_level
	var bs = _get_bootstrap()
	if bs:
		bs.build_game_level(level_id)
	else:
		GameManager.start_game(level_id)

func _on_quit():
	AudioManager.play_sfx("ui_click")
	get_tree().paused = false
	var bs = _get_bootstrap()
	if bs:
		bs._build_main_menu()
	else:
		GameManager.return_to_menu()

func _input(event):
	if event.is_action_pressed("pause") and not event.is_echo():
		_on_resume()
