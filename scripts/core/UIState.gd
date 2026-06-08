extends Node

enum UIContext { MAIN_MENU, LEVEL_SELECT, GAME, SETTINGS, DIALOG, TUTORIAL }

var current_context: UIContext = UIContext.MAIN_MENU
var active_dialogs: Array = []
var is_tutorial_active: bool = false
var tutorial_skipped: bool = false
var current_hints_visible: bool = true

var _selected_ui_node: Node = null
var _ui_focus_stack: Array = []

signal context_changed(new_context)
signal dialog_opened(dialog)
signal dialog_closed(dialog)
signal tutorial_state_changed(active)

func _ready() -> void:
    EventBus.on_event("game_state_changed", _on_game_state_changed)
    EventBus.on_event("input_mode_changed", _on_input_mode_changed)
    print("[UIState] 初始化完成")

func _on_game_state_changed(new_state) -> void:
    match new_state:
        GameManager.GameState.MAIN_MENU:
            set_context(UIContext.MAIN_MENU)
        GameManager.GameState.LEVEL_SELECT:
            set_context(UIContext.LEVEL_SELECT)
        GameManager.GameState.PLAYING, GameManager.GameState.SETTLEMENT, GameManager.GameState.PAUSED:
            set_context(UIContext.GAME)
        GameManager.GameState.SETTINGS:
            set_context(UIContext.SETTINGS)

func _on_input_mode_changed(_mode) -> void:
    emit_signal("tutorial_state_changed", is_tutorial_active)

func set_context(new_context: UIContext) -> void:
    if current_context != new_context:
        current_context = new_context
        emit_signal("context_changed", current_context)
        print("[UIState] 上下文切换为: ", current_context)

func get_context() -> UIContext:
    return current_context

func open_dialog(dialog: Node) -> void:
    active_dialogs.append(dialog)
    _ui_focus_stack.append(current_context)
    set_context(UIContext.DIALOG)
    emit_signal("dialog_opened", dialog)
    AudioManager.play_sfx("click")

func close_dialog() -> void:
    if active_dialogs.size() > 0:
        var dialog = active_dialogs.pop_back()
        emit_signal("dialog_closed", dialog)
        if _ui_focus_stack.size() > 0:
            var prev_context = _ui_focus_stack.pop_back()
            set_context(prev_context)
    AudioManager.play_sfx("click")

func has_open_dialog() -> bool:
    return active_dialogs.size() > 0

func get_top_dialog() -> Node:
    if active_dialogs.size() > 0:
        return active_dialogs[active_dialogs.size() - 1]
    return null

func start_tutorial() -> void:
    is_tutorial_active = true
    tutorial_skipped = false
    set_context(UIContext.TUTORIAL)
    emit_signal("tutorial_state_changed", true)

func end_tutorial() -> void:
    is_tutorial_active = false
    var prev = UIContext.GAME
    if _ui_focus_stack.size() > 0:
        prev = _ui_focus_stack.pop_back()
    set_context(prev)
    emit_signal("tutorial_state_changed", false)
    SaveManager.update_setting("show_hints", tutorial_skipped == false)

func skip_tutorial() -> void:
    tutorial_skipped = true
    end_tutorial()

func should_show_tutorial_first_time() -> bool:
    return SaveManager.settings.get("show_hints", true) and not tutorial_skipped

func set_selected_node(node: Node) -> void:
    _selected_ui_node = node
    if node != null and node is Control:
        node.grab_focus()

func get_selected_node() -> Node:
    return _selected_ui_node

func is_ingame_ui() -> bool:
    return current_context == UIContext.GAME or current_context == UIContext.DIALOG

func show_hints(visible: bool) -> void:
    current_hints_visible = visible
    SaveManager.update_setting("show_hints", visible)

func are_hints_visible() -> bool:
    return current_hints_visible
