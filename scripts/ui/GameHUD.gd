class_name GameHUD
extends Control

var money_label: Label
var day_label: Label
var phase_label: Label
var stall_level_label: Label
var customer_count_label: Label
var pause_button: Button
var next_phase_button: Button
var upgrade_button: Button

var ui_feedback = null
var input_hints_bar = null

func _ready() -> void:
    anchor_right = 1.0
    anchor_bottom = 1.0
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    
    if not _is_children_ready():
        _build_ui()
    
    _connect_signals()
    _register_event_listeners()
    _update_all_labels()

func _is_children_ready() -> bool:
    return money_label != null and day_label != null

func _build_ui() -> void:
    ui_feedback = load("res://scripts/ui/UIFeedback.gd").new()
    add_child(ui_feedback)
    
    var top_panel = PanelContainer.new()
    top_panel.anchor_left = 0.0
    top_panel.anchor_top = 0.0
    top_panel.anchor_right = 1.0
    top_panel.anchor_bottom = 0.0
    top_panel.offset_bottom = 70
    top_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(top_panel)
    
    var top_style = StyleBoxFlat.new()
    top_style.bg_color = Color(0.1, 0.1, 0.1, 0.85)
    top_style.content_margin_left = 20
    top_style.content_margin_right = 20
    top_style.content_margin_top = 8
    top_style.content_margin_bottom = 8
    top_panel.add_theme_stylebox_override("panel", top_style)
    
    var top_hbox = HBoxContainer.new()
    top_hbox.add_theme_constant_override("separation", 30)
    top_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
    top_panel.add_child(top_hbox)
    
    day_label = _create_info_label("📅 第 1/5 天", Color(1, 0.9, 0.7))
    top_hbox.add_child(day_label)
    
    phase_label = _create_info_label("⏰ 采购阶段", Color(0.7, 0.9, 1))
    top_hbox.add_child(phase_label)
    
    money_label = _create_info_label("💰 500 金币", Color(1, 0.85, 0.3))
    top_hbox.add_child(money_label)
    
    stall_level_label = _create_info_label("🏪 摊位 Lv.1", Color(0.8, 1, 0.8))
    top_hbox.add_child(stall_level_label)
    
    customer_count_label = _create_info_label("👥 顾客: 0/0", Color(1, 0.8, 0.9))
    top_hbox.add_child(customer_count_label)
    
    var button_spacer = Control.new()
    button_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top_hbox.add_child(button_spacer)
    
    pause_button = _create_top_button("⏸️ 暂停", Color(0.5, 0.5, 0.6))
    pause_button.mouse_filter = Control.MOUSE_FILTER_STOP
    top_hbox.add_child(pause_button)
    
    upgrade_button = _create_top_button("⬆️ 升级 (200)", Color(0.3, 0.6, 0.9))
    upgrade_button.mouse_filter = Control.MOUSE_FILTER_STOP
    top_hbox.add_child(upgrade_button)
    
    next_phase_button = _create_top_button("▶️ 下一阶段 [N]", Color(0.3, 0.8, 0.4))
    next_phase_button.mouse_filter = Control.MOUSE_FILTER_STOP
    next_phase_button.custom_minimum_size = Vector2(200, 45)
    top_hbox.add_child(next_phase_button)
    
    input_hints_bar = load("res://scripts/ui/InputHintsBar.gd").new()
    add_child(input_hints_bar)

func _create_info_label(text: String, color: Color) -> Label:
    var lbl = Label.new()
    lbl.text = text
    lbl.add_theme_font_size_override("font_size", 18)
    lbl.modulate = color
    lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    return lbl

func _create_top_button(text: String, color: Color) -> Button:
    var btn = Button.new()
    btn.text = text
    btn.custom_minimum_size = Vector2(120, 45)
    btn.add_theme_font_size_override("font_size", 15)
    
    var normal_style = StyleBoxFlat.new()
    normal_style.bg_color = color
    normal_style.corner_radius_top_left = 8
    normal_style.corner_radius_top_right = 8
    normal_style.corner_radius_bottom_left = 8
    normal_style.corner_radius_bottom_right = 8
    normal_style.content_margin_left = 12
    normal_style.content_margin_right = 12
    normal_style.content_margin_top = 6
    normal_style.content_margin_bottom = 6
    btn.add_theme_stylebox_override("normal", normal_style)
    
    var hover = normal_style.duplicate()
    hover.bg_color = color.lightened(0.15)
    btn.add_theme_stylebox_override("hover", hover)
    
    var pressed = normal_style.duplicate()
    pressed.bg_color = color.darkened(0.2)
    btn.add_theme_stylebox_override("pressed", pressed)
    
    return btn

func _connect_signals() -> void:
    pause_button.pressed.connect(_on_pause_pressed)
    next_phase_button.pressed.connect(_on_next_phase_pressed)
    upgrade_button.pressed.connect(_on_upgrade_pressed)

func _register_event_listeners() -> void:
    EventBus.on_event("money_changed", func(_a, _t): _update_money_label())
    EventBus.on_event("phase_changed", func(_p): _update_phase_label())
    EventBus.on_event("stall_upgraded", func(_s, _l): _update_stall_label())

func _update_all_labels() -> void:
    _update_money_label()
    _update_phase_label()
    _update_stall_label()
    _update_day_label()
    _update_customer_label()
    _update_upgrade_button()

func _update_money_label() -> void:
    if money_label:
        money_label.text = "💰 %d 金币" % GameManager.money

