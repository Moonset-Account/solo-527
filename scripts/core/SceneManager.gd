extends Node

const SCENES: Dictionary = {
    "Main": "res://scenes/main/Main.tscn",
    "LevelSelect": "res://scenes/levels/LevelSelect.tscn",
    "Game": "res://scenes/game/GameScene.tscn",
    "Settings": "res://scenes/ui/SettingsDialog.tscn"
}

var _current_scene: Node = null
var _scene_stack: Array = []
var _is_transitioning: bool = false

func change_scene(scene_name: String, add_to_stack: bool = false) -> void:
    if _is_transitioning:
        return
    
    var scene_path = SCENES.get(scene_name, "")
    if scene_path.is_empty():
        push_warning("场景不存在: " + scene_name)
        return
    
    if add_to_stack and _current_scene != null:
        _scene_stack.append(_current_scene.name)
    
    _is_transitioning = true
    var loaded_scene = GameAssets.load_scene(scene_path)
    if loaded_scene == null:
        loaded_scene = load(scene_path) as PackedScene
    if loaded_scene == null:
        push_error("场景加载失败: " + scene_path)
        _is_transitioning = false
        return
    
    var root = get_tree().root
    var new_scene_instance = loaded_scene.instantiate()
    
    if _current_scene != null:
        _current_scene.queue_free()
    
    root.add_child(new_scene_instance)
    _current_scene = new_scene_instance
    
    AudioManager.play_sfx("transition")
    _is_transitioning = false

func get_current_scene() -> Node:
    return _current_scene
