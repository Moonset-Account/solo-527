extends StaticBody2D
class_name PackingItem
## 可打包物品 - 处理物理碰撞、压力检测、易碎品逻辑

signal pressure_warning()
signal pressure_critical()
signal item_broken()
signal item_placed_in_box()
signal item_removed_from_box()
signal item_dragged()
signal item_dropped()

var item_id: String = ""
var def: Dictionary = {}
var is_broken: bool = false
var is_in_box: bool = false
var is_being_dragged: bool = false
var current_pressure: float = 0.0
var weight: float = 1.0
var is_fragile: bool = false
var max_pressure: float = 10.0
var size: Vector2 = Vector2(80, 80)
var base_points: int = 10
var visual_node: Node2D = null
var collision_shape: CollisionShape2D = null
var pressure_timer: float = 0.0
var original_position: Vector2 = Vector2.ZERO
var original_rotation: float = 0.0
var overlap_count: int = 0

const WARNING_RATIO := 0.7
const CRITICAL_RATIO := 0.9

func _init() -> void:
    collision_layer = 4
    collision_mask = 1 | 2 | 4

func setup(item_def: Dictionary, pos: Vector2 = Vector2.ZERO) -> void:
    def = item_def
    item_id = item_def.get("id", "")
    weight = float(item_def.get("weight", 1.0))
    is_fragile = bool(item_def.get("fragile", false))
    max_pressure = float(item_def.get("max_pressure", 10.0))
    size = item_def.get("size", Vector2(80, 80))
    base_points = int(item_def.get("points", 10))
    position = pos
    original_position = pos
    original_rotation = rotation
    _build_visual()
    _build_collision()
    _setup_signals()

func _build_visual() -> void:
    visual_node = Node2D.new()
    add_child(visual_node)

    var color: Color = def.get("color", Color.WHITE)
    var body: Polygon2D = Polygon2D.new()
    var w: float = size.x * 0.5
    var h: float = size.y * 0.5
    body.polygon = PackedVector2Array([
        Vector2(-w, -h), Vector2(w, -h),
        Vector2(w, h), Vector2(-w, h)
    ])
    body.color = color
    visual_node.add_child(body)

    var outline: Line2D = Line2D.new()
    outline.width = 3.0
    outline.default_color = color.darkened(0.3)
    outline.points = PackedVector2Array([
        Vector2(-w, -h), Vector2(w, -h),
        Vector2(w, h), Vector2(-w, h), Vector2(-w, -h)
    ])
    visual_node.add_child(outline)

    if is_fragile:
        var mark: Polygon2D = Polygon2D.new()
        var mw: float = min(size.x, size.y) * 0.25
        mark.polygon = PackedVector2Array([
            Vector2(-mw, -mw), Vector2(mw, 0),
            Vector2(-mw, mw), Vector2(0, 0)
        ])
        mark.color = Color(1, 0.2, 0.2, 0.8)
        mark.position = Vector2(size.x * 0.35, -size.y * 0.35)
        visual_node.add_child(mark)

        var warn_text: Label = Label.new()
        warn_text.text = "!"
        warn_text.add_theme_font_size_override("font_size", int(size.y * 0.3))
        warn_text.add_theme_color_override("font_color", Color.WHITE)
        warn_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        warn_text.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
        warn_text.position = Vector2(size.x * 0.35 - mw * 0.5, -size.y * 0.35 - mw * 0.8)
        warn_text.size = Vector2(mw, mw * 1.5)
        visual_node.add_child(warn_text)

    var weight_label: Label = Label.new()
    weight_label.text = "%.0fkg" % weight
    weight_label.add_theme_font_size_override("font_size", int(size.y * 0.12))
    weight_label.add_theme_color_override("font_color", Color(0, 0, 0, 0.7))
    weight_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    weight_label.position = Vector2(-size.x * 0.4, size.y * 0.3)
    weight_label.size = Vector2(size.x * 0.8, size.y * 0.2)
    visual_node.add_child(weight_label)

func _build_collision() -> void:
    collision_shape = CollisionShape2D.new()
    var shape: RectangleShape2D = RectangleShape2D.new()
    shape.size = size
    collision_shape.shape = shape
    add_child(collision_shape)

func _setup_signals() -> void:
    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node) -> void:
    if body is PackingItem:
        overlap_count += 1
        _check_overlap_pressure(body)

func _on_body_exited(body: Node) -> void:
    if body is PackingItem:
        overlap_count = max(0, overlap_count - 1)

func _check_overlap_pressure(other_item: PackingItem) -> void:
    if is_broken or other_item.is_broken:
        return
    if not is_in_box:
        return
    var dy: float = other_item.global_position.y - global_position.y
    var half_h: float = size.y * 0.5 + other_item.size.y * 0.5
    if dy < -size.y * 0.2 and abs(global_position.x - other_item.global_position.x) < (size.x + other_item.size.x) * 0.4:
        add_pressure(other_item.weight * 0.8)

