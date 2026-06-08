class_name SceneManager
extends Node

signal scene_changed(scene_name: String)
signal scene_requested(scene_name: String)
signal ui_requested(ui_name: String)
signal ui_closed()

var _scene_registry: Dictionary = {}
var _preloaded_scenes: Dictionary = {}
var _current_scene_name: String = ""
var _fade_overlay: ColorRect
var _tween: Tween
var _is_transitioning: bool = false

func _ready() -> void:
	_fade_overlay = ColorRect.new()
	_fade_overlay.color = Color.BLACK
	_fade_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade_overlay.z_index = 100
	var canvas_layer = CanvasLayer.new()
	canvas_layer.layer = 100
	canvas_layer.add_child(_fade_overlay)
	add_child(canvas_layer)
	_fade_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade_overlay.modulate.a = 0.0

func register_scene(scene_name: String, scene_path: String) -> void:
	_scene_registry[scene_name] = scene_path

func change_scene(scene_name: String) -> void:
	if _is_transitioning:
		return
	if not _scene_registry.has(scene_name):
		push_error("SceneManager: Scene '%s' not found in registry" % scene_name)
		return
	_is_transitioning = true
	var path: String = _scene_registry[scene_name]
	get_tree().change_scene_to_file(path)
	_current_scene_name = scene_name
	scene_changed.emit(scene_name)
	_is_transitioning = false

func change_scene_with_transition(scene_name: String, duration: float = 1.0) -> void:
	if _is_transitioning:
		return
	if not _scene_registry.has(scene_name):
		push_error("SceneManager: Scene '%s' not found in registry" % scene_name)
		return
	_is_transitioning = true
	_fade_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	var half_duration: float = duration / 2.0
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(_fade_overlay, "modulate:a", 1.0, half_duration)
	_tween.tween_callback(_do_change_scene.bind(scene_name))
	_tween.tween_property(_fade_overlay, "modulate:a", 0.0, half_duration)
	_tween.tween_callback(_on_transition_finished)

func _do_change_scene(scene_name: String) -> void:
	var path: String = _scene_registry[scene_name]
	get_tree().change_scene_to_file(path)
	_current_scene_name = scene_name
	scene_changed.emit(scene_name)

func _on_transition_finished() -> void:
	_fade_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_is_transitioning = false

func preload_scene(scene_name: String) -> void:
	if not _scene_registry.has(scene_name):
		push_error("SceneManager: Scene '%s' not found in registry" % scene_name)
		return
	if _preloaded_scenes.has(scene_name):
		return
	var path: String = _scene_registry[scene_name]
	_preloaded_scenes[scene_name] = load(path)

func get_preloaded_scene(scene_name: String) -> PackedScene:
	if _preloaded_scenes.has(scene_name):
		return _preloaded_scenes[scene_name]
	return null

func request_scene(scene_name: String) -> void:
	scene_requested.emit(scene_name)

func request_ui(ui_name: String) -> void:
	ui_requested.emit(ui_name)

func close_ui() -> void:
	ui_closed.emit()

func get_current_scene_name() -> String:
	return _current_scene_name

func is_transitioning() -> bool:
	return _is_transitioning
