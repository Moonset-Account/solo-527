extends Node
class_name DragController
## 拖拽控制器 - 处理物品的拖拽、旋转和放置

signal item_drag_started(item: PackingItem)
signal item_drag_ended(item: PackingItem, placed: bool)
signal item_rotated(item: PackingItem, angle: float)

var active_item: PackingItem = null
var is_dragging: bool = false
var drag_offset: Vector2 = Vector2.ZERO
var pointer_index: int = 0
var box_ref: PackingBox = null
var item_layer: Node2D = null
var rotation_angle_step: float = deg_to_rad(15.0)
var snap_threshold: float = 20.0
var snap_enabled: bool = true

var _long_press_timer: Timer = null
var _long_press_threshold: float = 0.4
var _tap_detected: bool = false
var _tap_position: Vector2 = Vector2.ZERO
var _dragged_moved: bool = false
var _is_setup: bool = false

func setup(box: PackingBox, layer: Node2D) -> void:
    box_ref = box
    item_layer = layer
    if not _is_setup:
        _is_setup = true
        _long_press_timer = Timer.new()
        _long_press_timer.one_shot = true
        _long_press_timer.wait_time = _long_press_threshold
        _long_press_timer.timeout.connect(_on_long_press)
        add_child(_long_press_timer)
        InputManager.pointer_down.connect(_on_pointer_down)
        InputManager.pointer_move.connect(_on_pointer_move)
        InputManager.pointer_up.connect(_on_pointer_up)
        InputManager.action_emit.connect(_on_action)

func _on_pointer_down(pos: Vector2, idx: int) -> void:
    if is_dragging or active_item:
        return
    if item_layer == null:
        return
    var world_pos: Vector2 = _get_world_position(pos)
    var state: PhysicsDirectSpaceState2D = item_layer.get_world_2d().direct_space_state
    var query: PhysicsPointQueryParameters2D = PhysicsPointQueryParameters2D.new()
    query.position = world_pos
    query.collision_mask = 4 | 8
    query.collide_with_bodies = true
    var results: Array = state.intersect_point(query, 5)
    if results.size() > 0:
        var hit = results[0]
        var collider = hit["collider"]
        if collider is PackingItem and not collider.is_broken:
            _start_drag(collider, world_pos, idx)
            _tap_detected = true
            _dragged_moved = false
            _tap_position = world_pos
            _long_press_timer.start()

func _on_pointer_move(pos: Vector2, idx: int) -> void:
    if idx != pointer_index:
        return
    if is_dragging and active_item:
        var world_pos: Vector2 = _get_world_position(pos)
        var target: Vector2 = world_pos - drag_offset
        if snap_enabled:
            target = Vector2(round(target.x / 5.0) * 5.0, round(target.y / 5.0) * 5.0)
        active_item.global_position = target
        if _tap_position.distance_to(world_pos) > 10.0:
            _dragged_moved = true
            if not _long_press_timer.is_stopped():
                _long_press_timer.stop()

func _on_pointer_up(pos: Vector2, idx: int) -> void:
    if idx != pointer_index:
        return
    if not _long_press_timer.is_stopped():
        _long_press_timer.stop()
    if is_dragging and active_item:
        var placed: bool = _try_place_item()
        item_drag_ended.emit(active_item, placed)
        _end_drag()

func _on_action(action: String, value: Variant) -> void:
    if action == "rotate_cw" and active_item:
        active_item.rotate_by(rotation_angle_step)
        item_rotated.emit(active_item, rotation_angle_step)
    elif action == "rotate_ccw" and active_item:
        active_item.rotate_by(-rotation_angle_step)
        item_rotated.emit(active_item, -rotation_angle_step)

func _on_long_press() -> void:
    if active_item and is_dragging and _dragged_moved == false:
        active_item.rotate_by(deg_to_rad(90.0))
        item_rotated.emit(active_item, deg_to_rad(90.0))
        AudioManager.play_sfx("rotate")

func _start_drag(item: PackingItem, world_pos: Vector2, idx: int) -> void:
    active_item = item
    is_dragging = true
    pointer_index = idx
    drag_offset = world_pos - item.global_position
    item.set_dragging(true)
    item.z_index = 100
    if box_ref:
        box_ref.remove_item(item)
    var tween: Tween = create_tween()
    tween.tween_property(item, "scale", Vector2(1.05, 1.05), 0.1)
    item_drag_started.emit(item)

func _end_drag() -> void:
    if active_item:
        active_item.set_dragging(false)
        active_item.z_index = 0
        var tween: Tween = create_tween()
        tween.tween_property(active_item, "scale", Vector2.ONE, 0.1)
    is_dragging = false
    active_item = null

func _try_place_item() -> bool:
    if active_item == null or box_ref == null:
        return false
    var ratio: float = box_ref.get_item_overlap_ratio(active_item)
    if ratio >= 0.7:
        _snap_to_box()
        return box_ref.add_item(active_item)
    return false

func _snap_to_box() -> void:
    if active_item == null or box_ref == null:
        return
    var w: float = box_ref.box_size.x * 0.5
    var h: float = box_ref.box_size.y * 0.5
    var iw: float = active_item.size.x * 0.5 + 5.0
    var ih: float = active_item.size.y * 0.5 + 5.0
    var box_local: Vector2 = active_item.global_position - box_ref.global_position
    box_local.x = clamp(box_local.x, -w + iw, w - iw)
    box_local.y = clamp(box_local.y, -h + ih, h - ih)
    if snap_enabled:
        box_local = Vector2(round(box_local.x / 10.0) * 10.0, round(box_local.y / 10.0) * 10.0)
    var tween: Tween = create_tween()
    tween.tween_property(active_item, "global_position", box_ref.global_position + box_local, 0.08).set_ease(Tween.EASE_OUT)

func _get_world_position(pos: Vector2) -> Vector2:
    if item_layer and item_layer.get_viewport():
        return item_layer.get_global_transform_with_canvas().affine_inverse() * pos
    return pos

func rotate_active_item(clockwise: bool = true) -> void:
    if active_item:
        var angle: float = rotation_angle_step if clockwise else -rotation_angle_step
        active_item.rotate_by(angle)
        item_rotated.emit(active_item, angle)

func cancel_drag() -> void:
    if is_dragging and active_item:
        var tween: Tween = create_tween()
        tween.tween_property(active_item, "global_position", active_item.original_position, 0.2)
        tween.tween_property(active_item, "rotation", active_item.original_rotation, 0.2)
        tween.finished.connect(_end_drag)

func cleanup() -> void:
    if InputManager.pointer_down.is_connected(_on_pointer_down):
        InputManager.pointer_down.disconnect(_on_pointer_down)
    if InputManager.pointer_move.is_connected(_on_pointer_move):
        InputManager.pointer_move.disconnect(_on_pointer_move)
    if InputManager.pointer_up.is_connected(_on_pointer_up):
        InputManager.pointer_up.disconnect(_on_pointer_up)
    if InputManager.action_emit.is_connected(_on_action):
        InputManager.action_emit.disconnect(_on_action)
