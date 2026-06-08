extends StaticBody2D
## 货架 - 含错误标签的扫描目标，玩家扫描后修复

@export var shelf_id: String = "shelf_01"
@export var correct_label: String = "SKU-001"
@export var wrong_label: String = "SKU-999"
@export var shelf_content: String = "电子元件"

var is_fixed_var: bool = false
var is_being_scanned: bool = false
var is_being_analyzed: bool = false
var is_being_fixed: bool = false
var scan_animation_tween: Tween = null

@onready var sprite: Sprite2D = $Sprite
@onready var label_display: Label = $LabelDisplay
@onready var status_indicator: ColorRect = $StatusIndicator
@onready var scan_ring: Node2D = $ScanRing
@onready var highlight: ColorRect = $Highlight

func _ready() -> void:
	_setup_appearance()
	_update_label_display()
	_connect_events()
	if scan_ring:
		scan_ring.visible = false
	if highlight:
		highlight.visible = false

func _setup_appearance() -> void:
	collision_layer = 4
	collision_mask = 0
	add_to_group("shelf")
	add_to_group("scan_target")

func _update_label_display() -> void:
	if label_display:
		if is_fixed_var:
			label_display.text = "[✓] %s" % correct_label
			label_display.modulate = Color(0.4, 1.0, 0.5)
		elif is_being_analyzed:
			label_display.text = "[分析中...] %s" % wrong_label
			label_display.modulate = Color(1.0, 0.9, 0.3)
		elif is_being_fixed:
			label_display.text = "[修复中...] %s → %s" % [wrong_label, correct_label]
			label_display.modulate = Color(0.5, 0.8, 1.0)
		else:
			label_display.text = "[!] %s" % wrong_label
			label_display.modulate = Color(1.0, 0.6, 0.4)
	if status_indicator:
		if is_fixed_var:
			status_indicator.color = Color(0.3, 1.0, 0.4, 0.9)
		elif is_being_scanned or is_being_analyzed or is_being_fixed:
			status_indicator.color = Color(1.0, 0.85, 0.2, 0.9)
		else:
			status_indicator.color = Color(1.0, 0.4, 0.4, 0.9)

func _connect_events() -> void:
	EventBus.segment_reset.connect(_on_segment_reset)

func is_fixed() -> bool:
	return is_fixed_var

func on_scan_started() -> void:
	is_being_scanned = true
	is_being_analyzed = false
	is_being_fixed = false
	_update_label_display()
	_play_scan_animation()
	if highlight:
		highlight.visible = true
		var tween := create_tween()
		tween.tween_property(highlight, "modulate:a", 0.3, 0.2)

func on_scan_analyzing() -> void:
	is_being_scanned = false
	is_being_analyzed = true
	_update_label_display()

func on_fix_started() -> void:
	is_being_analyzed = false
	is_being_fixed = true
	_update_label_display()

func on_scan_canceled() -> void:
	is_being_scanned = false
	is_being_analyzed = false
	is_being_fixed = false
	_update_label_display()
	_stop_scan_animation()
	if highlight:
		var tween := create_tween()
		tween.tween_property(highlight, "modulate:a", 0.0, 0.2)
		tween.tween_callback(highlight.set_visible.bind(false))

func fix_tag() -> void:
	is_fixed_var = true
	is_being_fixed = false
	_update_label_display()
	_stop_scan_animation()
	_play_fix_effect()
	remove_from_group("scan_target")
	EventBus.emit_shelf_scanned(self)
	if highlight:
		var tween := create_tween()
		tween.tween_property(highlight, "modulate:a", 0.0, 0.5)
		tween.tween_callback(highlight.set_visible.bind(false))

func _play_scan_animation() -> void:
	if scan_ring:
		scan_ring.visible = true
		if scan_ring is Polygon2D:
			scan_ring.modulate = Color(0.2, 1.0, 0.5, 0.6)
			scan_animation_tween = create_tween()
			scan_animation_tween.set_loops()
			scan_animation_tween.tween_property(scan_ring, "rotation", TAU, 1.0)
		elif scan_ring is Node2D:
			scan_animation_tween = create_tween()
			scan_animation_tween.set_loops()
			scan_animation_tween.tween_property(scan_ring, "scale", Vector2(1.2, 1.2), 0.5)
			scan_animation_tween.tween_property(scan_ring, "scale", Vector2(0.9, 0.9), 0.5)

func _stop_scan_animation() -> void:
	if scan_animation_tween:
		scan_animation_tween.kill()
		scan_animation_tween = null
	if scan_ring:
		scan_ring.visible = false

func _play_fix_effect() -> void:
	var tween := create_tween()
	if sprite:
		tween.tween_property(sprite, "modulate", Color(0.6, 1.0, 0.7), 0.15)
		tween.tween_property(sprite, "modulate", Color.WHITE, 0.2)
	if label_display:
		tween.parallel().tween_property(label_display, "scale", Vector2(1.2, 1.2), 0.2)
		tween.tween_property(label_display, "scale", Vector2(1.0, 1.0), 0.2)

func _on_segment_reset() -> void:
	if is_fixed_var:
		return
	is_being_scanned = false
	is_being_analyzed = false
	is_being_fixed = false
	_update_label_display()
	_stop_scan_animation()
	if highlight:
		highlight.visible = false
		highlight.modulate.a = 0.0
