extends Node2D
## Product - 产品/中间件节点
## 沿传送带移动，在机器间流转

const DP := preload("res://scripts/data/DataProvider.gd")

signal delivered(product_type: String)
signal stuck(product_node: Node2D)

@export var product_type: String = "raw_material"
@export var move_speed: float = 90.0
@export var tier: int = 0

var value: int = 0
var color: Color = Color.WHITE
var path_points: Array = []
var current_path_index: int = 0
var is_moving: bool = false
var lifetime: float = 0.0
var stuck_time: float = 0.0
var quality_passed: bool = true
var visual_sprite: ColorRect = null
var label: Label = null

func _ready() -> void:
	_setup_visual()
	var cfg: Dictionary = DP.get_product_config(product_type)
	if cfg:
		value = cfg.get("value", 0)
		color = cfg.get("color", Color.WHITE)
		tier = cfg.get("tier", 0)
		if visual_sprite:
			visual_sprite.color = color

func _setup_visual() -> void:
	visual_sprite = ColorRect.new()
	visual_sprite.size = Vector2(28, 28)
	visual_sprite.position = Vector2(-14, -14)
	visual_sprite.color = Color(0.9, 0.85, 0.5)
	add_child(visual_sprite)
	var border := ColorRect.new()
	border.size = Vector2(32, 32)
	border.position = Vector2(-16, -16)
	border.color = Color(0, 0, 0, 0.6)
	border.z_index = -1
	add_child(border)
	label = Label.new()
	label.text = ""
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.offset_left = -16
	label.offset_right = 16
	label.offset_top = -14
	label.offset_bottom = 18
	label.add_theme_font_size_override("font_size", 12)
	label.modulate = Color(0.1, 0.08, 0.15, 1)
	add_child(label)

func set_path(new_path: Array) -> void:
	path_points = new_path
	current_path_index = 0
	if path_points.size() > 0:
		global_position = path_points[0]
		is_moving = true
		stuck_time = 0.0

func append_path_point(point: Vector2) -> void:
	path_points.append(point)
	if not is_moving:
		is_moving = true
		stuck_time = 0.0

func _process(delta: float) -> void:
	lifetime += delta
	if GameState.is_paused:
		return
	var speed := move_speed * GameState.game_speed
	if is_moving and current_path_index < path_points.size() - 1:
		var target: Vector2 = path_points[current_path_index + 1]
		var dir: Vector2 = target - global_position
		var dist: float = dir.length()
		if dist < 2.0:
			global_position = target
			current_path_index += 1
			stuck_time = 0.0
		else:
			global_position += dir.normalized() * speed * delta
			stuck_time = 0.0
	else:
		stuck_time += delta
		if stuck_time > 5.0:
			stuck.emit(self)
			stuck_time = 0.0

func set_color(new_color: Color) -> void:
	color = new_color
	if visual_sprite:
		visual_sprite.color = new_color

func mark_quality(passed: bool) -> void:
	quality_passed = passed
	if visual_sprite:
		if passed:
			visual_sprite.color = color
		else:
			visual_sprite.color = color.darkened(0.4)

func destroy_self() -> void:
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "scale", Vector2(0.1, 0.1), 0.15)
	tween.tween_property(self, "modulate:a", 0.0, 0.15)
	tween.finished.connect(queue_free)
