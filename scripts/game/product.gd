class_name Product
extends Node2D

enum ProductStage {RAW, CUT, ASSEMBLED, PAINTED, PACKED, FAILED}

@export var product_type: String = "standard"

var stage: ProductStage = ProductStage.RAW
var quality: float = 1.0
var is_moving: bool = false
var current_belt: ConveyorBelt = null
var creation_time: float = 0.0
var processing_history: Array[Dictionary] = []
var current_cell: Vector2i = Vector2i.ZERO
var path: Array[Vector2i] = []
var path_index: int = 0
var move_speed: float = 1.0

func _ready() -> void:
	creation_time = Time.get_ticks_msec() / 1000.0

func advance_stage() -> bool:
	if stage == ProductStage.FAILED or stage == ProductStage.PACKED:
		return false
	var next_stages: Dictionary = {
		ProductStage.RAW: ProductStage.CUT,
		ProductStage.CUT: ProductStage.ASSEMBLED,
		ProductStage.ASSEMBLED: ProductStage.PAINTED,
		ProductStage.PAINTED: ProductStage.PACKED,
	}
	if not next_stages.has(stage):
		return false
	stage = next_stages[stage]
	return true

func set_quality(q: float) -> void:
	quality = clampf(q, 0.0, 2.0)

func modify_quality(delta: float) -> void:
	quality = clampf(quality + delta, 0.0, 2.0)

func is_finished() -> bool:
	return stage == ProductStage.PACKED

func is_failed() -> bool:
	return quality <= 0.0 or stage == ProductStage.FAILED

func mark_failed() -> void:
	stage = ProductStage.FAILED
	quality = 0.0

func record_processing(machine_type: String, quality_after: float) -> void:
	processing_history.append({
		"machine_type": machine_type,
		"quality_after": quality_after,
		"timestamp": Time.get_ticks_msec() / 1000.0
	})

func get_total_quality() -> float:
	return quality

func get_stage_name() -> String:
	var names: Dictionary = {
		ProductStage.RAW: "Raw",
		ProductStage.CUT: "Cut",
		ProductStage.ASSEMBLED: "Assembled",
		ProductStage.PAINTED: "Painted",
		ProductStage.PACKED: "Packed",
		ProductStage.FAILED: "Failed",
	}
	return names.get(stage, "Unknown")

func reset() -> void:
	stage = ProductStage.RAW
	quality = 1.0
	is_moving = false
	current_belt = null
	processing_history.clear()
	current_cell = Vector2i.ZERO
	path.clear()
	path_index = 0

func get_color() -> Color:
	var colors: Dictionary = {
		ProductStage.RAW: Color.GRAY,
		ProductStage.CUT: Color(1.0, 0.6, 0.6),
		ProductStage.ASSEMBLED: Color(0.4, 0.6, 1.0),
		ProductStage.PAINTED: Color(0.4, 0.9, 0.4),
		ProductStage.PACKED: Color.GOLD,
		ProductStage.FAILED: Color(0.5, 0.0, 0.0),
	}
	return colors.get(stage, Color.WHITE)

func _draw() -> void:
	var col := get_color()
	draw_rect(Rect2(-8, -8, 16, 16), col)
	if is_finished():
		draw_rect(Rect2(-10, -10, 20, 20), col, false, 2.0)
