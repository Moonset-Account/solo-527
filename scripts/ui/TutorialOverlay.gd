class_name TutorialOverlay
extends Control

var step_title: Label
var step_content: RichTextLabel
var progress_label: Label
var progress_bar: ProgressBar
var prev_button: Button
var next_button: Button
var skip_button: Button

var tutorial_system = null
var _current_step_idx: int = 0

func _ready() -> void:
    tutorial_system = load("res://scripts/game/TutorialAdvice.gd").new()
    if not _is_children_ready():
        _build_ui()
    
    _connect_signals()
    visible = false

func _is_children_ready() -> bool:
    return step_title != null and next_button != null

func _build_ui() -> void:
    var bg = ColorRect.new()
    bg.color = Color(0, 0, 0, 0.5)
    bg.anchor_right = 1.0
    bg.anchor_bottom = 1.0
    bg.mouse_filter = Control.MOUSE_FILTER_STOP
    add_child(bg)
    
    var highlight = ColorRect.new()
    highlight.color = Color(1, 1, 0, 0.0)
    highlight.anchor_right = 1.0
    highlight.anchor_bottom = 1.0
    highlight.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(highlight)
    
    var dialog_panel = PanelContainer.new()
    dialog_panel.anchor_left = 0.5
    dialog_panel.anchor_top = 1.0
    dialog_panel.anchor_right = 0.5
    dialog_panel.anchor_bottom = 1.0
    dialog_panel.offset_left = -400
    dialog_panel.offset_right = 400
    dialog_panel.offset_top = -230
    dialog_panel.offset_bottom = -20
    add_child(dialog_panel)
    
    var dlg_style = StyleBoxFlat.new()
    dlg_style.bg_color = Color(0.08, 0.1, 0.2, 0.95)
    dlg_style.corner_radius_top_left = 16
    dlg_style.corner_radius_top_right = 16
    dlg_style.corner_radius_bottom_left = 16
    dlg_style.corner_radius_bottom_right = 16
    dlg_style.border_color = Color(0.5, 0.8, 1)
    dlg_style.border_width_left = 2
    dlg_style.border_width_right = 2
    dlg_style.border_width_top = 2
    dlg_style.border_width_bottom = 2
    dlg_style.content_margin_left = 24
    dlg_style.content_margin_right = 24
    dlg_style.content_margin_top = 16
    dlg_style.content_margin_bottom = 16
    dialog_panel.add_theme_stylebox_override("panel", dlg_style)
    
    var main_vbox = VBoxContainer.new()
    main_vbox.add_theme_constant_override("separation", 12)
    main_vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
    dialog_panel.add_child(main_vbox)
    
    var top_row = HBoxContainer.new()
    top_row.alignment = BoxContainer.ALIGNMENT_BEGIN
    top_row.add_theme_constant_override("separation", 12)
    main_vbox.add_child(top_row)
    
    var icon = Label.new()
    icon.text = "📚"
    icon.add_theme_font_size_override("font_size", 28)
    top_row.add_child(icon)
    
    step_title = Label.new()
    step_title.text = "新手引导"
    step_title.add_theme_font_size_override("font_size", 22)
    step_title.modulate = Color(0.85, 0.95, 1)
    top_row.add_child(step_title)
    
    var spacer = Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top_row.add_child(spacer)
    
    skip_button = Button.new()
    skip_button.text = "跳过 ✕"
    skip_button.custom_minimum_size = Vector2(100, 35)
    skip_button.modulate = Color(0.8, 0.8, 0.8)
    top_row.add_child(skip_button)
    
    var prog_row = HBoxContainer.new()
    prog_row.add_theme_constant_override("separation", 10)
    main_vbox.add_child(prog_row)
    
    progress_label = Label.new()
    progress_label.text = "1 / 7"
    progress_label.modulate = Color(0.7, 0.7, 0.7)
    prog_row.add_child(progress_label)
    
    progress_bar = ProgressBar.new()
    progress_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    progress_bar.custom_minimum_size = Vector2(0, 12)
    progress_bar.show_percentage = false
    progress_bar.value = 0.0
    prog_row.add_child(progress_bar)
    
    step_content = RichTextLabel.new()
    step_content.bbcode_enabled = true
    step_content.size_flags_vertical = Control.SIZE_EXPAND_FILL
    step_content.custom_minimum_size = Vector2(0, 80)
    step_content.add_theme_font_size_override("normal_font_size", 15)
    step_content.scroll_active = false
    main_vbox.add_child(step_content)
    
    var hint_input = Label.new()
    hint_input.text = "[操作提示] %s = 下一步 / %s = 上一步" % [InputMapper.get_action_hint("ui_accept"), InputMapper.get_action_hint("ui_cancel")]
    hint_input.add_theme_font_size_override("font_size", 11)
    hint_input.modulate = Color(0.5, 0.65, 0.8)
    main_vbox.add_child(hint_input)
    
    var btn_row = HBoxContainer.new()
    btn_row.add_theme_constant_override("separation", 15)
    btn_row.alignment = BoxContainer.ALIGNMENT_END
    main_vbox.add_child(btn_row)
    
    prev_button = Button.new()
    prev_button.text = "◀ 上一步"
    prev_button.custom_minimum_size = Vector2(130, 42)
    prev_button.disabled = true
    btn_row.add_child(prev_button)
    
    next_button = Button.new()
    next_button.text = "下一步 ▶"
    next_button.custom_minimum_size = Vector2(130, 42)
    
    var nxt_style = StyleBoxFlat.new()
    nxt_style.bg_color = Color(0.3, 0.5, 0.9)
    nxt_style.corner_radius_top_left = 8
    nxt_style.corner_radius_top_right = 8
    nxt_style.corner_radius_bottom_left = 8
    nxt_style.corner_radius_bottom_right = 8
    next_button.add_theme_stylebox_override("normal", nxt_style)
    btn_row.add_child(next_button)

