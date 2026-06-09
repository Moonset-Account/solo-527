extends Node
class_name GameController
## 游戏主控制器 - 整合所有游戏系统并管理关卡流程

signal level_started_event(level_def: Dictionary)
signal level_finished_event(result: Dictionary)
signal score_changed(new_score: int, stars: int)

var level_def: Dictionary = {}
var all_items: Array[PackingItem] = []
var box: PackingBox = null
var item_layer: Node2D = null
var drag_controller: DragController = null
var undo_system: UndoSystem = null
var score_calculator: ScoreCalculator = null
var level_root: Node = null
var time_remaining: float = -1.0
var is_level_complete: bool = false
var undo_count_this_level: int = 0

func setup(root_node: Node, layer: Node2D) -> void:
    level_root = root_node
    item_layer = layer
    undo_system = UndoSystem.new()
    add_child(undo_system)
    score_calculator = ScoreCalculator.new()
    add_child(score_calculator)
    drag_controller = DragController.new()
    add_child(drag_controller)
    drag_controller.item_drag_started.connect(_on_drag_started)
    drag_controller.item_drag_ended.connect(_on_drag_ended)
    drag_controller.item_rotated.connect(_on_item_rotated)
    InputManager.action_emit.connect(_on_action)

func load_level(def: Dictionary) -> void:
    level_def = def
    is_level_complete = false
    undo_count_this_level = 0
    _clear_level()
    _create_box()
    _create_items()
    drag_controller.setup(box, item_layer)
    undo_system.clear()
    level_started_event.emit(level_def)
    AudioManager.play_music("game_music")
    if SaveSystem.settings_data.get("show_hints", true) and level_def.has("tutorial_hint"):
        UIManager.show_toast(level_def["tutorial_hint"], 4.0)

func _clear_level() -> void:
    for item in all_items:
        if is_instance_valid(item):
            item.queue_free()
    all_items.clear()
    if box and is_instance_valid(box):
        box.queue_free()
    box = null

func _create_box() -> void:
    box = PackingBox.new()
    var box_size: Vector2 = level_def.get("box_size", Vector2(600, 700))
    var max_weight: float = level_def.get("max_weight", 80.0)
    var box_y_offset: float = 100.0
    box.setup(box_size, max_weight, Vector2(540, 1920 * 0.55 + box_y_offset))
    box.weight_warning.connect(_on_weight_warning)
    box.weight_exceeded.connect(_on_weight_exceeded)
    box.item_entered.connect(_on_item_entered_box)
    box.item_exited.connect(_on_item_exited_box)
    if item_layer:
        item_layer.add_child(box)

func _create_items() -> void:
    var item_ids: Array = level_def.get("items", [])
    var start_x: float = 120.0
    var start_y: float = 260.0
    var spacing_x: float = 190.0
    var spacing_y: float = 180.0
    var per_row: int = 5
    var created_count: int = 0
    for i in item_ids.size():
        var id: String = item_ids[i]
        var def: Dictionary = ResourceLoader_.get_item_def(id)
        if def.is_empty():
            continue
        def["id"] = id
        var item: PackingItem = PackingItem.new()
        var col: int = created_count % per_row
        var row: int = int(created_count / per_row)
        var pos: Vector2 = Vector2(start_x + col * spacing_x, start_y + row * spacing_y)
        item.setup(def, pos)
        var actual_idx: int = all_items.size()
        item.set_meta("undo_idx", actual_idx)
        if item.has_signal("item_broken"):
            item.item_broken.connect(_on_item_broken.bind(item))
        if item_layer:
            item_layer.add_child(item)
        all_items.append(item)
        created_count += 1

func _on_action(action: String, value: Variant) -> void:
    if action == "undo":
        try_undo()
    elif action == "pause":
        GameState.pause_game()
    elif action == "submit":
        try_submit()
    elif action == "rotate_cw" and drag_controller:
        drag_controller.rotate_active_item(true)
    elif action == "rotate_ccw" and drag_controller:
        drag_controller.rotate_active_item(false)

func try_undo() -> bool:
    if undo_system == null or not undo_system.can_undo():
        return false
    var action: Dictionary = undo_system.undo()
    if action.is_empty() or not action.has("type"):
        return false
    undo_count_this_level += 1
    var type: String = str(action.get("type", ""))
    match type:
        "place":
            _undo_place(action)
        "rotate":
            _undo_rotate(action)
        "move":
            _undo_move(action)
        _:
            print("Undo: unknown action type: %s" % type)
    _recalculate_live_score()
    return true

func _undo_place(action: Dictionary) -> void:
    var item: PackingItem = _get_item_by_action(action)
    if item == null:
        return
    if box:
        box.remove_item(item)
    var from_pos: Vector2 = action.get("from_pos", item.original_position)
    var from_rot: float = float(action.get("from_rot", 0.0))
    var tween: Tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(item, "global_position", from_pos, 0.2)
    tween.tween_property(item, "rotation", from_rot, 0.2)
    tween.finished.connect(func ():
        if is_instance_valid(item):
            item.original_position = from_pos
            item.original_rotation = from_rot
    )
    item.reset_state()

