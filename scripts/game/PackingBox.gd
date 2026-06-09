extends StaticBody2D
class_name PackingBox
## 装箱容器 - 检测物品入箱、重量限制、空间占用

signal item_entered(item: PackingItem)
signal item_exited(item: PackingItem)
signal weight_warning(current: float, limit: float)
signal weight_exceeded(current: float, limit: float)
signal box_full(ratio: float)

var box_size: Vector2 = Vector2(600, 800)
var max_weight: float = 100.0
var current_weight: float = 0.0
var items_in_box: Array[PackingItem] = []
var collision_area: Area2D = null
var weight_ratio_warning: float = 0.8
var _draw_rect: ColorRect = null
var _visual_node: Node2D = null

func _init() -> void:
    collision_layer = 2
    collision_mask = 0

func setup(size: Vector2, max_w: float, center_pos: Vector2 = Vector2.ZERO) -> void:
    box_size = size
    max_weight = max_w
    position = center_pos
    _build_visual()
    _build_collision()

func _build_visual() -> void:
    _visual_node = Node2D.new()
    add_child(_visual_node)

    var w: float = box_size.x * 0.5
    var h: float = box_size.y * 0.5

    var inner: Polygon2D = Polygon2D.new()
    inner.polygon = PackedVector2Array([
        Vector2(-w, -h), Vector2(w, -h),
        Vector2(w, h), Vector2(-w, h)
    ])
    inner.color = Color(0.98, 0.96, 0.92, 1)
    _visual_node.add_child(inner)

    var grid: Node2D = Node2D.new()
    _visual_node.add_child(grid)
    var grid_color: Color = Color(0.9, 0.88, 0.82, 0.5)
    var grid_step: float = 50.0
    for x in range(-int(w) + int(grid_step), int(w), int(grid_step)):
        var line: Line2D = Line2D.new()
        line.width = 1.0
        line.default_color = grid_color
        line.points = PackedVector2Array([Vector2(x, -h), Vector2(x, h)])
        grid.add_child(line)
    for y in range(-int(h) + int(grid_step), int(h), int(grid_step)):
        var line: Line2D = Line2D.new()
        line.width = 1.0
        line.default_color = grid_color
        line.points = PackedVector2Array([Vector2(-w, y), Vector2(w, y)])
        grid.add_child(line)

    var border: Line2D = Line2D.new()
    border.width = 8.0
    border.default_color = Color(0.55, 0.4, 0.2)
    border.points = PackedVector2Array([
        Vector2(-w, -h), Vector2(w, -h),
        Vector2(w, h), Vector2(-w, h), Vector2(-w, -h)
    ])
    _visual_node.add_child(border)

    for i in 4:
        var corner: Polygon2D = Polygon2D.new()
        var cs: float = 30.0
        corner.color = Color(0.6, 0.45, 0.25)
        if i == 0:
            corner.polygon = PackedVector2Array([Vector2(-w, -h), Vector2(-w + cs, -h), Vector2(-w, -h + cs)])
        elif i == 1:
            corner.polygon = PackedVector2Array([Vector2(w, -h), Vector2(w - cs, -h), Vector2(w, -h + cs)])
        elif i == 2:
            corner.polygon = PackedVector2Array([Vector2(w, h), Vector2(w - cs, h), Vector2(w, h - cs)])
        else:
            corner.polygon = PackedVector2Array([Vector2(-w, h), Vector2(-w + cs, h), Vector2(-w, h - cs)])
        _visual_node.add_child(corner)

func _build_collision() -> void:
    collision_area = Area2D.new()
    collision_area.name = "BoxDetectArea"
    collision_area.collision_layer = 0
    collision_area.collision_mask = 4 | 8
    var area_shape: CollisionShape2D = CollisionShape2D.new()
    area_shape.name = "BoxAreaShape"
    var rect_shape: RectangleShape2D = RectangleShape2D.new()
    rect_shape.size = box_size
    area_shape.shape = rect_shape
    area_shape.position = Vector2.ZERO
    collision_area.add_child(area_shape)
    if is_inside_tree():
        collision_area.body_entered.connect(_on_area_body_entered)
        collision_area.body_exited.connect(_on_area_body_exited)
    else:
        call_deferred("_connect_collision_signals")
    add_child(collision_area)

    var w: float = box_size.x * 0.5
    var h: float = box_size.y * 0.5
    var wall_thickness: float = 20.0

    var walls: Array[CollisionShape2D] = []
    var left_wall: CollisionShape2D = CollisionShape2D.new()
    var ls: RectangleShape2D = RectangleShape2D.new()
    ls.size = Vector2(wall_thickness, box_size.y + wall_thickness * 2)
    left_wall.shape = ls
    left_wall.position = Vector2(-w - wall_thickness * 0.5, 0)
    walls.append(left_wall)

    var right_wall: CollisionShape2D = CollisionShape2D.new()
    var rs: RectangleShape2D = RectangleShape2D.new()
    rs.size = Vector2(wall_thickness, box_size.y + wall_thickness * 2)
    right_wall.shape = rs
    right_wall.position = Vector2(w + wall_thickness * 0.5, 0)
    walls.append(right_wall)

    var bottom_wall: CollisionShape2D = CollisionShape2D.new()
    var bs: RectangleShape2D = RectangleShape2D.new()
    bs.size = Vector2(box_size.x + wall_thickness * 2, wall_thickness)
    bottom_wall.shape = bs
    bottom_wall.position = Vector2(0, h + wall_thickness * 0.5)
    walls.append(bottom_wall)

    for wall in walls:
        add_child(wall)

