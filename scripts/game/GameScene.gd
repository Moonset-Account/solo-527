extends Node2D

var purchase_panel: Control
var sell_panel: Control
var settlement_panel: Control
var hud: Control
var tutorial_overlay: Control
var advice_panel: Control

var _background: ColorRect = null
var _ambient_decorations: Array = []
var _advice_timer: Timer = null
var _advice_shown_for_phase: bool = false

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(max(0, n)):
        result += s
    return result

func _ready() -> void:
    name = "GameScene"
    
    if not _verify_nodes():
        _build_scene()
    
    _connect_system_signals()
    _start_game_flow()
    SaveManager.games_played += 1
    SaveManager.save_progress()

func _verify_nodes() -> bool:
    return purchase_panel != null and sell_panel != null and hud != null

func _build_scene() -> void:
    _background = ColorRect.new()
    _background.color = Color(0.12, 0.18, 0.14)
    _background.set_anchors_preset(Control.PRESET_FULL_RECT)
    _background.z_index = -100
    _background.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(_background)
    
    _build_ambient_decorations()
    
    hud = load("res://scripts/ui/GameHUD.gd").new()
    hud.name = "GameHUD"
    add_child(hud)
    
    purchase_panel = load("res://scripts/ui/PurchasePanel.gd").new()
    purchase_panel.name = "PurchasePanel"
    add_child(purchase_panel)
    
    sell_panel = load("res://scripts/ui/SellPanel.gd").new()
    sell_panel.name = "SellPanel"
    add_child(sell_panel)
    
    settlement_panel = load("res://scripts/ui/SettlementPanel.gd").new()
    settlement_panel.name = "SettlementPanel"
    add_child(settlement_panel)
    
    tutorial_overlay = load("res://scripts/ui/TutorialOverlay.gd").new()
    tutorial_overlay.name = "TutorialOverlay"
    add_child(tutorial_overlay)
    
    _build_advice_panel()
    _setup_advice_timer()

func _build_ambient_decorations() -> void:
    var top_bar = ColorRect.new()
    top_bar.color = Color(0.08, 0.12, 0.09)
    top_bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
    top_bar.offset_bottom = 90
    top_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(top_bar)
    
    var bottom_bar = ColorRect.new()
    bottom_bar.color = Color(0.08, 0.12, 0.09)
    bottom_bar.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
    bottom_bar.offset_top = -90
    bottom_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(bottom_bar)
    
    for i in range(6):
        var lantern = Label.new()
        lantern.text = "🏮"
        lantern.add_theme_font_size_override("font_size", 28)
        lantern.modulate = Color(1, 1, 0.9, 0.6)
        var x_pos = 50 + i * 200
        lantern.position = Vector2(x_pos, 100)
        lantern.rotation = sin(i * 0.5) * 0.15
        add_child(lantern)
        _ambient_decorations.append(lantern)
    
    for i in range(8):
        var tree = Label.new()
        tree.text = "🌲" if i % 2 == 0 else "🌳"
        tree.add_theme_font_size_override("font_size", 42)
        tree.modulate = Color(1, 1, 1, 0.35)
        var x_pos = 30 + i * 150
        tree.position = Vector2(x_pos, 620)
        add_child(tree)
        _ambient_decorations.append(tree)

