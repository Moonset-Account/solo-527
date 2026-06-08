class_name PauseMenu
extends Control

var _resume_button: Button = null
var _settings_button: Button = null
var _restart_button: Button = null
var _quit_button: Button = null
var _overlay: ColorRect = null

func _ready() -> void:
    _overlay = ColorRect.new()
    _overlay.color = Color(0, 0, 0, 0.6)
    _overlay.size = Vector2(1280, 720)
    add_child(_overlay)

    var vbox: VBoxContainer = VBoxContainer.new()
    vbox.position = Vector2(490, 200)
    vbox.add_theme_constant_override("separation", 16)
    add_child(vbox)

    _resume_button = Button.new()
    _resume_button.text = "继续游戏"
    _resume_button.min_size = Vector2(300, 50)
    vbox.add_child(_resume_button)

    _settings_button = Button.new()
    _settings_button.text = "设置"
    _settings_button.min_size = Vector2(300, 50)
    vbox.add_child(_settings_button)

    _restart_button = Button.new()
    _restart_button.text = "重新开始"
    _restart_button.min_size = Vector2(300, 50)
    vbox.add_child(_restart_button)

    _quit_button = Button.new()
    _quit_button.text = "返回主菜单"
    _quit_button.min_size = Vector2(300, 50)
    vbox.add_child(_quit_button)

    _resume_button.pressed.connect(_on_resume)
    _settings_button.pressed.connect(_on_settings)
    _restart_button.pressed.connect(_on_restart)
    _quit_button.pressed.connect(_on_quit)

    visible = false

func show_pause() -> void:
    visible = true
    GameManager.change_state(GameManager.GameState.PAUSED)
    get_tree().paused = true

func hide_pause() -> void:
    visible = false
    GameManager.change_state(GameManager.GameState.PLAYING)
    get_tree().paused = false

func _on_resume() -> void:
    hide_pause()

func _on_settings() -> void:
    SceneManager.change_scene("res://scenes/settings.tscn")

func _on_restart() -> void:
    get_tree().paused = false
    GameManager.reset_run()
    SceneManager.change_scene("res://scenes/game.tscn")

func _on_quit() -> void:
    get_tree().paused = false
    GameManager.reset_run()
    SceneManager.change_scene("res://scenes/main_menu.tscn")

func _input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel"):
        if visible:
            hide_pause()
        elif GameManager.current_state == GameManager.GameState.PLAYING:
            show_pause()
