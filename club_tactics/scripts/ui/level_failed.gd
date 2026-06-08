class_name LevelFailed
extends Control

var _title_label: Label = null
var _reason_label: Label = null
var _satisfaction_label: Label = null
var _retry_button: Button = null
var _menu_button: Button = null

func _ready() -> void:
    var overlay: ColorRect = ColorRect.new()
    overlay.color = Color(0.4, 0, 0, 0.7)
    overlay.size = Vector2(1280, 720)
    add_child(overlay)

    var vbox: VBoxContainer = VBoxContainer.new()
    vbox.position = Vector2(440, 180)
    vbox.add_theme_constant_override("separation", 16)
    add_child(vbox)

    _title_label = Label.new()
    _title_label.text = "活动满意度不足"
    _title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _title_label.add_theme_font_size_override("font_size", 36)
    _title_label.modulate = Color.RED
    vbox.add_child(_title_label)

    _reason_label = Label.new()
    _reason_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _reason_label.add_theme_font_size_override("font_size", 20)
    vbox.add_child(_reason_label)

    _satisfaction_label = Label.new()
    _satisfaction_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _satisfaction_label.add_theme_font_size_override("font_size", 18)
    vbox.add_child(_satisfaction_label)

    _retry_button = Button.new()
    _retry_button.text = "重新尝试"
    _retry_button.custom_minimum_size = Vector2(300, 50)
    vbox.add_child(_retry_button)
    _retry_button.pressed.connect(_on_retry)

    _menu_button = Button.new()
    _menu_button.text = "返回主菜单"
    _menu_button.custom_minimum_size = Vector2(300, 50)
    vbox.add_child(_menu_button)
    _menu_button.pressed.connect(_on_menu)

func show_results(satisfaction: float, threshold: float, reason: String = "") -> void:
    _satisfaction_label.text = "满意度: %.0f / %.0f (需要 %.0f)" % [satisfaction, threshold, threshold]
    _reason_label.text = reason if reason != "" else "活动满意度未达到要求，社团活动效果不佳..."

func _on_retry() -> void:
    GameManager.reset_run()
    SceneManager.change_scene("res://scenes/game.tscn")

func _on_menu() -> void:
    GameManager.reset_run()
    GameManager.change_state(GameManager.GameState.MENU)
    SceneManager.change_scene("res://scenes/main_menu.tscn")
