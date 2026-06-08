extends Node

enum InputMode { KEYBOARD_MOUSE, GAMEPAD, TOUCH }

var current_mode: InputMode = InputMode.KEYBOARD_MOUSE

const ACTION_HINTS: Dictionary = {
    "ui_accept": {
        InputMode.KEYBOARD_MOUSE: "空格/回车",
        InputMode.GAMEPAD: "A键",
        InputMode.TOUCH: "点击"
    },
    "ui_cancel": {
        InputMode.KEYBOARD_MOUSE: "ESC/右键",
        InputMode.GAMEPAD: "B键",
        InputMode.TOUCH: "返回"
    },
    "game_purchase": {
        InputMode.KEYBOARD_MOUSE: "E键",
        InputMode.GAMEPAD: "X键",
        InputMode.TOUCH: "长按"
    },
    "game_sell": {
        InputMode.KEYBOARD_MOUSE: "Q键",
        InputMode.GAMEPAD: "Y键",
        InputMode.TOUCH: "滑动"
    },
    "game_inventory": {
        InputMode.KEYBOARD_MOUSE: "I键",
        InputMode.GAMEPAD: "选择键",
        InputMode.TOUCH: "背包图标"
    },
    "game_next_phase": {
        InputMode.KEYBOARD_MOUSE: "N键",
        InputMode.GAMEPAD: "开始键",
        InputMode.TOUCH: "下一阶段按钮"
    },
    "game_pause": {
        InputMode.KEYBOARD_MOUSE: "ESC",
        InputMode.GAMEPAD: "菜单键",
        InputMode.TOUCH: "暂停图标"
    },
    "ui_up": {
        InputMode.KEYBOARD_MOUSE: "W/↑",
        InputMode.GAMEPAD: "方向键上",
        InputMode.TOUCH: "上滑"
    },
    "ui_down": {
        InputMode.KEYBOARD_MOUSE: "S/↓",
        InputMode.GAMEPAD: "方向键下",
        InputMode.TOUCH: "下滑"
    },
    "ui_left": {
        InputMode.KEYBOARD_MOUSE: "A/←",
        InputMode.GAMEPAD: "方向键左",
        InputMode.TOUCH: "左滑"
    },
    "ui_right": {
        InputMode.KEYBOARD_MOUSE: "D/→",
        InputMode.GAMEPAD: "方向键右",
        InputMode.TOUCH: "右滑"
    }
}

func _ready() -> void:
    _detect_input_mode()

func _unhandled_input(event: InputEvent) -> void:
    var new_mode: InputMode = current_mode
    
    if event is InputEventKey or event is InputEventMouseButton or event is InputEventMouseMotion:
        new_mode = InputMode.KEYBOARD_MOUSE
    elif event is InputEventJoypadButton or event is InputEventJoypadMotion:
        new_mode = InputMode.GAMEPAD
    elif event is InputEventScreenTouch or event is InputEventScreenDrag:
        new_mode = InputMode.TOUCH
    
    if new_mode != current_mode:
        current_mode = new_mode
        EventBus.emit_event("input_mode_changed", current_mode)

func _detect_input_mode() -> void:
    var connected_gamepads = Input.get_connected_joypads()
    if connected_gamepads.size() > 0:
        current_mode = InputMode.GAMEPAD
    else:
        current_mode = InputMode.KEYBOARD_MOUSE

func get_action_hint(action_name: String) -> String:
    var hints = ACTION_HINTS.get(action_name, {})
    return hints.get(current_mode, "?")

func get_all_action_hints() -> Dictionary:
    var result: Dictionary = {}
    for action in ACTION_HINTS.keys():
        result[action] = get_action_hint(action)
    return result

func is_action_just_pressed(action: String) -> bool:
    return Input.is_action_just_pressed(action)

func is_action_pressed(action: String) -> bool:
    return Input.is_action_pressed(action)

func get_input_mode_name() -> String:
    match current_mode:
        InputMode.KEYBOARD_MOUSE:
            return "键鼠"
        InputMode.GAMEPAD:
            return "手柄"
        InputMode.TOUCH:
            return "触屏"
    return "未知"

func set_input_mode(mode: InputMode) -> void:
    if mode != current_mode:
        current_mode = mode
        EventBus.emit_event("input_mode_changed", current_mode)
