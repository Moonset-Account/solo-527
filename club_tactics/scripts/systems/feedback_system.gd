class_name FeedbackSystem
extends Node

var _satisfaction_shake_tween: Tween = null
var _bar_target: ProgressBar = null
var _overlay: ColorRect = null

func setup(satisfaction_bar: ProgressBar) -> void:
	_bar_target = satisfaction_bar
	_overlay = ColorRect.new()
	_overlay.color = Color(1, 0, 0, 0)
	_overlay.size = Vector2(1280, 720)
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay.z_index = 100
	get_tree().root.add_child(_overlay)

func shake_satisfaction_bar() -> void:
	if _bar_target == null:
		return
	if _satisfaction_shake_tween:
		_satisfaction_shake_tween.kill()
	_satisfaction_shake_tween = _bar_target.create_tween()
	var orig: float = _bar_target.position.x
	for i in 4:
		_satisfaction_shake_tween.tween_property(_bar_target, "position:x", orig + 4.0, 0.05)
		_satisfaction_shake_tween.tween_property(_bar_target, "position:x", orig - 4.0, 0.05)
	_satisfaction_shake_tween.tween_property(_bar_target, "position:x", orig, 0.05)

func flash_screen(color: Color, duration: float = 0.3) -> void:
	if _overlay == null:
		return
	_overlay.color = Color(color.r, color.g, color.b, 0.3)
	var tween: Tween = _overlay.create_tween()
	tween.tween_property(_overlay, "color:a", 0.0, duration)

func pulse_node(node: Control, scale: float = 1.2, duration: float = 0.3) -> void:
	if node == null:
		return
	var tween: Tween = node.create_tween()
	tween.tween_property(node, "scale", Vector2(scale, scale), duration * 0.5)
	tween.tween_property(node, "scale", Vector2(1.0, 1.0), duration * 0.5)

func play_sfx_by_name(sfx_name: String) -> void:
	var path: String = "res://assets/audio/sfx/%s.wav" % sfx_name
	if ResourceLoader.exists(path):
		var stream: AudioStream = load(path)
		AudioManager.play_sfx(stream)
