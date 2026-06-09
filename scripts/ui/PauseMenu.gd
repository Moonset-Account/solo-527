extends Control

class_name PauseMenu

@onready var resume_btn: Button = $Panel/VBoxContainer/ResumeButton
@onready var settings_btn: Button = $Panel/VBoxContainer/SettingsButton
@onready var level_select_btn: Button = $Panel/VBoxContainer/LevelSelectButton
@onready var retry_btn: Button = $Panel/VBoxContainer/RetryButton
@onready var quit_btn: Button = $Panel/VBoxContainer/MainMenuButton
@onready var title: Label = $Panel/VBoxContainer/TitleLabel

func _ready():
	title.text = "游戏暂停"
	_connect_buttons()
	AudioManager.play_sfx("ui_click")

func _connect_buttons():
	resume_btn.pressed.connect(_on_resume)
	settings_btn.pressed.connect(_on_settings)
	level_select_btn.pressed.connect(_on_level_select)
	retry_btn.pressed.connect(_on_retry)
	quit_btn.pressed.connect(_on_quit)

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
	var main_scene = preload("res://scenes/main/Main.tscn")
	get_tree().change_scene_to_packed(main_scene)
	GameManager.return_to_menu()

func _on_retry():
	AudioManager.play_sfx("ui_click")
	get_tree().paused = false
	var level_id = GameManager.current_level
	var level_scene = preload("res://scenes/levels/GameLevel.tscn")
	get_tree().change_scene_to_packed(level_scene)
	await get_tree().process_frame
	var level_mgr = get_tree().get_first_node_in_group("level_manager")
	if level_mgr:
		level_mgr.load_level(level_id)

func _on_quit():
	AudioManager.play_sfx("ui_click")
	get_tree().paused = false
	var main_scene = preload("res://scenes/main/Main.tscn")
	get_tree().change_scene_to_packed(main_scene)
	GameManager.return_to_menu()

func _input(event):
	if event.is_action_pressed("pause") and not event.is_echo():
		_on_resume()