func _build_advice_panel() -> void:
    advice_panel = PanelContainer.new()
    advice_panel.name = "AdvicePanel"
    advice_panel.anchor_left = 1.0
    advice_panel.anchor_top = 0.15
    advice_panel.anchor_right = 1.0
    advice_panel.anchor_bottom = 0.15
    advice_panel.offset_left = -320
    advice_panel.offset_right = -20
    advice_panel.offset_top = 0
    advice_panel.offset_bottom = 100
    advice_panel.visible = false
    advice_panel.z_index = 20
    
    var style = StyleBoxFlat.new()
    style.bg_color = Color(0.1, 0.15, 0.2, 0.92)
    style.corner_radius_top_left = 10
    style.corner_radius_top_right = 10
    style.corner_radius_bottom_left = 10
    style.corner_radius_bottom_right = 10
    style.border_color = Color(0.5, 0.7, 0.9)
    style.border_width_left = 1
    style.border_width_right = 1
    style.border_width_top = 1
    style.border_width_bottom = 1
    style.content_margin_left = 14
    style.content_margin_right = 14
    style.content_margin_top = 10
    style.content_margin_bottom = 10
    advice_panel.add_theme_stylebox_override("panel", style)
    
    var vbox = VBoxContainer.new()
    vbox.add_theme_constant_override("separation", 8)
    advice_panel.add_child(vbox)
    
    var title_row = HBoxContainer.new()
    title_row.add_theme_constant_override("separation", 8)
    title_row.alignment = BoxContainer.ALIGNMENT_BEGIN
    vbox.add_child(title_row)
    
    var icon = Label.new()
    icon.text = "💡"
    icon.add_theme_font_size_override("font_size", 18)
    title_row.add_child(icon)
    
    var title = Label.new()
    title.text = "经营建议"
    title.add_theme_font_size_override("font_size", 15)
    title.modulate = Color(0.9, 0.95, 1)
    title_row.add_child(title)
    
    var spacer = Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    title_row.add_child(spacer)
    
    var close_btn = Button.new()
    close_btn.text = "✕"
    close_btn.custom_minimum_size = Vector2(30, 28)
    close_btn.flat = true
    close_btn.modulate = Color(0.7, 0.7, 0.7)
    close_btn.pressed.connect(func(): advice_panel.visible = false; AudioManager.play_sfx("click"))
    title_row.add_child(close_btn)
    
    var sep = HSeparator.new()
    vbox.add_child(sep)
    
    var advice_title = Label.new()
    advice_title.name = "AdviceTitle"
    advice_title.text = ""
    advice_title.add_theme_font_size_override("font_size", 14)
    advice_title.bbcode_enabled = true
    vbox.add_child(advice_title)
    
    var advice_content = RichTextLabel.new()
    advice_content.name = "AdviceContent"
    advice_content.bbcode_enabled = true
    advice_content.size_flags_vertical = Control.SIZE_EXPAND_FILL
    advice_content.custom_minimum_size = Vector2(0, 50)
    advice_content.scroll_active = false
    advice_content.add_theme_font_size_override("normal_font_size", 13)
    vbox.add_child(advice_content)
    
    add_child(advice_panel)

func _setup_advice_timer() -> void:
    _advice_timer = Timer.new()
    _advice_timer.name = "AdviceTimer"
    _advice_timer.wait_time = 4.0
    _advice_timer.one_shot = true
    _advice_timer.timeout.connect(_show_phase_advice)
    add_child(_advice_timer)

func _connect_system_signals() -> void:
    EventBus.on_event("phase_changed", _on_phase_changed)
    EventBus.on_event("game_state_changed", _on_game_state_changed)
    EventBus.on_event("level_completed", _on_level_completed)

func _start_game_flow() -> void:
    UIState.set_context(UIState.UIContext.GAME)
    if hud and hud.has_method("set_input_hints"):
        hud.set_input_hints([])
    
    await get_tree().process_frame
    if tutorial_overlay and tutorial_overlay.has_method("start_tutorial"):
        tutorial_overlay.start_tutorial()
    
    _advice_timer.start()

func _on_phase_changed(new_phase: int) -> void:
    _advice_shown_for_phase = false
    
    match new_phase:
        GameManager.Phase.PURCHASE:
            _apply_purchase_visuals()
            _advice_timer.start()
        GameManager.Phase.SELL:
            _apply_sell_visuals()
            _advice_timer.start()
        GameManager.Phase.SETTLEMENT:
            _advice_timer.stop()
    
    if hud and hud.has_method("show_hint"):
        var phase_hints = {
            GameManager.Phase.PURCHASE: "🛒 采购阶段 - 挑选商品、购买库存",
            GameManager.Phase.SELL: "🌙 销售阶段 - 陈列商品、接待顾客",
            GameManager.Phase.SETTLEMENT: "📊 结算阶段 - 查看今日报告"
        }
        hud.show_hint(phase_hints.get(new_phase, ""), 2.5)

func _on_game_state_changed(new_state: int) -> void:
    match new_state:
        GameManager.GameState.PAUSED:
            if hud: hud.modulate.a = 0.5
        GameManager.GameState.PLAYING:
            if hud: hud.modulate.a = 1.0

