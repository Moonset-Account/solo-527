class_name MainMenu
extends Control

@onready var start_button: Button = $VBoxContainer/StartButton
@onready var tutorial_button: Button = $VBoxContainer/TutorialButton
@onready var settings_button: Button = $VBoxContainer/SettingsButton
@onready var quit_button: Button = $VBoxContainer/QuitButton

func _ready() -> void:
    start_button.pressed.connect(_on_start_pressed)
    tutorial_button.pressed.connect(_on_tutorial_pressed)
    settings_button.pressed.connect(_on_settings_pressed)
    quit_button.pressed.connect(_on_quit_pressed)
    GameManager.change_state(GameManager.GameState.MENU)

func _on_start_pressed() -> void:
    SceneManager.change_scene("res://scenes/level_select.tscn")

func _on_tutorial_pressed() -> void:
    GameManager.current_level = 0
    SceneManager.change_scene("res://scenes/game.tscn")

func _on_settings_pressed() -> void:
    SceneManager.change_scene("res://scenes/settings.tscn")

func _on_quit_pressed() -> void:
    get_tree().quit()
