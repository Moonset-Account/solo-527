extends Node
class_name MainSceneController

@onready var current_scene: Node2D = $CurrentScene
@onready var ui_layer: CanvasLayer = $UILayer

var _current_ui: Control = null
var _current_game: Node2D = null

func _ready() -> void:
	SceneManager.scene_requested.connect(_on_scene_requested)
	SceneManager.ui_requested.connect(_on_ui_requested)
	SceneManager.ui_closed.connect(_on_ui_closed)
	SceneManager.register_scene("game", "res://scenes/game.tscn")
	SceneManager.register_scene("main", "res://scenes/main.tscn")
	_on_ui_requested("main_menu")

func _on_scene_requested(scene_name: String) -> void:
	_clear_current_ui()
	match scene_name:
		"game":
			_clear_current_scene()
			var game_scene := load("res://scenes/game.tscn") as PackedScene
			if game_scene:
				_current_game = game_scene.instantiate()
				current_scene.add_child(_current_game)
		"level_select":
			_on_ui_requested("level_select")
		"level_editor":
			_on_ui_requested("level_editor")
		"settings":
			_on_ui_requested("settings")
		"main_menu":
			_clear_current_scene()
			_on_ui_requested("main_menu")
		_:
			push_warning("Unknown scene requested: " + scene_name)

func _on_ui_requested(ui_name: String) -> void:
	_clear_current_ui()
	var ui_path := "res://scenes/ui/" + ui_name + ".tscn"
	var ui_scene := load(ui_path) as PackedScene
	if ui_scene:
		_current_ui = ui_scene.instantiate()
		ui_layer.add_child(_current_ui)
		_connect_ui_signals(ui_name, _current_ui)
	else:
		push_warning("Failed to load UI scene: " + ui_path)

func _on_ui_closed() -> void:
	_clear_current_ui()

func _connect_ui_signals(ui_name: String, ui: Control) -> void:
	match ui_name:
		"main_menu":
			if ui.has_signal("start_game"):
				ui.start_game.connect(_on_start_game)
			if ui.has_signal("select_level"):
				ui.select_level.connect(func(): SceneManager.request_ui("level_select"))
			if ui.has_signal("open_editor"):
				ui.open_editor.connect(func(): SceneManager.request_ui("level_editor"))
			if ui.has_signal("open_settings"):
				ui.open_settings.connect(func(): SceneManager.request_ui("settings"))
			if ui.has_signal("quit_game"):
				ui.quit_game.connect(func(): get_tree().quit())
		"level_select":
			if ui.has_signal("level_selected"):
				ui.level_selected.connect(_on_level_selected)
			if ui.has_signal("back_pressed"):
				ui.back_pressed.connect(func(): SceneManager.request_scene("main_menu"))
		"settings":
			if ui.has_signal("close_requested"):
				ui.close_requested.connect(func(): SceneManager.close_ui())
		"level_editor":
			pass

func _on_start_game() -> void:
	LevelManager.load_level("level_01")
	SceneManager.request_scene("game")

func _on_level_selected(level_id: String) -> void:
	LevelManager.load_level(level_id)
	SceneManager.request_scene("game")

func _clear_current_ui() -> void:
	if _current_ui:
		_current_ui.queue_free()
		_current_ui = null

func _clear_current_scene() -> void:
	if _current_game:
		_current_game.queue_free()
		_current_game = null