func _update_phase_label() -> void:
    if phase_label:
        var phase_names = {
            GameManager.Phase.PURCHASE: "⏰ 采购阶段 (白天)",
            GameManager.Phase.SELL: "🌙 销售阶段 (夜晚)",
            GameManager.Phase.SETTLEMENT: "📊 结算阶段"
        }
        phase_label.text = phase_names.get(GameManager.current_phase, "?")
        _update_next_phase_button()

func _update_day_label() -> void:
    if day_label:
        day_label.text = "📅 第 %d/%d 天" % [GameManager.current_day, GameManager.max_days]

func _update_stall_label() -> void:
    if stall_level_label:
        stall_level_label.text = "🏪 摊位 Lv.%d" % GameManager.stall_level
    _update_upgrade_button()

func _update_customer_label(served: int = 0, total: int = 0) -> void:
    if customer_count_label:
        if total > 0:
            customer_count_label.text = "👥 顾客: %d/%d" % [served, total]
        else:
            customer_count_label.text = "👥 顾客: -"

func _update_next_phase_button() -> void:
    if next_phase_button:
        var btn_text = ""
        match GameManager.current_phase:
            GameManager.Phase.PURCHASE:
                btn_text = "🌙 开始销售 [N]"
            GameManager.Phase.SELL:
                btn_text = "📊 查看结算 [N]"
            GameManager.Phase.SETTLEMENT:
                btn_text = "▶️ 下一天 [N]" if GameManager.current_day < GameManager.max_days else "🎉 完成关卡"
        next_phase_button.text = btn_text

func _update_upgrade_button() -> void:
    if upgrade_button:
        var cost = GameManager.get_upgrade_cost()
        upgrade_button.text = "⬆️ 升级 (%d)" % cost
        upgrade_button.disabled = GameManager.money < cost

func _on_pause_pressed() -> void:
    AudioManager.play_sfx("click")
    if GameManager.current_state == GameManager.GameState.PAUSED:
        GameManager.resume_game()
    else:
        _show_pause_menu()

func _show_pause_menu() -> void:
    GameManager.pause_game()
    var dialog = AcceptDialog.new()
    dialog.title = "⏸️ 游戏暂停"
    dialog.dialog_text = "\n游戏已暂停\n\n"
    
    var vbox = VBoxContainer.new()
    vbox.add_theme_constant_override("separation", 12)
    
    var resume_btn = Button.new()
    resume_btn.text = "▶️ 继续游戏"
    resume_btn.custom_minimum_size = Vector2(0, 45)
    
    var settings_btn = Button.new()
    settings_btn.text = "⚙️ 游戏设置"
    settings_btn.custom_minimum_size = Vector2(0, 45)
    
    var menu_btn = Button.new()
    menu_btn.text = "🏠 返回主菜单"
    menu_btn.custom_minimum_size = Vector2(0, 45)
    
    resume_btn.pressed.connect(func(): dialog.queue_free(); GameManager.resume_game())
    settings_btn.pressed.connect(func():
        var settings_dialog = GameAssets.load_scene("res://scenes/ui/SettingsDialog.tscn")
        if settings_dialog:
            var dlg = settings_dialog.instantiate()
            get_tree().root.add_child(dlg)
            dlg.popup_centered()
            UIState.open_dialog(dlg)
    )
    menu_btn.pressed.connect(func():
        dialog.queue_free()
        GameManager.go_to_main_menu()
    )
    
    vbox.add_child(resume_btn)
    vbox.add_child(settings_btn)
    vbox.add_child(menu_btn)
    dialog.add_child(vbox)
    
    dialog.canceled.connect(func(): GameManager.resume_game())
    get_tree().root.add_child(dialog)
    dialog.popup_centered(Vector2i(350, 300))

func _on_next_phase_pressed() -> void:
    AudioManager.play_sfx("click")
    if GameManager.current_state == GameManager.GameState.SETTLEMENT:
        GameManager.continue_after_settlement()
    else:
        GameManager.next_phase()
    _update_day_label()
    _update_upgrade_button()

func _on_upgrade_pressed() -> void:
    var cost = GameManager.get_upgrade_cost()
    if GameManager.money < cost:
        AudioManager.play_sfx("error")
        ui_feedback.show_hint("金币不足！需要 %d 金币" % cost, 2.0)
        return
    if GameManager.upgrade_stall():
        ui_feedback.flash_screen(Color(0.3, 0.8, 0.4), 0.3)
        ui_feedback.show_hint("摊位升级成功！Lv.%d" % GameManager.stall_level, 2.0)
    else:
        AudioManager.play_sfx("error")

func show_hint(text: String, duration: float = 2.0) -> void:
    if ui_feedback:
        ui_feedback.show_hint(text, duration)

func show_floating_text(pos: Vector2, text: String, color: Color = Color.YELLOW) -> void:
    if ui_feedback:
        ui_feedback.show_floating_text(pos, text, color)

func flash_screen(color: Color, duration: float = 0.2) -> void:
    if ui_feedback:
        ui_feedback.flash_screen(color, duration)

func shake_node(node: Node, intensity: float = 5.0, duration: float = 0.3) -> void:
    if ui_feedback:
        ui_feedback.shake_node(node, intensity, duration)

func pulse_scale(node: Node, scale_factor: float = 1.1, duration: float = 0.2) -> void:
    if ui_feedback:
        ui_feedback.pulse_scale(node, scale_factor, duration)

func set_input_hints(actions: Array) -> void:
    if input_hints_bar:
        input_hints_bar.set_action_hints(actions)

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("game_next_phase"):
        _on_next_phase_pressed()
    elif event.is_action_pressed("game_pause"):
        _on_pause_pressed()
