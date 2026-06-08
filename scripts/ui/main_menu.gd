extends Control

@onready var title_label: Label = $TitleLabel
@onready var start_button: Button = $VBoxContainer/StartButton
@onready var tutorial_button: Button = $VBoxContainer/TutorialButton
@onready var settings_button: Button = $VBoxContainer/SettingsButton

var _tween: Tween

func _ready() -> void:
	start_button.pressed.connect(_on_start_pressed)
	tutorial_button.pressed.connect(_on_tutorial_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	_animate_title()

func _animate_title() -> void:
	title_label.pivot_offset = title_label.size / 2.0
	_tween = create_tween().set_loops()
	_tween.tween_property(title_label, "scale", Vector2(1.05, 1.05), 0.8).set_ease(Tween.EASE_IN_OUT)
	_tween.tween_property(title_label, "scale", Vector2(1.0, 1.0), 0.8).set_ease(Tween.EASE_IN_OUT)

func _on_start_pressed() -> void:
	GameManager.change_state(GameManager.GameState.LEVEL_SELECT)

func _on_tutorial_pressed() -> void:
	GameManager.change_state(GameManager.GameState.TUTORIAL)

func _on_settings_pressed() -> void:
	var settings_scene = preload("res://scenes/settings.tscn")
	var settings_instance = settings_scene.instantiate()
	get_tree().root.add_child(settings_instance)
