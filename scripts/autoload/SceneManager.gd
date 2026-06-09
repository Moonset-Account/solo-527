extends Node
## SceneManager - 场景管理器
## 负责资源预加载、场景切换、加载动画

signal scene_changed(scene_name: String)
signal preload_progress(progress: float)
signal preload_completed()

const SCENES := {
	"MainMenu": "res://scenes/ui/MainMenu.tscn",
	"LevelSelect": "res://scenes/ui/LevelSelect.tscn",
	"GameScene": "res://scenes/game/GameScene.tscn",
	"Settings": "res://scenes/ui/SettingsPanel.tscn",
	"Achievements": "res://scenes/ui/AchievementsPanel.tscn",
	"Tutorial": "res://scenes/ui/TutorialPanel.tscn"
}

var _current_scene: Node = null
var _loaded_resources: Dictionary = {}
var _preload_queue: Array = []
var _is_preloading: bool = false
var _current_scene_name: String = ""
var _transition_overlay: ColorRect = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	call_deferred("_create_transition_overlay")

func _create_transition_overlay() -> void:
	_transition_overlay = ColorRect.new()
	_transition_overlay.color = Color(0.02, 0.02, 0.04, 1.0)
	_transition_overlay.anchor_right = 1.0
	_transition_overlay.anchor_bottom = 1.0
	_transition_overlay.z_index = 4090
	_transition_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	get_tree().root.add_child(_transition_overlay)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(_transition_overlay, "modulate:a", 0.0, 0.4)

func preload_scenes(scene_names: Array) -> void:
	_preload_queue.clear()
	for name in scene_names:
		if SCENES.has(name) and not _loaded_resources.has(name):
			_preload_queue.append(name)
	if _preload_queue.is_empty():
		preload_completed.emit()
		return
	_is_preloading = true
	_async_preload_next()

func _async_preload_next() -> void:
	if _preload_queue.is_empty():
		_is_preloading = false
		preload_completed.emit()
		return
	var name: String = _preload_queue.pop_front()
	var path: String = SCENES[name]
	ResourceLoader.load_threaded_request(path)
	_await_preload(name, path)

func _await_preload(name: String, path: String) -> void:
	var status: int = ResourceLoader.load_threaded_get_status(path)
	while status == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
		var progress: Array = []
		status = ResourceLoader.load_threaded_get_status(path, progress)
		var total: int = progress[0] if progress.size() > 0 else 1
		var current: int = progress[1] if progress.size() > 1 else 0
		var p: float = 0.0
		if total > 0:
			p = float(current) / float(total)
		var overall: float = (1.0 - float(_preload_queue.size() + 1) / 8.0) + p / 8.0
		preload_progress.emit(clamp(overall, 0.0, 1.0))
		await get_tree().process_frame
	if status == ResourceLoader.THREAD_LOAD_LOADED:
		_loaded_resources[name] = ResourceLoader.load_threaded_get(path)
	await get_tree().process_frame
	_async_preload_next()

func change_scene(scene_name: String, with_transition: bool = true, data: Dictionary = {}) -> void:
	if not SCENES.has(scene_name):
		push_error("Scene not found: %s" % scene_name)
		return
	PlaytestRecorder.record_event("scene_change", {"from": _current_scene_name, "to": scene_name})
	if with_transition:
		var tween_in := create_tween()
		tween_in.set_process_mode(Tween.TWEEN_PROCESS_PHYSICS)
		tween_in.tween_property(_transition_overlay, "modulate:a", 1.0, 0.25)
		tween_in.finished.connect(func():
			_perform_switch(scene_name, data)
			var tween_out := create_tween()
			tween_out.set_process_mode(Tween.TWEEN_PROCESS_PHYSICS)
			tween_out.tween_property(_transition_overlay, "modulate:a", 0.0, 0.3)
		)
	else:
		_perform_switch(scene_name, data)

func _perform_switch(scene_name: String, data: Dictionary) -> void:
	if _current_scene:
		_current_scene.queue_free()
		_current_scene = null
	var scene: PackedScene
	if _loaded_resources.has(scene_name):
		scene = _loaded_resources[scene_name]
	else:
		scene = load(SCENES[scene_name])
		if scene:
			_loaded_resources[scene_name] = scene
	if scene == null:
		push_error("Failed to load scene: %s" % scene_name)
		return
	_current_scene = scene.instantiate()
	if data.is_empty() == false and _current_scene.has_method("receive_scene_data"):
		_current_scene.receive_scene_data(data)
	get_tree().root.add_child(_current_scene)
	_current_scene_name = scene_name
	scene_changed.emit(scene_name)

func get_current_scene_name() -> String:
	return _current_scene_name

func get_current_scene() -> Node:
	return _current_scene

func is_loaded(scene_name: String) -> bool:
	return _loaded_resources.has(scene_name)

func unload_scene(scene_name: String) -> void:
	if _loaded_resources.has(scene_name):
		_loaded_resources.erase(scene_name)

func reload_current_scene() -> void:
	if not _current_scene_name.is_empty():
		change_scene(_current_scene_name, true)
