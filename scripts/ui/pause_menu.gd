extends Control

signal resume_pressed
signal settings_pressed
signal quit_to_menu_pressed

@onready var resume_button: Button = $Panel/VBoxContainer/ResumeButton
@onready var settings_button: Button = $Panel/VBoxContainer/SettingsButton
@onready var quit_button: Button = $Panel/VBoxContainer/QuitButton

func _ready() -> void:
	resume_button.grab_focus()
	resume_button.pressed.connect(_on_resume)
	settings_button.pressed.connect(_on_settings)
	quit_button.pressed.connect(_on_quit)

func _on_resume() -> void:
	resume_pressed.emit()
	queue_free()

func _on_settings() -> void:
	settings_pressed.emit()
	var settings_scene = load("res://scenes/settings_menu.tscn")
	var settings = settings_scene.instantiate()
	get_tree().root.add_child(settings)

func _on_quit() -> void:
	quit_to_menu_pressed.emit()
	SaveManager.save_game()
	SceneManager.go_to_main_menu()

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_on_resume()
		get_viewport().set_input_as_handled()
