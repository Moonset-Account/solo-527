extends Node2D
## 游戏场景根节点 - 整合GameController和HUD

@onready var game_layer: Node2D = $GameLayer
@onready var hud: CanvasLayer = $HUD

var game_controller: GameController = null
var pause_panel_scene: PackedScene
var result_panel_scene: PackedScene

func _ready() -> void:
    name = "GameRoot"
    add_to_group("game_root")
    pause_panel_scene = load("res://scenes/PausePanel.tscn")
    result_panel_scene = load("res://scenes/ResultPanel.tscn")
    _setup_game_controller()
    _load_level_data()
    _connect_state_signals()
    get_tree().process_mode = Node.PROCESS_MODE_ALWAYS

func _setup_game_controller() -> void:
    game_controller = GameController.new()
    game_controller.name = "GameController"
    add_child(game_controller)
    game_controller.setup(self, game_layer)
    game_controller.level_finished_event.connect(_on_level_finished)
    game_controller.score_changed.connect(_on_score_changed)

func _load_level_data() -> void:
    var level_id: int = GameState.current_level_id
    var level_def: Dictionary = {}
    if GameState.is_daily_mode:
        level_def = LeaderboardSystem.generate_daily_challenge()
    else:
        level_def = ResourceLoader_.get_level_def(level_id)
        if level_def.is_empty():
            level_def = ResourceLoader_.get_level_def(1)
    game_controller.load_level(level_def)
    if hud and hud.has_method("set_level_info"):
        hud.set_level_info(level_def)
    _update_hud_stats()

func _connect_state_signals() -> void:
    GameState.state_changed.connect(_on_state_changed)

func _on_state_changed(old: int, new: int) -> void:
    if new == GameState.GAME_PAUSED:
        _show_pause_menu()
    elif new == GameState.GAME_PLAYING and old == GameState.GAME_PAUSED:
        _hide_pause_menu()

func _show_pause_menu() -> void:
    if pause_panel_scene:
        var panel: Control = pause_panel_scene.instantiate()
        panel.name = "PauseMenu"
        add_child(panel)
        if panel.has_method("open"):
            panel.open()

func _hide_pause_menu() -> void:
    var existing = get_node_or_null("PauseMenu")
    if existing and is_instance_valid(existing):
        existing.queue_free()

func _on_level_finished(result: Dictionary) -> void:
    if result_panel_scene:
        var panel: Control = result_panel_scene.instantiate()
        panel.name = "ResultPanel"
        add_child(panel)
        if panel.has_method("show_result"):
            panel.show_result(result)

func _on_score_changed(new_score: int, stars: int) -> void:
    if hud and hud.has_method("update_score"):
        hud.update_score(new_score, stars)

func _process(delta: float) -> void:
    if game_controller and hud:
        var stats: Dictionary = game_controller.get_current_stats()
        if hud.has_method("update_stats"):
            hud.update_stats(stats)

func try_undo() -> void:
    if game_controller:
        if not game_controller.try_undo():
            UIManager.show_toast("没有可以撤销的操作")

func submit_level() -> void:
    if game_controller:
        game_controller.try_submit()

func _exit_tree() -> void:
    if game_controller:
        game_controller.cleanup()
