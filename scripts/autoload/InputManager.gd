extends Node
## 输入管理器 - 统一处理键盘/手柄/触屏，切换按键提示
## 通过设备检测动态切换UI上的按键图标

enum InputMethod { KEYBOARD, GAMEPAD, TOUCH }

signal method_changed(new_method: int)

var current_method: int = InputMethod.KEYBOARD
var _last_touch_time: float = 0.0

const KEYBOARD_HINTS: Dictionary = {
	"ui_accept": ["ENTER", "SPACE"],
	"ui_cancel": ["ESC"],
	"ui_up": ["W", "↑"],
	"ui_down": ["S", "↓"],
	"ui_left": ["A", "←"],
	"ui_right": ["D", "→"],
	"game_end_turn": ["E"],
	"game_view_deck": ["Q"],
	"game_view_discard": ["R"],
	"game_toggle_settings": ["F1"],
	"game_card_1": ["1"],
	"game_card_2": ["2"],
	"game_card_3": ["3"],
	"game_card_4": ["4"],
	"game_card_5": ["5"],
}

const GAMEPAD_HINTS: Dictionary = {
	"ui_accept": ["A"],
	"ui_cancel": ["B"],
	"ui_up": ["↑D-Pad"],
	"ui_down": ["↓D-Pad"],
	"ui_left": ["←D-Pad"],
	"ui_right": ["→D-Pad"],
	"game_end_turn": ["X"],
	"game_view_deck": ["LB"],
	"game_view_discard": ["RB"],
	"game_toggle_settings": ["START"],
	"game_card_1": ["Y+↑"],
	"game_card_2": ["Y+→"],
	"game_card_3": ["Y+↓"],
	"game_card_4": ["Y+←"],
	"game_card_5": ["Y+X"],
}

const TOUCH_HINTS: Dictionary = {
	"ui_accept": ["点击"],
	"ui_cancel": ["返回"],
	"ui_up": ["滑动↑"],
	"ui_down": ["滑动↓"],
	"ui_left": ["滑动←"],
	"ui_right": ["滑动→"],
	"game_end_turn": ["点击按钮"],
	"game_view_deck": ["点击牌库"],
	"game_view_discard": ["点击弃牌堆"],
	"game_toggle_settings": ["点击⚙"],
	"game_card_1": ["点卡牌"],
	"game_card_2": ["点卡牌"],
	"game_card_3": ["点卡牌"],
	"game_card_4": ["点卡牌"],
	"game_card_5": ["点卡牌"],
}

func _ready() -> void:
	pass

func _input(event: InputEvent) -> void:
	var new_method: int = current_method
	if event is InputEventScreenTouch or event is InputEventScreenDrag:
		_last_touch_time = Time.get_ticks_msec() / 1000.0
		new_method = InputMethod.TOUCH
	elif event is InputEventJoypadButton or event is InputEventJoypadMotion:
		if event.pressed or (event is InputEventJoypadMotion and abs(event.axis_value) > 0.2):
			new_method = InputMethod.GAMEPAD
	elif event is InputEventKey and event.pressed:
		new_method = InputMethod.KEYBOARD
	_set_method(new_method)

func _set_method(m: int) -> void:
	if m != current_method:
		current_method = m
		method_changed.emit(m)

func get_hint(action_name: String) -> String:
	var hints: Array = []
	match current_method:
		InputMethod.KEYBOARD:
			hints = KEYBOARD_HINTS.get(action_name, [""])
		InputMethod.GAMEPAD:
			hints = GAMEPAD_HINTS.get(action_name, [""])
		InputMethod.TOUCH:
			hints = TOUCH_HINTS.get(action_name, [""])
	return hints[0] if hints.size() > 0 else ""

func get_all_hints(action_name: String) -> Array:
	match current_method:
		InputMethod.KEYBOARD:
			return KEYBOARD_HINTS.get(action_name, [])
		InputMethod.GAMEPAD:
			return GAMEPAD_HINTS.get(action_name, [])
		InputMethod.TOUCH:
			return TOUCH_HINTS.get(action_name, [])
	return []

func is_touch_mode() -> bool:
	return current_method == InputMethod.TOUCH

func method_name() -> String:
	match current_method:
		InputMethod.KEYBOARD:
			return "键盘"
		InputMethod.GAMEPAD:
			return "手柄"
		InputMethod.TOUCH:
			return "触屏"
	return "未知"