func _connect_collision_signals() -> void:
    if collision_area and is_instance_valid(collision_area):
        collision_area.body_entered.connect(_on_area_body_entered)
        collision_area.body_exited.connect(_on_area_body_exited)

func _on_area_body_entered(body: Node) -> void:
    if body is PackingItem:
        add_item(body)

func _on_area_body_exited(body: Node) -> void:
    if body is PackingItem:
        remove_item(body)

func add_item(item: PackingItem) -> bool:
    if items_in_box.has(item) or item.is_broken:
        return false
    items_in_box.append(item)
    current_weight += item.weight
    item.set_in_box(true)
    item_entered.emit(item)
    AudioManager.play_sfx("place")
    _check_weight_status()
    _update_visual_weight()
    return true

func remove_item(item: PackingItem) -> bool:
    if not items_in_box.has(item):
        return false
    items_in_box.erase(item)
    current_weight -= item.weight
    item.set_in_box(false)
    item_exited.emit(item)
    _check_weight_status()
    _update_visual_weight()
    return true

func is_item_inside(item: PackingItem) -> bool:
    var item_rect: Rect2 = get_item_rect_in_box(item)
    var box_rect: Rect2 = Rect2(-box_size.x * 0.5, -box_size.y * 0.5, box_size.x, box_size.y)
    return box_rect.encloses(item_rect) or box_rect.intersects(item_rect)

func get_item_rect_in_box(item: PackingItem) -> Rect2:
    var local_pos: Vector2 = item.global_position - global_position
    var iw: float = item.size.x * 0.5
    var ih: float = item.size.y * 0.5
    return Rect2(local_pos.x - iw, local_pos.y - ih, iw * 2, ih * 2)

func get_item_overlap_ratio(item: PackingItem) -> float:
    var item_rect: Rect2 = get_item_rect_in_box(item)
    var box_rect: Rect2 = Rect2(-box_size.x * 0.5, -box_size.y * 0.5, box_size.x, box_size.y)
    var intersection: Rect2 = item_rect.intersection(box_rect)
    if intersection.size.x <= 0 or intersection.size.y <= 0:
        return 0.0
    var item_area: float = item_rect.size.x * item_rect.size.y
    var inter_area: float = intersection.size.x * intersection.size.y
    return inter_area / max(item_area, 1.0)

func _check_weight_status() -> void:
    var ratio: float = current_weight / max_weight
    if ratio > 1.0:
        weight_exceeded.emit(current_weight, max_weight)
        UIManager.show_toast("⚠️ 超重了！当前 %.1fkg / 限制 %.1fkg" % [current_weight, max_weight])
    elif ratio >= weight_ratio_warning:
        weight_warning.emit(current_weight, max_weight)

func _update_visual_weight() -> void:
    if _visual_node == null:
        return
    var ratio: float = clampf(current_weight / max_weight, 0.0, 1.5)
    if ratio > 1.0:
        _visual_node.modulate = Color(1.0, 0.7, 0.7)
    elif ratio >= weight_ratio_warning:
        _visual_node.modulate = Color(1.0, 0.9, 0.7)
    else:
        _visual_node.modulate = Color.WHITE

func get_weight_ratio() -> float:
    return clampf(current_weight / max_weight, 0.0, 2.0)

func get_space_usage() -> float:
    var used_area: float = 0.0
    var box_area: float = box_size.x * box_size.y
    for item in items_in_box:
        used_area += item.size.x * item.size.y
    return clampf(used_area / box_area, 0.0, 1.0)

func get_fragile_items_in_box() -> Array[PackingItem]:
    var result: Array[PackingItem] = []
    for item in items_in_box:
        if item.is_fragile:
            result.append(item)
    return result

func get_broken_items_count() -> int:
    var count: int = 0
    for item in items_in_box:
        if item.is_broken:
            count += 1
    return count

func has_valid_items() -> bool:
    return items_in_box.size() > 0 and get_broken_items_count() == 0 and current_weight <= max_weight
