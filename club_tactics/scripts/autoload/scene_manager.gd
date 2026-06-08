extends Node
class_name SceneManager

signal scene_loaded(scene_path: String)

var _scene_queue: Dictionary = {}
var _current_scene: Node = null
var _root: Node = null

func _ready() -> void:
	_root = get_tree().root

func preload_scene(path: String) -> void:
	if _scene_queue.has(path):
		return
	ResourceLoader.load_threaded_request(path)

func change_scene(path: String) -> void:
	var packed: PackedScene = get_preloaded_scene(path)
	if packed == null:
		return
	if _current_scene != null:
		_current_scene.queue_free()
	_current_scene = packed.instantiate()
	_root.add_child(_current_scene)
	scene_loaded.emit(path)

func change_scene_with_transition(path: String, transition_time: float = 0.5) -> void:
	var fade: ColorRect = ColorRect.new()
	fade.color = Color.BLACK
	fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_child(fade)
	fade.modulate.a = 0.0
	var tween: Tween = create_tween()
	tween.tween_property(fade, "modulate:a", 1.0, transition_time * 0.5)
	await tween.finished
	change_scene(path)
	var tween_in: Tween = create_tween()
	tween_in.tween_property(fade, "modulate:a", 0.0, transition_time * 0.5)
	await tween_in.finished
	fade.queue_free()

func get_preloaded_scene(path: String) -> PackedScene:
	if _scene_queue.has(path):
		return _scene_queue[path]
	if ResourceLoader.load_threaded_get_status(path) == ResourceLoader.THREAD_LOAD_LOADED:
		var packed: PackedScene = ResourceLoader.load_threaded_get(path)
		_scene_queue[path] = packed
		return packed
	var packed: PackedScene = load(path) as PackedScene
	if packed != null:
		_scene_queue[path] = packed
	return packed
