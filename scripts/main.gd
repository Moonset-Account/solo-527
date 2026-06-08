extends Node2D

@onready var current_scene_node: Node2D = $CurrentScene

func _ready() -> void:
	GameManager.state_changed.connect(_on_state_changed)
	_load_scene("res://scenes/main_menu.tscn")

func _on_state_changed(old_state: GameManager.GameState, new_state: GameManager.GameState) -> void:
	match new_state:
		GameManager.GameState.MENU:
			_load_scene("res://scenes/main_menu.tscn")
		GameManager.GameState.TUTORIAL:
			_load_scene("res://scenes/tutorial.tscn")
		GameManager.GameState.LEVEL_SELECT:
			_load_scene("res://scenes/level_select.tscn")
		GameManager.GameState.PLAYING:
			_load_scene("res://scenes/game_level.tscn")
		GameManager.GameState.RESULTS:
			_load_scene("res://scenes/results_screen.tscn")
		GameManager.GameState.FAILURE:
			_load_scene("res://scenes/failure_screen.tscn")

func _load_scene(scene_path: String) -> void:
	for child in current_scene_node.get_children():
		child.queue_free()
	var scene_resource = load(scene_path)
	if scene_resource:
		var instance = scene_resource.instantiate()
		current_scene_node.add_child(instance)
