class_name LevelComplete
extends Control

var _title_label: Label = null
var _score_label: Label = null
var _satisfaction_label: Label = null
var _tasks_label: Label = null
var _next_button: Button = null
var _menu_button: Button = null

func _ready() -> void:
    var overlay: ColorRect = ColorRect.new()
    overlay.color = Color(0, 0, 0, 0.7)
    overlay.size = Vector2(1280, 720)
    add_child(overlay)

    var vbox: VBoxContainer = VBoxContainer.new()
    vbox.position = Vector2(440, 150)
    vbox.add_theme_constant_override("separation", 16)
    add_child(vbox)

    _title_label = Label.new()
    _title_label.text = "关卡完成!"
    _title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _title_label.add_theme_font_size_override("font_size", 36)
    vbox.add_child(_title_label)

    _score_label = Label.new()
    _score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _score_label.add_theme_font_size_override("font_size", 24)
    vbox.add_child(_score_label)

    _satisfaction_label = Label.new()
    _satisfaction_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _satisfaction_label.add_theme_font_size_override("font_size", 20)
    vbox.add_child(_satisfaction_label)

    _tasks_label = Label.new()
    _tasks_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _tasks_label.add_theme_font_size_override("font_size", 18)
    vbox.add_child(_tasks_label)

    _next_button = Button.new()
    _next_button.text = "下一关"
    _next_button.min_size = Vector2(300, 50)
    vbox.add_child(_next_button)
    _next_button.pressed.connect(_on_next)

    _menu_button = Button.new()
    _menu_button.text = "返回主菜单"
    _menu_button.min_size = Vector2(300, 50)
    vbox.add_child(_menu_button)
    _menu_button.pressed.connect(_on_menu)

func show_results(satisfaction: float, threshold: float, completed: int, total: int, score: int) -> void:
    _satisfaction_label.text = "满意度: %.0f / %.0f" % [satisfaction, threshold]
    _tasks_label.text = "完成任务: %d / %d" % [completed, total]
    _score_label.text = "得分: %d" % score
    GameManager.total_score += score

func _on_next() -> void:
    GameManager.unlock_next_level()
    GameManager.current_level += 1
    SceneManager.change_scene("res://scenes/game.tscn")

func _on_menu() -> void:
    GameManager.unlock_next_level()
    GameManager.change_state(GameManager.GameState.MENU)
    SceneManager.change_scene("res://scenes/main_menu.tscn")