func _physics_process(delta: float) -> void:
    if is_being_dragged or is_broken or not is_in_box:
        if pressure_timer > 0:
            pressure_timer = max(0, pressure_timer - delta)
        return
    pressure_timer += delta
    if pressure_timer >= 0.5:
        pressure_timer = 0
        _calculate_pressure_from_stack()

func _calculate_pressure_from_stack() -> void:
    var temp_pressure: float = 0.0
    var space_state: PhysicsDirectSpaceState2D = get_world_2d().direct_space_state
    var query: PhysicsPointQueryParameters2D = PhysicsPointQueryParameters2D.new()
    query.position = global_position + Vector2(0, -size.y * 0.51)
    query.collision_mask = 4
    query.collide_with_bodies = true
    var results: Array = space_state.intersect_point(query, 10)
    for res in results:
        var collider = res.get("collider", null)
        if collider is PackingItem and collider != self and not collider.is_broken:
            var dy: float = collider.global_position.y - global_position.y
            if dy < 0 and abs(global_position.x - collider.global_position.x) < (size.x + collider.size.x) * 0.45:
                temp_pressure += collider.weight
    current_pressure = lerp(current_pressure, temp_pressure, 0.3)
    _check_pressure_levels()

func _check_pressure_levels() -> void:
    if current_pressure >= max_pressure:
        break_item()
    elif current_pressure >= max_pressure * CRITICAL_RATIO:
        pressure_critical.emit()
    elif current_pressure >= max_pressure * WARNING_RATIO:
        pressure_warning.emit()

func add_pressure(amount: float) -> void:
    current_pressure += amount
    _check_pressure_levels()

func break_item() -> void:
    if is_broken:
        return
    is_broken = true
    item_broken.emit()
    AudioManager.play_sfx("break")
    UIManager.vibrate(0.8)
    var shake_tween: Tween = create_tween()
    shake_tween.set_loops(3)
    shake_tween.tween_property(visual_node, "position", Vector2(5, 0), 0.05)
    shake_tween.tween_property(visual_node, "position", Vector2(-5, 0), 0.05)
    await shake_tween.finished
    visual_node.modulate = Color(1, 1, 1, 0.3)
    if visual_node and is_instance_valid(visual_node):
        visual_node.modulate = Color(0.5, 0.3, 0.3, 0.4)
        for child in visual_node.get_children():
            if child is Polygon2D:
                child.color = child.color.darkened(0.5)

func set_dragging(dragging: bool) -> void:
    is_being_dragged = dragging
    collision_layer = 8 if dragging else 4
    if dragging:
        item_dragged.emit()
        AudioManager.play_sfx("pickup")
    else:
        item_dropped.emit()
        AudioManager.play_sfx("drop")

func set_in_box(in_box: bool) -> void:
    var was_in: bool = is_in_box
    is_in_box = in_box
    if in_box and not was_in:
        item_placed_in_box.emit()
        current_pressure = 0.0
    elif not in_box and was_in:
        item_removed_from_box.emit()
        current_pressure = 0.0

func get_effective_points() -> int:
    if is_broken:
        return -base_points
    if is_in_box:
        return base_points
    return 0

func rotate_by(angle: float) -> void:
    if is_being_dragged:
        rotation += angle
        AudioManager.play_sfx("rotate", 0.9 + randf() * 0.2)

func reset_state() -> void:
    is_broken = false
    is_in_box = false
    current_pressure = 0.0
    pressure_timer = 0.0
    position = original_position
    rotation = original_rotation
    if visual_node and is_instance_valid(visual_node):
        visual_node.modulate.a = 1.0

func _draw() -> void:
    if not is_in_box:
        return
    var pressure_ratio: float = clampf(current_pressure / max_pressure, 0.0, 1.0)
    if pressure_ratio >= WARNING_RATIO:
        var w: float = size.x * 0.5
        var h: float = size.y * 0.5
        var warn_color: Color = Color(1, 0.5, 0, 0.3 + pressure_ratio * 0.5) if pressure_ratio < CRITICAL_RATIO else Color(1, 0, 0, 0.4 + pressure_ratio * 0.4)
        draw_rect(Rect2(Vector2(-w, -h), size), false, warn_color)
        if pressure_ratio >= CRITICAL_RATIO:
            var rng: RandomNumberGenerator = RandomNumberGenerator.new()
            rng.seed = int(get_instance_id())
            for i in 3:
                var crack_color: Color = Color(1, 0, 0, 0.6)
                var start: Vector2 = Vector2(rng.randf_range(-w * 0.5, w * 0.5), rng.randf_range(-h * 0.5, h * 0.5))
                var end: Vector2 = start + Vector2(rng.randf_range(-20, 20), rng.randf_range(-20, 20))
                draw_line(start, end, crack_color, 2.0)
