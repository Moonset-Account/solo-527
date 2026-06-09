extends Node
## 输入管理器 - 统一处理键盘/触摸/鼠标输入

signal action_emit(action: String, value: Variant)
signal pointer_down(position: Vector2, index: int)
signal pointer_move(position: Vector2, index: int)
signal pointer_up(position: Vector2, index: int)

var pointer_map: Dictionary = {}
var last_pointer_positions: Dictionary = {}

func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        _handle_touch(event)
    elif event is InputEventScreenDrag:
        _handle_drag(event)
    elif event is InputEventMouseButton:
        _handle_mouse_button(event)
    elif event is InputEventMouseMotion:
        _handle_mouse_motion(event)
    elif event is InputEventKey and event.pressed and not event.echo:
        _handle_key(event)

func _handle_touch(event: InputEventScreenTouch) -> void:
    var idx: int = event.index
    if event.pressed:
        pointer_map[idx] = true
        last_pointer_positions[idx] = event.position
        pointer_down.emit(event.position, idx)
    else:
        pointer_map.erase(idx)
        last_pointer_positions.erase(idx)
        pointer_up.emit(event.position, idx)

func _handle_drag(event: InputEventScreenDrag) -> void:
    var idx: int = event.index
    last_pointer_positions[idx] = event.position
    pointer_move.emit(event.position, idx)

func _handle_mouse_button(event: InputEventMouseButton) -> void:
    if event.button_index == MOUSE_BUTTON_LEFT:
        var idx: int = 0
        if event.pressed:
            pointer_map[idx] = true
            last_pointer_positions[idx] = event.position
            pointer_down.emit(event.position, idx)
        else:
            pointer_map.erase(idx)
            last_pointer_positions.erase(idx)
            pointer_up.emit(event.position, idx)

func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
    var idx: int = 0
    if pointer_map.has(idx):
        last_pointer_positions[idx] = event.position
        pointer_move.emit(event.position, idx)

func _handle_key(event: InputEventKey) -> void:
    if event.is_action_pressed("rotate_cw"):
        action_emit.emit("rotate_cw", 1)
    elif event.is_action_pressed("rotate_ccw"):
        action_emit.emit("rotate_ccw", 1)
    elif event.is_action_pressed("undo"):
        action_emit.emit("undo", 1)
    elif event.is_action_pressed("pause"):
        action_emit.emit("pause", 1)
    elif event.is_action_pressed("submit"):
        action_emit.emit("submit", 1)

func get_pointer_position(index: int = 0) -> Vector2:
    if last_pointer_positions.has(index):
        return last_pointer_positions[index]
    return get_viewport().get_mouse_position()

func is_pointer_active(index: int = 0) -> bool:
    return pointer_map.has(index)
