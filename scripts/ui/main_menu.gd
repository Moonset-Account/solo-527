extends Control

@onready var start_button: Button = $VBoxContainer/StartButton
@onready var continue_button: Button = $VBoxContainer/ContinueButton
@onready var tutorial_button: Button = $VBoxContainer/TutorialButton
@onready var settings_button: Button = $VBoxContainer/SettingsButton
@onready var quit_button: Button = $VBoxContainer/QuitButton

func _ready() -> void:
	continue_button.disabled = not SaveManager.has_save()
	start_button.grab_focus()
	start_button.pressed.connect(_on_start_pressed)
	continue_button.pressed.connect(_on_continue_pressed)
	tutorial_button.pressed.connect(_on_tutorial_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	quit_button.pressed.connect(_on_quit_pressed)

func _on_start_pressed() -> void:
	GameManager.reset_run()
	var starter_ids = GameResources.get_starter_deck_card_ids()
	for card_id in starter_ids:
		var card = GameResources.create_card_by_id(card_id)
		if card:
			GameManager.player_deck.add_card(card)
	SceneManager.go_to_tutorial()

func _on_continue_pressed() -> void:
	SaveManager.load_game()
	SceneManager.go_to_battle(GameManager.current_chapter, GameManager.current_level)

func _on_tutorial_pressed() -> void:
	if GameManager.player_deck.get_card_count() == 0:
		GameManager.reset_run()
		var starter_ids = GameResources.get_starter_deck_card_ids()
		for card_id in starter_ids:
			var card = GameResources.create_card_by_id(card_id)
			if card:
				GameManager.player_deck.add_card(card)
	SceneManager.go_to_tutorial()

func _on_settings_pressed() -> void:
	var settings_scene = load("res://scenes/settings_menu.tscn")
	var settings = settings_scene.instantiate()
	get_tree().root.add_child(settings)

func _on_quit_pressed() -> void:
	get_tree().quit()
