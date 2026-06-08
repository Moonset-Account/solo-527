class_name Product
extends Node2D

enum ProductStage {RAW, CUT, ASSEMBLED, PAINTED, PACKED, FAILED}
enum ProductState {MOVING, PROCESSING, DELIVERED}

@export var product_type: String = "standard"

var stage: ProductStage = ProductStage.RAW
var quality: float = 1.0
var state: ProductState = ProductState.MOVING
var processing_time_remaining: float = 0.0

var current_cell: Vector2i = Vector2i.ZERO
var path: Array[Vector2i] = []
var path_index: int = 0
var move_speed: float = 1.0
var creation_time: float = 0.0
var processing_history: Array[Dictionary] = []

const STAGE_NAMES: Dictionary = {
	ProductStage.RAW: "Raw",
	ProductStage.CUT: "Cut",
	ProductStage.ASSEMBLED: "Assembled",
	ProductStage.PAINTED: "Painted",
	ProductStage.PACKED: "Packed",
	ProductStage.FAILED: "Failed",
}

const STAGE_TYPE_MAP: Dictionary = {
	ProductStage.RAW: "raw",
	ProductStage.CUT: "cut",
	ProductStage.ASSEMBLED: "assembled",
	ProductStage.PAINTED: "painted",
	ProductStage.PACKED: "packed",
	ProductStage.FAILED: "failed",
}

static func get_stage_from_type(type_name: String) -> ProductStage:
	match type_name:
		"raw": return ProductStage.RAW
		"cut": return ProductStage.CUT
		"assembled": return ProductStage.ASSEMBLED
		"painted": return ProductStage.PAINTED
		"packed": return ProductStage.PACKED
		_: return ProductStage.RAW

func _ready() -> void:
	creation_time = Time.get_ticks_msec() / 1000.0

func set_stage(new_stage: ProductStage) -> void:
	stage = new_stage
	queue_redraw()

func advance_to_stage(new_stage: ProductStage) -> void:
	if stage == ProductStage.FAILED:
		return
	if new_stage == ProductStage.FAILED:
		mark_failed()
		return
	stage = new_stage
	queue_redraw()

func set_quality(q: float) -> void:
	quality = clampf(q, 0.0, 2.0)

func modify_quality(delta: float) -> void:
	quality = clampf(quality + delta, 0.0, 2.0)

func is_finished() -> bool:
	return stage == ProductStage.PACKED

func is_failed() -> bool:
	return quality <= 0.0 or stage == ProductStage.FAILED

func is_deliverable() -> bool:
	return stage != ProductStage.FAILED and state != ProductState.DELIVERED

func mark_failed() -> void:
	stage = ProductStage.FAILED
	quality = 0.0
	queue_redraw()

func get_product_type_name() -> String:
	return STAGE_TYPE_MAP.get(stage, "raw")

func get_total_quality() -> float:
	return quality

func get_stage_name() -> String:
	return STAGE_NAMES.get(stage, "Unknown")

func record_processing(machine_type: String, quality_after: float) -> void:
	processing_history.append({
		"machine_type": machine_type,
		"quality_after": quality_after,
		"timestamp": Time.get_ticks_msec() / 1000.0
	})

func reset() -> void:
	stage = ProductStage.RAW
	quality = 1.0
	state = ProductState.MOVING
	processing_time_remaining = 0.0
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
	if stage == ProductStage.PACKED:
		draw_rect(Rect2(-10, -10, 20, 20), col, false, 2.0)
	if state == ProductState.PROCESSING:
		draw_rect(Rect2(-10, 6, 20, 3), Color(0.3, 0.3, 0.3))
		var max_time := maxf(processing_time_remaining, 0.01)
		var total_time := creation_time
		if processing_history.size() > 0:
			var last := processing_history[-1]
			total_time = maxf(float(last.get("timestamp", 0.0)) + max_time - Time.get_ticks_msec() / 1000.0, 0.01)
		draw_rect(Rect2(-10, 6, 20 * 0.5, 3), Color.GREEN)
