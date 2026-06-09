extends Control

@onready var start_button: Button = $ButtonContainer/StartButton
@onready var codex_button: Button = $ButtonContainer/CodexButton
@onready var level_select_button: Button = $ButtonContainer/LevelSelectButton
@onready var quit_button: Button = $ButtonContainer/QuitButton
@onready var gold_label: Label = $GoldLabel

func _ready() -> void:
	start_button.pressed.connect(_on_start_pressed)
	codex_button.pressed.connect(_on_codex_pressed)
	level_select_button.pressed.connect(_on_level_select_pressed)
	quit_button.pressed.connect(_on_quit_pressed)
	_update_gold()

func _update_gold() -> void:
	gold_label.text = "金币：%d" % GameManager.player_gold

func _on_start_pressed() -> void:
	GameManager.change_scene("LevelSelect")

func _on_codex_pressed() -> void:
	GameManager.change_scene("Codex")

func _on_level_select_pressed() -> void:
	GameManager.change_scene("LevelSelect")

func _on_quit_pressed() -> void:
	get_tree().quit()