func _on_level_completed(level_id: String, stars: int) -> void:
    SaveManager.save_level_progress(level_id, stars, GameManager.money)
    
    var dialog = AcceptDialog.new()
    dialog.title = "🎉 关卡完成！"
    dialog.dialog_text = "\n\n恭喜完成关卡！\n\n最终金额: %d 金币\n评价: %s\n\n是否继续到其他关卡？\n" % [GameManager.money, _repeat_str("⭐", stars) + _repeat_str("☆", (3 - stars))]
    dialog.confirmed.connect(func(): GameManager.go_to_level_select())
    dialog.canceled.connect(func(): GameManager.go_to_main_menu())
    dialog.add_button("🏠 返回主菜单", true, "cancel")
    dialog.add_button("🗺️ 选择关卡", false, "ok")
    get_tree().root.add_child(dialog)
    dialog.popup_centered(Vector2i(420, 300))

func _apply_purchase_visuals() -> void:
    if _background:
        var tween = create_tween()
        tween.tween_property(_background, "color", Color(0.18, 0.15, 0.08), 0.6)
    
    for decor in _ambient_decorations:
        if decor is Label and decor.text in ["🏮"]:
            var tween = create_tween()
            tween.tween_property(decor, "modulate:a", 0.3, 0.4)

func _apply_sell_visuals() -> void:
    if _background:
        var tween = create_tween()
        tween.tween_property(_background, "color", Color(0.06, 0.08, 0.18), 0.6)
    
    for decor in _ambient_decorations:
        if decor is Label and decor.text in ["🏮"]:
            var tween = create_tween()
            tween.tween_property(decor, "modulate:a", 1.0, 0.4)

func _show_phase_advice() -> void:
    if _advice_shown_for_phase:
        return
    if not SaveManager.settings.get("show_hints", true):
        return
    if not advice_panel:
        return
    
    var advice_data = {}
    if GameManager.current_phase == GameManager.Phase.PURCHASE and purchase_panel and purchase_panel.has_method("get_advice_for_phase"):
        advice_data = purchase_panel.get_advice_for_phase()
    elif GameManager.current_phase == GameManager.Phase.SELL and sell_panel and sell_panel.has_method("get_advice_data"):
        var ta = load("res://scripts/game/TutorialAdvice.gd").new()
        advice_data = ta.generate_advice(GameManager.current_phase, sell_panel.get_advice_data())
    
    if advice_data.is_empty():
        return
    
    _advice_shown_for_phase = true
    _display_advice(advice_data)

func _display_advice(advice: Dictionary) -> void:
    if advice_panel == null:
        return
    
    var colors = {
        "info": "#6EB5FF",
        "tip": "#7BED9F",
        "warning": "#FFD700",
        "error": "#FF6B6B",
        "success": "#7BED9F"
    }
    var c = colors.get(advice.get("type", "info"), "#FFFFFF")
    
    var title_lbl = advice_panel.get_node("VBoxContainer/AdviceTitle") if advice_panel.has_node("VBoxContainer/AdviceTitle") else null
    if title_lbl and title_lbl is Label:
        title_lbl.bbcode_text = "[color=%s][b]%s[/b][/color]" % [c, advice.get("title", "建议")]
    
    var content_rt = advice_panel.get_node("VBoxContainer/AdviceContent") if advice_panel.has_node("VBoxContainer/AdviceContent") else null
    if content_rt and content_rt is RichTextLabel:
        content_rt.bbcode_text = advice.get("content", "")
    
    advice_panel.visible = true
    advice_panel.modulate = Color(1, 1, 1, 0)
    var tween = create_tween()
    tween.set_trans(Tween.TRANS_BACK)
    tween.tween_property(advice_panel, "modulate:a", 1.0, 0.3)
    
    AudioManager.play_sfx("pickup")

func _process(delta: float) -> void:
    _animate_lanterns(delta)

func _animate_lanterns(delta: float) -> void:
    var time = Time.get_ticks_msec() / 1000.0
    var i = 0
    for decor in _ambient_decorations:
        if decor is Label and decor.text in ["🏮"]:
            decor.rotation = sin(time * 1.5 + i * 0.8) * 0.1
            decor.position.y = 100 + sin(time * 2.0 + i) * 3
        i += 1

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel") and UIState.get_context() == UIState.UIContext.GAME:
        if GameManager.current_state == GameManager.GameState.PLAYING:
            if hud and hud.has_method("_on_pause_pressed"):
                hud._on_pause_pressed()
