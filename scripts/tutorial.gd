extends Control

@onready var _start_button: Button = $PanelContainer/VBoxContainer/HBoxContainer/StartButton
@onready var _skip_button: Button = $PanelContainer/VBoxContainer/HBoxContainer/SkipButton
@onready var _message_label: Label = $PanelContainer/VBoxContainer/MessageLabel

func _ready() -> void:
	_start_button.pressed.connect(_on_start)
	_skip_button.pressed.connect(_on_skip)
	_message_label.text = GameManager.get_tutorial_message()
	if _message_label.text.is_empty():
		_message_label.text = "欢迎来到小镇集市！白天采购商品，晚上定价陈列，赚取利润！"

func _on_start() -> void:
	GameManager.start_new_game()
	get_tree().change_scene_to_file("res://scenes/day_phase.tscn")

func _on_skip() -> void:
	GameManager.skip_tutorial()
	GameManager.start_new_game()
	get_tree().change_scene_to_file("res://scenes/day_phase.tscn")
