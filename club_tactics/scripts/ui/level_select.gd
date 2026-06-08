class_name LevelSelect
extends Control

var _level_buttons: Array[Button] = []
var _back_button: Button = null

func _ready() -> void:
    var title: Label = Label.new()
    title.text = "选择关卡"
    title.position = Vector2(540, 30)
    title.add_theme_font_size_override("font_size", 32)
    add_child(title)

    var grid: GridContainer = GridContainer.new()
    grid.position = Vector2(340, 100)
    grid.columns = 3
    grid.add_theme_constant_override("h_separation", 20)
    grid.add_theme_constant_override("v_separation", 20)
    add_child(grid)

    for i in range(5):
        var btn: Button = Button.new()
        var level_name: String = "关卡 %d" % (i + 1)
        if i == 0:
            level_name = "教程"
        btn.text = level_name
        btn.min_size = Vector2(180, 80)
        btn.disabled = i > GameManager.max_unlocked_level
        btn.pressed.connect(_on_level_pressed.bind(i))
        grid.add_child(btn)
        _level_buttons.append(btn)

    _back_button = Button.new()
    _back_button.text = "返回"
    _back_button.position = Vector2(540, 630)
    _back_button.min_size = Vector2(200, 50)
    add_child(_back_button)
    _back_button.pressed.connect(_on_back)

func _on_level_pressed(index: int) -> void:
    GameManager.current_level = index
    SceneManager.change_scene("res://scenes/game.tscn")

func _on_back() -> void:
    SceneManager.change_scene("res://scenes/main_menu.tscn")