func _undo_rotate(action: Dictionary) -> void:
    var item: PackingItem = _get_item_by_action(action)
    if item == null:
        return
    var before_rot: float = float(action.get("before_rot", item.rotation))
    var tween: Tween = create_tween()
    tween.tween_property(item, "rotation", before_rot, 0.15)
    tween.finished.connect(func ():
        if is_instance_valid(item):
            item.original_rotation = before_rot
    )

func _undo_move(action: Dictionary) -> void:
    var item: PackingItem = _get_item_by_action(action)
    if item == null:
        return
    var was_in_box: bool = bool(action.get("was_in_box", false))
    if not was_in_box and box:
        box.remove_item(item)
    var from_pos: Vector2 = action.get("from_pos", item.original_position)
    var tween: Tween = create_tween()
    tween.tween_property(item, "global_position", from_pos, 0.2)

func _get_item_by_action(action: Dictionary) -> PackingItem:
    var idx: int = int(action.get("item_idx", -1))
    if idx < 0 or idx >= all_items.size():
        return null
    var item = all_items[idx]
    if is_instance_valid(item) and item is PackingItem:
        return item
    return null

func _get_item_instance_idx(item: PackingItem) -> int:
    return all_items.find(item)

func try_submit() -> void:
    if is_level_complete:
        return
    if box == null:
        return
    if box.items_in_box.size() == 0:
        UIManager.show_toast("请至少放入一个物品！")
        return
    var result: Dictionary = _calculate_final_result()
    is_level_complete = true
    var stars: int = int(result["stars"])
    var score: int = int(result["total_score"])
    if stars > 0:
        AudioManager.play_sfx("success")
        GameState.complete_level(score, stars)
        var ach_data: Dictionary = {
            "items_placed": result["items_in_box"],
            "all_fragile_safe": result["fragile_safe"],
            "weight_ratio": result["weight_ratio"],
            "undo_count": undo_count_this_level,
            "completed": stars > 0
        }
        AchievementSystem.report_game_result(ach_data)
        if GameState.is_daily_mode:
            LeaderboardSystem.submit_daily_score(score)
    else:
        AudioManager.play_sfx("fail")
        GameState.fail_level("")
    level_finished_event.emit(result)

func _calculate_final_result() -> Dictionary:
    var result: Dictionary = score_calculator.calculate_score(level_def, box, all_items)
    result["undo_count"] = undo_count_this_level
    return result

func _recalculate_live_score() -> void:
    if score_calculator == null or box == null:
        return
    var result: Dictionary = score_calculator.calculate_score(level_def, box, all_items)
    score_changed.emit(int(result["total_score"]), int(result["stars"]))

func _on_drag_started(item: PackingItem) -> void:
    pass

func _on_drag_ended(item: PackingItem, placed: bool) -> void:
    if undo_system and is_instance_valid(item):
        var item_idx: int = _get_item_instance_idx(item)
        if item_idx >= 0:
            var from_pos: Vector2 = item.get_meta("drag_from_pos", item.original_position)
            var from_rot: float = float(item.get_meta("drag_from_rot", item.original_rotation))
            var act: Dictionary = undo_system.create_place_action(item, item_idx, from_pos, from_rot)
            undo_system.record_action(act)
    if is_instance_valid(item) and not placed:
        item.original_position = item.global_position
        item.original_rotation = item.rotation
    _recalculate_live_score()

func _on_item_rotated(item: PackingItem, angle: float) -> void:
    if undo_system and is_instance_valid(item):
        var item_idx: int = _get_item_instance_idx(item)
        if item_idx >= 0:
            var before_rot: float = item.rotation - angle
            var act: Dictionary = undo_system.create_rotate_action(item, item_idx, before_rot)
            undo_system.record_action(act)
    if is_instance_valid(item):
        item.original_rotation = item.rotation

func _on_weight_warning(current: float, limit: float) -> void:
    UIManager.vibrate(0.3)

func _on_weight_exceeded(current: float, limit: float) -> void:
    UIManager.vibrate(0.6)

func _on_item_entered_box(item: PackingItem) -> void:
    SaveSystem.add_stats(1, false)
    _recalculate_live_score()

func _on_item_exited_box(item: PackingItem) -> void:
    _recalculate_live_score()

func _on_item_broken(item: PackingItem) -> void:
    UIManager.show_toast("💥 %s 碎裂了！" % item.def.get("name", "物品"))
    _recalculate_live_score()

func get_current_stats() -> Dictionary:
    var total_count: int = all_items.size()
    return {
        "items_in_box": box.items_in_box.size() if box else 0,
        "total_items": total_count,
        "current_weight": box.current_weight if box else 0.0,
        "max_weight": box.max_weight if box else 1.0,
        "weight_ratio": box.get_weight_ratio() if box else 0.0,
        "broken_count": box.get_broken_items_count() if box else 0,
        "undo_count": undo_count_this_level,
        "time_remaining": time_remaining
    }

func can_undo() -> bool:
    return undo_system and undo_system.can_undo()

func cleanup() -> void:
    if drag_controller:
        drag_controller.cleanup()
    InputManager.action_emit.disconnect(_on_action)
    _clear_level()
