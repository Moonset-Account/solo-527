extends Control

var _previous_scene: String = ""

@onready var _resume_button: Button = $PanelContainer/VBoxContainer/ResumeButton
@onready var _save_button: Button = $PanelContainer/VBoxContainer/SaveButton
@onready var _settings_button: Button = $PanelContainer/VBoxContainer/SettingsButton
@onready var _restart_button: Button = $PanelContainer/VBoxContainer/RestartButton
@onready var _quit_button: Button = $PanelContainer/VBoxContainer/QuitButton

func _ready() -> void:
	_resume_button.pressed.connect(_on_resume)
	_save_button.pressed.connect(_on_save)
	_settings_button.pressed.connect(_on_settings)
	_restart_button.pressed.connect(_on_restart)
	_quit_button.pressed.connect(_on_quit)
	_previous_scene = GameManager.get_current_level_data().get("previous_scene", "res://scenes/day_phase.tscn")
	GameManager.is_paused = true

func _on_resume() -> void:
	GameManager.is_paused = false
	match GameManager.current_phase:
		GameManager.Phase.DAY:
			get_tree().change_scene_to_file("res://scenes/day_phase.tscn")
		GameManager.Phase.NIGHT:
			get_tree().change_scene_to_file("res://scenes/night_phase.tscn")
		_:
			get_tree().change_scene_to_file("res://scenes/day_phase.tscn")

func _on_save() -> void:
	SaveSystem.save_game(1)
	_save_button.text = "已保存!"
	await get_tree().create_timer(1.0).timeout
	_save_button.text = "保存游戏"

func _on_settings() -> void:
	get_tree().change_scene_to_file("res://scenes/settings.tscn")

func _on_restart() -> void:
	GameManager.is_paused = false
	GameManager.start_new_game()
	get_tree().change_scene_to_file("res://scenes/day_phase.tscn")

func _on_quit() -> void:
	GameManager.is_paused = false
	SaveSystem.save_game(1)
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("game_pause"):
		_on_resume()
