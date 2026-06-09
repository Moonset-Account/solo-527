extends Area2D

class_name Checkpoint

@export var checkpoint_id: int = 0
@export var auto_trigger: bool = true

var activated: bool = false

signal checkpoint_triggered(cp: Node)

@onready var visual: ColorRect = $Visual
@onready var label: Label = $Label

func _ready():
	body_entered.connect(_on_body_entered)
	if visual:
		visual.color = Color(0.3, 0.3, 1.0, 0.4)
	if label:
		label.text = "检查点 %d" % checkpoint_id

func _on_body_entered(body):
	if not auto_trigger:
		return
	if not body.has_method("set_checkpoint"):
		return
	if activated:
		return
	activated = true
	if visual:
		visual.color = Color(0.2, 1.0, 0.3, 0.5)
	if label:
		label.text = "检查点 %d ✓" % checkpoint_id
	body.set_checkpoint()
	emit_signal("checkpoint_triggered", self)

func trigger_manually(player: Node):
	if player and player.has_method("set_checkpoint"):
		player.set_checkpoint()
		activated = true
