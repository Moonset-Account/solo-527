extends Control

@onready var grid: GridContainer = $GridContainer
@onready var back_button: Button = $BackButton

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	_build_level_buttons()

func _build_level_buttons() -> void:
	for child in grid.get_children():
		child.queue_free()

	var all_levels = LevelManager.get_all_levels()
	for level_data in all_levels:
		var level_id = str(level_data.get("level_id", ""))
		var level_name = level_data.get("level_name", "关卡")
		var stars = LevelManager.level_progress.get(level_id, 0)
		var is_locked = not LevelManager.is_level_unlocked(level_id)

		var button = Button.new()
		var star_text = ""
		for s in range(3):
			if s < stars:
				star_text += "★"
			else:
				star_text += "☆"
		button.text = level_name + "\n" + star_text
		button.disabled = is_locked
		button.custom_minimum_size = Vector2(160, 80)

		if is_locked:
			button.modulate = Color(0.5, 0.5, 0.5, 1.0)

		button.pressed.connect(_on_level_selected.bind(level_id))
		grid.add_child(button)

func _on_level_selected(level_id: String) -> void:
	GameManager.current_level_id = level_id
	GameManager.change_state(GameManager.GameState.PLAYING)

func _on_back_pressed() -> void:
	GameManager.change_state(GameManager.GameState.MENU)
