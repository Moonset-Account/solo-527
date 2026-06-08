extends Node

const SCENE_MAIN_MENU := "res://scenes/main_menu.tscn"
const SCENE_BATTLE := "res://scenes/battle.tscn"
const SCENE_TUTORIAL := "res://scenes/tutorial.tscn"
const SCENE_SETTLEMENT := "res://scenes/settlement.tscn"
const SCENE_CARD_REWARD := "res://scenes/card_reward.tscn"

signal scene_changed(scene_path: String)
signal transition_started
signal transition_finished

var _current_scene: Node = null
var _is_transitioning: bool = false

@onready var _transition_rect: ColorRect = null

func _ready() -> void:
	var root = get_tree().root
	_current_scene = root.get_child(root.get_child_count() - 1)

func change_scene(scene_path: String, with_transition: bool = true) -> void:
	if _is_transitioning:
		return
	if with_transition and _get_transition_layer() != null:
		_is_transitioning = true
		transition_started.emit()
		await _fade_out()
		_do_change(scene_path)
		await _fade_in()
		_is_transitioning = false
		transition_finished.emit()
	else:
		_do_change(scene_path)
	scene_changed.emit(scene_path)

func _do_change(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)
	await get_tree().process_frame
	var root = get_tree().root
	_current_scene = root.get_child(root.get_child_count() - 1)

func _fade_out() -> void:
	var canvas = _get_transition_layer()
	if not canvas:
		return
	var anim = canvas.get_node_or_null("AnimationPlayer")
	if anim:
		anim.play("fade_out")
		await anim.animation_finished

func _fade_in() -> void:
	var canvas = _get_transition_layer()
	if not canvas:
		return
	var anim = canvas.get_node_or_null("AnimationPlayer")
	if anim:
		anim.play("fade_in")
		await anim.animation_finished

func _get_transition_layer() -> CanvasLayer:
	return null

func go_to_main_menu() -> void:
	change_scene(SCENE_MAIN_MENU)

func go_to_battle(chapter: int = 0, level: int = 0) -> void:
	GameManager.start_battle(chapter, level)
	change_scene(SCENE_BATTLE)

func go_to_tutorial() -> void:
	change_scene(SCENE_TUTORIAL)

func go_to_settlement(victory: bool) -> void:
	change_scene(SCENE_SETTLEMENT)

func go_to_card_reward() -> void:
	change_scene(SCENE_CARD_REWARD)
