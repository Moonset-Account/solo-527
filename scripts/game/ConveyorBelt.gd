extends Node2D
## ConveyorBelt - 传送带节点
## 在网格间运输产品，连接机器

const DP := preload("res://scripts/data/DataProvider.gd")

signal product_transferred(product_node: Node2D, from_dir: Vector2i)

@export var conveyor_id: String = ""
@export var grid_pos: Vector2i = Vector2i.ZERO
@export var direction_deg: int = 0

var speed_multiplier: float = 1.0
var visual_belt: ColorRect = null
var arrow_anim: float = 0.0
var products_on_belt: Array = []
var is_horizontal: bool = true

func _ready() -> void:
	_setup_visual()

func _setup_visual() -> void:
	var s: float = GameState.GRID_SIZE - 2
	visual_belt = ColorRect.new()
	visual_belt.size = Vector2(s, s)
	visual_belt.position = -Vector2(s, s) / 2.0
	visual_belt.color = Color(0.3, 0.3, 0.35)
	visual_belt.z_index = 1
	add_child(visual_belt)
	for i in 4:
		var stripe := ColorRect.new()
		stripe.color = Color(0.55, 0.55, 0.62)
		if direction_deg == 0 or direction_deg == 180:
			stripe.size = Vector2(4, s * 0.85)
			stripe.position = Vector2(-2 + (i - 1.5) * (s / 4.0), -s * 0.425)
			is_horizontal = false
		else:
			stripe.size = Vector2(s * 0.85, 4)
			stripe.position = Vector2(-s * 0.425, -2 + (i - 1.5) * (s / 4.0))
			is_horizontal = true
		stripe.z_index = 2
		stripe.name = "stripe_%d" % i
		add_child(stripe)

func get_flow_direction() -> Vector2i:
	match direction_deg:
		0: return Vector2i(0, 1)
		90: return Vector2i(1, 0)
		180: return Vector2i(0, -1)
		270: return Vector2i(-1, 0)
	return Vector2i(0, 1)

func _process(delta: float) -> void:
	if GameState.is_paused:
		return
	arrow_anim += delta * GameState.game_speed * 4.0 * speed_multiplier
	for i in 4:
		var stripe = get_node_or_null("stripe_%d" % i)
		if stripe:
			var progress: float = fmod(arrow_anim / 6.0 + float(i) / 4.0, 1.0)
			var s: float = GameState.GRID_SIZE - 2
			if is_horizontal:
				stripe.position.x = -s * 0.425 + progress * s * 0.85 - (s * 0.85 / 2.0)
			else:
				stripe.position.y = -s * 0.425 + progress * s * 0.85 - (s * 0.85 / 2.0)

func rotate_placement(deg: int = 90) -> void:
	direction_deg = (direction_deg + deg) % 360
	for child in get_children():
		child.queue_free()
	_setup_visual()

func to_dict() -> Dictionary:
	return {
		"id": conveyor_id,
		"machine_type": "conveyor",
		"grid_x": grid_pos.x,
		"grid_y": grid_pos.y,
		"level": 1,
		"rotation": direction_deg,
		"base_cost": DP.get_machine_config("conveyor").get("base_cost", 30),
		"production_rate": speed_multiplier,
		"type": "conveyor"
	}
