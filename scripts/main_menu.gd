extends Control

@onready var start_button: Button = %StartButton
@onready var continue_button: Button = %ContinueButton
@onready var tutorial_button: Button = %TutorialButton
@onready var settings_button: Button = %SettingsButton
@onready var quit_button: Button = %QuitButton

func _ready() -> void:
	start_button.pressed.connect(_on_start_pressed)
	continue_button.pressed.connect(_on_continue_pressed)
	tutorial_button.pressed.connect(_on_tutorial_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	quit_button.pressed.connect(_on_quit_pressed)
	continue_button.disabled = not SaveSystem.has_save()

func _on_start_pressed() -> void:
	GameManager.start_new_game()
	get_tree().change_scene_to_file("res://scenes/day_phase.tscn")

func _on_continue_pressed() -> void:
	var save_data := SaveSystem.load_game()
	if save_data.is_empty():
		return
	SaveSystem.apply_loaded_data(save_data)
	get_tree().change_scene_to_file("res://scenes/day_phase.tscn")

func _on_tutorial_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/tutorial.tscn")

func _on_settings_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/settings.tscn")

func _on_quit_pressed() -> void:
	get_tree().quit()
