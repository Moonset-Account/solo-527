extends Node
## 场景管理器 - 负责场景切换、过渡动画

signal scene_changed(new_scene_name: String)

var _current_scene: Node = null
var _transition_overlay: ColorRect = null
var _is_transitioning: bool = false

const SCENE_PATHS := {
    "main": "res://scenes/Main.tscn",
    "level_select": "res://scenes/LevelSelect.tscn",
    "game": "res://scenes/Game.tscn",
    "tutorial": "res://scenes/Tutorial.tscn",
    "settings": "res://scenes/Settings.tscn",
    "achievements": "res://scenes/Achievements.tscn",
    "leaderboard": "res://scenes/Leaderboard.tscn",
    "daily": "res://scenes/DailyChallenge.tscn"
}

func _ready() -> void:
    _create_overlay()

func _create_overlay() -> void:
    _transition_overlay = ColorRect.new()
    _transition_overlay.color = Color.BLACK
    _transition_overlay.z_index = 1000
    _transition_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    _transition_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
    _transition_overlay.visible = false
    add_child(_transition_overlay)

func change_scene(scene_name: String, with_transition: bool = true) -> void:
    if _is_transitioning:
        return
    if not SCENE_PATHS.has(scene_name):
        push_error("Unknown scene: %s" % scene_name)
        return

    if with_transition:
        _is_transitioning = true
        await _fade_in()
        _load_and_switch(scene_name)
        await _fade_out()
        _is_transitioning = false
    else:
        _load_and_switch(scene_name)

func _load_and_switch(scene_name: String) -> void:
    var path: String = SCENE_PATHS[scene_name]
    var scene: PackedScene = load(path)
    if scene == null:
        push_error("Failed to load scene: %s" % path)
        return

    var root: Node = get_tree().root
    if _current_scene and _current_scene.is_inside_tree():
        root.remove_child(_current_scene)
        _current_scene.queue_free()

    _current_scene = scene.instantiate()
    root.add_child(_current_scene)
    scene_changed.emit(scene_name)

func _fade_in() -> Tween:
    _transition_overlay.visible = true
    _transition_overlay.modulate.a = 0.0
    var tween: Tween = create_tween()
    tween.tween_property(_transition_overlay, "modulate:a", 1.0, 0.3)
    await tween.finished
    return tween

func _fade_out() -> Tween:
    _transition_overlay.visible = true
    var tween: Tween = create_tween()
    tween.tween_property(_transition_overlay, "modulate:a", 0.0, 0.3)
    await tween.finished
    _transition_overlay.visible = false
    return tween

func reload_current() -> void:
    if _current_scene:
        var scene_name: String = ""
        for name in SCENE_PATHS.keys():
            if SCENE_PATHS[name] == _current_scene.scene_file_path:
                scene_name = name
                break
        var root: Node = get_tree().root
        root.remove_child(_current_scene)
        _current_scene.queue_free()
        _current_scene = null
        if not scene_name.is_empty():
            _load_and_switch(scene_name)
