class_name InputHintsBar
extends Control

var input_hints_container: HBoxContainer
var hints_panel: PanelContainer

var _action_hints: Array = []
var _visible: bool = true

func _ready() -> void:
    anchor_left = 0.0
    anchor_top = 1.0
    anchor_right = 1.0
    anchor_bottom = 1.0
    offset_top = -60
    offset_left = 20
    offset_right = -20
    offset_bottom = -10
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    z_index = 50
    
    if hints_panel == null:
        _build_ui()
    
    EventBus.on_event("input_mode_changed", _on_input_mode_changed)
    EventBus.on_event("phase_changed", _on_phase_changed)
    UIState.context_changed.connect(_on_context_changed)
    
    _update_hints()

func _build_ui() -> void:
    hints_panel = PanelContainer.new()
    hints_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    hints_panel.size_flags_vertical = Control.SIZE_SHRINK_END
    add_child(hints_panel)
    
    var style = StyleBoxFlat.new()
    style.bg_color = Color(0, 0, 0, 0.6)
    style.corner_radius_top_left = 10
    style.corner_radius_top_right = 10
    style.corner_radius_bottom_left = 10
    style.corner_radius_bottom_right = 10
    style.content_margin_left = 12
    style.content_margin_right = 12
    style.content_margin_top = 6
    style.content_margin_bottom = 6
    hints_panel.add_theme_stylebox_override("panel", style)
    
    input_hints_container = HBoxContainer.new()
    input_hints_container.add_theme_constant_override("separation", 20)
    input_hints_container.alignment = BoxContainer.ALIGNMENT_CENTER
    hints_panel.add_child(input_hints_container)

func set_action_hints(actions: Array) -> void:
    _action_hints = actions
    _update_hints()

func _update_hints() -> void:
    if input_hints_container == null:
        return
    
    for child in input_hints_container.get_children():
        child.queue_free()
    
    var context_actions = _get_context_actions()
    var display_actions = []
    if _action_hints.size() > 0:
        display_actions = _action_hints
    else:
        display_actions = context_actions
    
    for action in display_actions:
        var action_name = action if action is String else action.get("action", "")
        var label = action if action is String else action.get("label", action_name)
        _add_hint(action_name, label)

func _get_context_actions() -> Array:
    var context = UIState.get_context()
    match context:
        UIState.UIContext.MAIN_MENU:
            return [
                {"action": "ui_accept", "label": "选择"},
                {"action": "ui_up", "label": "上"},
                {"action": "ui_down", "label": "下"},
            ]
        UIState.UIContext.LEVEL_SELECT:
            return [
                {"action": "ui_accept", "label": "进入关卡"},
                {"action": "ui_cancel", "label": "返回"},
                {"action": "ui_left", "label": "上一关"},
                {"action": "ui_right", "label": "下一关"},
            ]
        UIState.UIContext.GAME, UIState.UIContext.DIALOG:
            if GameManager.current_phase == GameManager.Phase.PURCHASE:
                return [
                    {"action": "ui_accept", "label": "选择/购买"},
                    {"action": "game_next_phase", "label": "进入销售"},
                    {"action": "game_pause", "label": "暂停"},
                ]
            elif GameManager.current_phase == GameManager.Phase.SELL:
                return [
                    {"action": "ui_accept", "label": "调整售价"},
                    {"action": "game_pause", "label": "暂停"},
                ]
            else:
                return [
                    {"action": "game_next_phase", "label": "继续"},
                ]
        UIState.UIContext.SETTINGS:
            return [
                {"action": "ui_accept", "label": "调整"},
                {"action": "ui_cancel", "label": "保存返回"},
            ]
        UIState.UIContext.TUTORIAL:
            return [
                {"action": "ui_accept", "label": "下一步"},
                {"action": "ui_cancel", "label": "跳过"},
            ]
    return []

func _add_hint(action_name: String, display_label: String) -> void:
    if input_hints_container == null:
        return
    
    var hint_box = HBoxContainer.new()
    hint_box.add_theme_constant_override("separation", 6)
    input_hints_container.add_child(hint_box)
    
    var key_label = Label.new()
    var key_hint = InputMapper.get_action_hint(action_name)
    key_label.text = key_hint
    key_label.add_theme_font_size_override("font_size", 13)
    
    var key_style = StyleBoxFlat.new()
    key_style.bg_color = Color(0.3, 0.5, 0.8, 0.9)
    key_style.corner_radius_top_left = 4
    key_style.corner_radius_top_right = 4
    key_style.corner_radius_bottom_left = 4
    key_style.corner_radius_bottom_right = 4
    key_style.content_margin_left = 8
    key_style.content_margin_right = 8
    key_style.content_margin_top = 2
    key_style.content_margin_bottom = 2
    key_label.add_theme_stylebox_override("normal", key_style)
    hint_box.add_child(key_label)
    
    var text_label = Label.new()
    text_label.text = display_label
    text_label.add_theme_font_size_override("font_size", 13)
    text_label.modulate = Color(0.9, 0.9, 0.9)
    hint_box.add_child(text_label)

func _on_input_mode_changed(_mode) -> void:
    _update_hints()

func _on_phase_changed(_phase) -> void:
    _update_hints()

func _on_context_changed(_context) -> void:
    _update_hints()

func set_visible_hints(visible: bool) -> void:
    _visible = visible
    visible = visible

func toggle_visible() -> void:
    _visible = not _visible
    visible = _visible
