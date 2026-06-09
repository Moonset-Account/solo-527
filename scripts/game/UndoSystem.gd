extends Node
class_name UndoSystem
## 撤销系统 - 记录玩家操作历史并支持撤销

signal history_changed(current_index: int, total: int)
signal action_undone(action_type: String)
signal action_undone_stack_empty()

const MAX_HISTORY := 50

var history: Array = []
var current_index: int = -1
var disabled: bool = false

const ACTION_PLACE := "place"
const ACTION_REMOVE := "remove"
const ACTION_ROTATE := "rotate"
const ACTION_MOVE := "move"

func record_action(action_data: Dictionary) -> void:
    if disabled:
        return
    if current_index < history.size() - 1:
        history.resize(current_index + 1)
    history.append(action_data.duplicate(true))
    if history.size() > MAX_HISTORY:
        history.remove_at(0)
        current_index -= 1
    current_index = history.size() - 1
    history_changed.emit(current_index, history.size())

func can_undo() -> bool:
    return current_index >= 0 and not disabled

func can_redo() -> bool:
    return current_index < history.size() - 1 and not disabled

func undo() -> Dictionary:
    if not can_undo():
        action_undone_stack_empty.emit()
        return {}
    var action: Dictionary = history[current_index]
    current_index -= 1
    history_changed.emit(current_index, history.size())
    action_undone.emit(action.get("type", "unknown"))
    AudioManager.play_sfx("undo")
    return action

func redo() -> Dictionary:
    if not can_redo():
        return {}
    current_index += 1
    var action: Dictionary = history[current_index]
    history_changed.emit(current_index, history.size())
    return action

func create_place_action(item: PackingItem, from_pos: Vector2, from_rot: float) -> Dictionary:
    return {
        "type": ACTION_PLACE,
        "item_id": item.instance_id,
        "to_pos": item.global_position,
        "to_rot": item.rotation,
        "from_pos": from_pos,
        "from_rot": from_rot,
        "in_box": true
    }

func create_rotate_action(item: PackingItem, before_rot: float) -> Dictionary:
    return {
        "type": ACTION_ROTATE,
        "item_id": item.instance_id,
        "before_rot": before_rot,
        "after_rot": item.rotation,
        "position": item.global_position
    }

func create_move_action(item: PackingItem, from_pos: Vector2, to_box: bool) -> Dictionary:
    return {
        "type": ACTION_MOVE,
        "item_id": item.instance_id,
        "from_pos": from_pos,
        "to_pos": item.global_position,
        "was_in_box": not to_box,
        "now_in_box": to_box
    }

func clear() -> void:
    history.clear()
    current_index = -1
    history_changed.emit(current_index, history.size())

func get_history_count() -> int:
    return history.size()

func get_undo_count() -> int:
    return current_index + 1
