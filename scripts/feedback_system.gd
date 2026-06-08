extends Node2D

var _feedback_layer: CanvasLayer
var _particle_pool: Array[CPUParticles2D] = []
var _pool_size: int = 20
var _pool_index: int = 0
var _floating_texts: Array[Node2D] = []

func _ready() -> void:
	_feedback_layer = CanvasLayer.new()
	_feedback_layer.layer = 50
	add_child(_feedback_layer)
	_init_particle_pool()

func _init_particle_pool() -> void:
	for i in _pool_size:
		var p = CPUParticles2D.new()
		p.emitting = false
		p.one_shot = true
		p.explosiveness = 0.9
		p.amount = 8
		p.lifetime = 0.4
		p.direction = Vector2(0, -1)
		p.spread = 45
		p.gravity = Vector2(0, 150)
		p.initial_velocity_min = 30
		p.initial_velocity_max = 80
		p.scale_amount_min = 1.5
		p.scale_amount_max = 3.0
		add_child(p)
		_particle_pool.append(p)

func spawn_place_feedback(pos: Vector2, color: Color = Color.GREEN) -> void:
	var p = _get_next_particle()
	if p:
		p.global_position = pos
		p.color = color
		p.emitting = true
	spawn_floating_text(pos, "+100", color)

func spawn_break_feedback(pos: Vector2) -> void:
	var p = _get_next_particle()
	if p:
		p.global_position = pos
		p.color = Color.RED
		p.amount = 15
		p.initial_velocity_min = 50
		p.initial_velocity_max = 120
		p.emitting = true
		await get_tree().create_timer(0.5).timeout
		p.amount = 8
		p.initial_velocity_min = 30
		p.initial_velocity_max = 80
	spawn_floating_text(pos, "BROKEN!", Color.RED)

func spawn_rotate_feedback(pos: Vector2) -> void:
	var p = _get_next_particle()
	if p:
		p.global_position = pos
		p.color = Color.CYAN
		p.amount = 4
		p.lifetime = 0.2
		p.emitting = true
		await get_tree().create_timer(0.3).timeout
		p.amount = 8
		p.lifetime = 0.4

func spawn_weight_warning_feedback(pos: Vector2) -> void:
	var p = _get_next_particle()
	if p:
		p.global_position = pos
		p.color = Color.YELLOW
		p.emitting = true

func spawn_success_feedback(pos: Vector2) -> void:
	for i in 3:
		var p = _get_next_particle()
		if p:
			p.global_position = pos + Vector2(randf_range(-30, 30), randf_range(-30, 30))
			p.color = Color.GOLD
			p.amount = 12
			p.emitting = true
			await get_tree().create_timer(0.15).timeout

func spawn_floating_text(pos: Vector2, text: String, color: Color) -> void:
	var label = Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 18)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color.BLACK)
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	label.global_position = pos
	label.z_index = 100
	add_child(label)
	var tw = create_tween()
	tw.tween_property(label, "position:y", label.position.y - 60, 1.0)
	tw.parallel().tween_property(label, "modulate:a", 0.0, 1.0)
	tw.tween_callback(label.queue_free)

func _get_next_particle() -> CPUParticles2D:
	var p = _particle_pool[_pool_index]
	_pool_index = (_pool_index + 1) % _pool_size
	return p
