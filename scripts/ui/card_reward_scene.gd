extends Control

@onready var reward_ui: Control = $RewardUI

func _ready() -> void:
	reward_ui.card_selected.connect(_on_card_selected)
	reward_ui.selection_skipped.connect(_on_skipped)
	var chapter_data = GameResources.get_chapter_data(GameManager.current_chapter)
	var reward_ids: Array[String] = []
	if chapter_data:
		reward_ids = chapter_data.reward_card_ids
	if reward_ids.is_empty():
		_on_skipped()
		return
	reward_ui.setup_rewards(reward_ids)

func _on_card_selected(card_id: String) -> void:
	_advance_level()

func _on_skipped() -> void:
	_advance_level()

func _advance_level() -> void:
	var chapter_data = GameResources.get_chapter_data(GameManager.current_chapter)
	if not chapter_data:
		SceneManager.go_to_main_menu()
		return
	var next_level = GameManager.current_level + 1
	if next_level >= chapter_data.get_level_count():
		var next_chapter = GameManager.current_chapter + 1
		if next_chapter >= GameResources.get_chapter_count():
			SceneManager.go_to_main_menu()
			return
		SceneManager.go_to_battle(next_chapter, 0)
	else:
		SceneManager.go_to_battle(GameManager.current_chapter, next_level)