func _connect_signals() -> void:
    prev_button.pressed.connect(_on_prev)
    next_button.pressed.connect(_on_next)
    skip_button.pressed.connect(_on_skip)

func start_tutorial() -> void:
    if not UIState.should_show_tutorial_first_time():
        return
    _current_step_idx = 0
    tutorial_system.reset_tutorial()
    visible = true
    UIState.start_tutorial()
    _update_display()
    AudioManager.play_sfx("transition")

func _update_display() -> void:
    var step = tutorial_system.TUTORIAL_STEPS[_current_step_idx]
    step_title.text = step.get("title", "步骤")
    step_content.bbcode_text = step.get("content", "")
    
    var total = tutorial_system.get_total_steps()
    progress_label.text = "%d / %d" % [_current_step_idx + 1, total]
    progress_bar.value = float(_current_step_idx + 1) / float(total) * 100.0
    
    prev_button.disabled = _current_step_idx == 0
    
    if _current_step_idx >= total - 1:
        next_button.text = "✓ 开始游戏"
    else:
        next_button.text = "下一步 ▶"

func _on_next() -> void:
    AudioManager.play_sfx("click")
    var total = tutorial_system.get_total_steps()
    if _current_step_idx >= total - 1:
        _on_finish()
    else:
        _current_step_idx += 1
        tutorial_system.current_tutorial_step = _current_step_idx
        _update_display()

func _on_prev() -> void:
    AudioManager.play_sfx("click")
    if _current_step_idx > 0:
        _current_step_idx -= 1
        tutorial_system.current_tutorial_step = _current_step_idx
        _update_display()

func _on_skip() -> void:
    AudioManager.play_sfx("click")
    tutorial_system.skip_tutorial()
    visible = false

func _on_finish() -> void:
    tutorial_system.complete_tutorial()
    visible = false
    SaveManager.update_setting("show_hints", true)
    AudioManager.play_sfx("success")

func _unhandled_input(event: InputEvent) -> void:
    if not visible:
        return
    if event.is_action_pressed("ui_accept"):
        _on_next()
    elif event.is_action_pressed("ui_cancel"):
        if _current_step_idx == 0:
            _on_skip()
        else:
            _on_prev()
