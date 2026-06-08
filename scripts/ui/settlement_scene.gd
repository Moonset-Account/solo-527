extends Control

@onready var settlement_ui: Control = $SettlementUI

func _ready() -> void:
	settlement_ui.continue_to_reward.connect(_on_continue_to_reward)
	settlement_ui.retry_pressed.connect(_on_retry)
	settlement_ui.return_to_menu.connect(_on_return_to_menu)
	settlement_ui.setup(GameManager.last_battle_victory)

func _on_continue_to_reward() -> void:
	SceneManager.go_to_card_reward()

func _on_retry() -> void:
	SceneManager.go_to_battle(GameManager.current_chapter, GameManager.current_level)

func _on_return_to_menu() -> void:
	SceneManager.go_to_main_menu()
