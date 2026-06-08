extends Node2D
## 浮动文字系统 - 在屏幕任意位置显示飘字数字/文本效果
## 独立视觉反馈模块

class FloatingText:
	extends RefCounted
	var label: Label
	var tween: Tween
	var lifetime: float = 0.0

var _layer: CanvasLayer = null
var _texts: Array = []

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_layer = CanvasLayer.new()
	_layer.name = "FloatingTextLayer"
	_layer.layer = 500
	add_child(_layer)
	EventBus.ui_floating_text.connect(_on_floating_text)

func spawn_world_text(world_pos: Vector2, text: String, color: Color = Color.GREEN, font_size: int = 20, duration: float = 1.0) -> void:
	var lbl: Label = Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", font_size)
	lbl.add_theme_color_override("font_color", color)
	lbl.modulate = color
	lbl.modulate.a = 1.0
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.position = world_pos
	lbl.z_index = 500
	_layer.add_child(lbl)
	_animate_text(lbl, Vector2(0, -60), duration)

func spawn_screen_text(screen_pos: Vector2, text: String, color: Color = Color.GREEN, font_size: int = 20, duration: float = 1.0) -> void:
	spawn_world_text(screen_pos, text, color, font_size, duration)

func _on_floating_text(position: Vector2, text: String, color: Color) -> void:
	var pos: Vector2 = position
	if pos == Vector2.ZERO:
		pos = Vector2(640, 300)
	spawn_screen_text(pos, text, color, 22, 1.1)

func _animate_text(lbl: Label, move_offset: Vector2, duration: float) -> void:
	var t: Tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	var start_pos: Vector2 = lbl.position
	t.parallel().tween_property(lbl, "position", start_pos + move_offset, duration)
	t.parallel().tween_property(lbl, "modulate:a", 0.0, duration * 0.9)
	t.tween_callback(func():
		if is_instance_valid(lbl):
			lbl.queue_free()
	)

func spawn_big_number(center_pos: Vector2, value: int, is_positive: bool = true) -> void:
	var color: Color = Color(0.3, 0.95, 0.4) if is_positive else Color(0.95, 0.3, 0.3)
	var text: String = ("+" if is_positive else "") + str(value)
	spawn_screen_text(center_pos, text, color, 32, 1.2)
