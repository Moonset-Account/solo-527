extends Area2D
## 存档点（小段检查点）- 玩家到达后记录当前进度

@export var checkpoint_id: String = "cp_0"
@export var segment_index: int = 0

var _is_activated: bool = false
var _activated_before: bool = false

@onready var sprite: Sprite2D = $Sprite
@onready var indicator: Polygon2D = $Indicator
@onready var label: Label = $Label

func _ready() -> void:
	_setup_collision()
	_connect_events()
	body_entered.connect(_on_body_entered)
	_update_visual()
	if label:
		label.text = "段 %d" % segment_index

func _setup_collision() -> void:
	collision_layer = 0
	collision_mask = 1
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(50, 80)
	shape.shape = rect
	add_child(shape)
	add_to_group("checkpoint")

func _connect_events() -> void:
	EventBus.segment_reset.connect(_on_segment_reset)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("player") and not _is_activated:
		_activate(body)

func _activate(player: Node2D) -> void:
	_is_activated = true
	_activated_before = true
	_update_visual()
	EventBus.emit_checkpoint_reached(checkpoint_id)
	if player.has_method("checkpoint_reached"):
		player.checkpoint_reached(checkpoint_id, global_position)
	var parent_scene := get_tree().current_scene
	if parent_scene:
		var patrol_lights := parent_scene.get_tree().get_nodes_in_group("patrol_light")
		for light in patrol_lights:
			if light.has_method("checkpoint_reached"):
				light.checkpoint_reached()
	var tween := create_tween()
	if indicator:
		tween.tween_property(indicator, "scale", Vector2(1.5, 1.5), 0.2)
		tween.tween_property(indicator, "scale", Vector2(1.0, 1.0), 0.2)
	EventBus.emit_ui_toast("存档点已激活：段 %d" % segment_index, 2.0)

func _update_visual() -> void:
	if not indicator:
		return
	if _is_activated:
		indicator.color = Color(0.3, 1.0, 0.5, 0.9)
	elif _activated_before:
		indicator.color = Color(0.3, 1.0, 0.5, 0.6)
	else:
		indicator.color = Color(0.6, 0.8, 1.0, 0.7)
	if sprite:
		sprite.modulate = Color(1, 1, 1, 1.0) if _is_activated else Color(0.8, 0.9, 1.0, 0.7)

func is_activated() -> bool:
	return _is_activated

func _process(_delta: float) -> void:
	if indicator:
		var pulse := 0.8 + 0.2 * sin(Time.get_ticks_msec() * 0.003)
		indicator.modulate.a = 0.9 if _is_activated else (0.5 + 0.3 * pulse)

func _on_segment_reset() -> void:
	if _activated_before:
		_is_activated = false
		_update_visual()
