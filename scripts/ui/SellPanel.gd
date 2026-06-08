class_name SellPanel
extends Control

var stall_display: GridContainer
var customer_area: VBoxContainer
var selected_slot_label: Label
var price_spin: SpinBox
var set_price_button: Button
var inventory_scroll: ScrollContainer
var inventory_grid: GridContainer
var customer_info_label: Label
var customer_mood_label: Label
var progress_label: Label
var night_overlay: ColorRect

var customer_system = null
var _selected_slot: int = -1
var _selected_inventory_item: String = ""
var _current_customer = null
var _sell_timer: Timer = null
var _tutorial_advice = null

const CUSTOMER_SPAWN_INTERVAL: float = 2.5

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(max(0, n)):
        result += s
    return result

func _ready() -> void:
    customer_system = load("res://scripts/game/CustomerSystem.gd").new()
    _tutorial_advice = load("res://scripts/game/TutorialAdvice.gd").new()
    
    if not _is_children_ready():
        _build_ui()
    
    _connect_signals()
    _setup_timer()
    
    EventBus.on_event("phase_changed", _on_phase_changed)
    EventBus.on_event("stall_upgraded", func(_s, _l): _rebuild_stall())
    EventBus.on_event("inventory_changed", func(_i, _c): _refresh_inventory())

func _is_children_ready() -> bool:
    return stall_display != null and customer_area != null

func _build_ui() -> void:
    night_overlay = ColorRect.new()
    night_overlay.color = Color(0.05, 0.05, 0.15, 0.25)
    night_overlay.anchor_right = 1.0
    night_overlay.anchor_bottom = 1.0
    night_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(night_overlay)
    
    var main_hbox = HBoxContainer.new()
    main_hbox.anchor_left = 0.0
    main_hbox.anchor_top = 0.0
    main_hbox.anchor_right = 1.0
    main_hbox.anchor_bottom = 1.0
    main_hbox.offset_top = 80
    main_hbox.offset_bottom = -80
    main_hbox.offset_left = 20
    main_hbox.offset_right = -20
    main_hbox.add_theme_constant_override("separation", 20)
    add_child(main_hbox)
    
    var left_panel = VBoxContainer.new()
    left_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    left_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
    left_panel.add_theme_constant_override("separation", 15)
    main_hbox.add_child(left_panel)
    
    var inv_panel = PanelContainer.new()
    inv_panel.custom_minimum_size = Vector2(0, 180)
    left_panel.add_child(inv_panel)
    
    var inv_style = StyleBoxFlat.new()
    inv_style.bg_color = Color(0.1, 0.08, 0.12, 0.9)
    inv_style.corner_radius_top_left = 12
    inv_style.corner_radius_top_right = 12
    inv_style.corner_radius_bottom_left = 12
    inv_style.corner_radius_bottom_right = 12
    inv_style.content_margin_left = 12
    inv_style.content_margin_right = 12
    inv_style.content_margin_top = 10
    inv_style.content_margin_bottom = 10
    inv_panel.add_theme_stylebox_override("panel", inv_style)
    
    var inv_vbox = VBoxContainer.new()
    inv_vbox.add_theme_constant_override("separation", 8)
    inv_panel.add_child(inv_vbox)
    
    var inv_title = Label.new()
    inv_title.text = "📦 库存（点击选择商品，再点击陈列槽放置）"
    inv_title.add_theme_font_size_override("font_size", 14)
    inv_title.modulate = Color(0.9, 0.8, 1)
    inv_vbox.add_child(inv_title)
    
    inventory_scroll = ScrollContainer.new()
    inventory_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
    inventory_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    inventory_scroll.custom_minimum_size = Vector2(0, 120)
    inv_vbox.add_child(inventory_scroll)
    
    inventory_grid = GridContainer.new()
    inventory_grid.columns = 8
    inventory_grid.add_theme_constant_override("h_separation", 6)
    inventory_grid.add_theme_constant_override("v_separation", 6)
    inventory_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    inventory_scroll.add_child(inventory_grid)
    
    var stall_panel = PanelContainer.new()
    stall_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
    left_panel.add_child(stall_panel)
    
    var stall_style = StyleBoxFlat.new()
    stall_style.bg_color = Color(0.12, 0.08, 0.03, 0.9)
    stall_style.corner_radius_top_left = 12
    stall_style.corner_radius_top_right = 12
    stall_style.corner_radius_bottom_left = 12
    stall_style.corner_radius_bottom_right = 12
    stall_style.content_margin_left = 16
    stall_style.content_margin_right = 16
    stall_style.content_margin_top = 12
    stall_style.content_margin_bottom = 12
    stall_panel.add_theme_stylebox_override("panel", stall_style)
    
    var stall_vbox = VBoxContainer.new()
    stall_vbox.add_theme_constant_override("separation", 12)
    stall_vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
    stall_panel.add_child(stall_vbox)
    
    var stall_title = Label.new()
    stall_title.text = "🏪 我的摊位陈列"
    stall_title.add_theme_font_size_override("font_size", 20)
    stall_title.modulate = Color(1, 0.9, 0.7)
    stall_vbox.add_child(stall_title)
    
    var stall_scroll = ScrollContainer.new()
    stall_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    stall_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
    stall_vbox.add_child(stall_scroll)
    
    stall_display = GridContainer.new()
    stall_display.columns = 4
    stall_display.add_theme_constant_override("h_separation", 12)
    stall_display.add_theme_constant_override("v_separation", 12)
    stall_display.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    stall_scroll.add_child(stall_display)
    
    var price_panel = PanelContainer.new()
    left_panel.add_child(price_panel)
    
    var price_style = StyleBoxFlat.new()
    price_style.bg_color = Color(0.05, 0.1, 0.15, 0.9)
    price_style.corner_radius_top_left = 10
    price_style.corner_radius_top_right = 10
    price_style.corner_radius_bottom_left = 10
    price_style.corner_radius_bottom_right = 10
    price_style.content_margin_left = 12
    price_style.content_margin_right = 12
    price_style.content_margin_top = 10
    price_style.content_margin_bottom = 10
    price_panel.add_theme_stylebox_override("panel", price_style)
    
    var price_row = HBoxContainer.new()
    price_row.add_theme_constant_override("separation", 12)
    price_panel.add_child(price_row)
    
    selected_slot_label = Label.new()
    selected_slot_label.text = "选择陈列槽调整价格"
    selected_slot_label.custom_minimum_size = Vector2(220, 0)
    price_row.add_child(selected_slot_label)
    
    price_spin = SpinBox.new()
    price_spin.min_value = 1
    price_spin.max_value = 999
    price_spin.value = 20
    price_spin.custom_minimum_size = Vector2(100, 35)
    price_row.add_child(price_spin)
    
    set_price_button = Button.new()
    set_price_button.text = "✓ 设置价格"
    set_price_button.custom_minimum_size = Vector2(120, 35)
    set_price_button.disabled = true
    price_row.add_child(set_price_button)
    
    var right_panel = VBoxContainer.new()
    right_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    right_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
    right_panel.add_theme_constant_override("separation", 15)
    right_panel.custom_minimum_size = Vector2(350, 0)
    main_hbox.add_child(right_panel)
    
    progress_label = Label.new()
    progress_label.text = "顾客进度: 0/0"
    progress_label.add_theme_font_size_override("font_size", 16)
    progress_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    progress_label.modulate = Color(0.9, 0.9, 1)
    right_panel.add_child(progress_label)
    
    var cust_panel = PanelContainer.new()
    cust_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
    right_panel.add_child(cust_panel)
    
    var cust_style = StyleBoxFlat.new()
    cust_style.bg_color = Color(0.08, 0.1, 0.08, 0.9)
    cust_style.corner_radius_top_left = 12
    cust_style.corner_radius_top_right = 12
    cust_style.corner_radius_bottom_left = 12
    cust_style.corner_radius_bottom_right = 12
    cust_style.content_margin_left = 16
    cust_style.content_margin_right = 16
    cust_style.content_margin_top = 12
    cust_style.content_margin_bottom = 12
    cust_panel.add_theme_stylebox_override("panel", cust_style)
    
    customer_area = VBoxContainer.new()
    customer_area.add_theme_constant_override("separation", 10)
    customer_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
    cust_panel.add_child(customer_area)
    
    var cust_title = Label.new()
    cust_title.text = "👥 当前顾客"
    cust_title.add_theme_font_size_override("font_size", 18)
    cust_title.modulate = Color(1, 0.85, 0.9)
    customer_area.add_child(cust_title)
    
    customer_info_label = Label.new()
    customer_info_label.text = "等待顾客光临..."
    customer_info_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    customer_info_label.add_theme_font_size_override("font_size", 14)
    customer_area.add_child(customer_info_label)
    
    customer_mood_label = Label.new()
    customer_mood_label.text = ""
    customer_mood_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    customer_mood_label.add_theme_font_size_override("font_size", 32)
    customer_mood_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
    customer_mood_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    customer_area.add_child(customer_mood_label)
    
    var action_row = HBoxContainer.new()
    action_row.add_theme_constant_override("separation", 10)
    action_row.alignment = BoxContainer.ALIGNMENT_CENTER
    right_panel.add_child(action_row)
    
    var serve_btn = Button.new()
    serve_btn.text = "💫 接待下一位顾客"
    serve_btn.custom_minimum_size = Vector2(220, 50)
    serve_btn.add_theme_font_size_override("font_size", 15)
    serve_btn.pressed.connect(_on_serve_customer)
    action_row.add_child(serve_btn)
    
    _rebuild_stall()
    _refresh_inventory()
    visible = false

func _connect_signals() -> void:
    set_price_button.pressed.connect(_on_set_price)
    price_spin.value_changed.connect(_on_price_changed)

func _setup_timer() -> void:
    _sell_timer = Timer.new()
    _sell_timer.wait_time = CUSTOMER_SPAWN_INTERVAL
    _sell_timer.timeout.connect(_on_sell_timer)
    add_child(_sell_timer)

func _rebuild_stall() -> void:
    for child in stall_display.get_children():
        child.queue_free()
    
    var slots = GameManager.display_slots
    for i in range(slots):
        var slot = _create_stall_slot(i)
        stall_display.add_child(slot)
    
    while GameManager.display_items.size() < slots:
        GameManager.display_items.append("")

func _create_stall_slot(slot_index: int) -> PanelContainer:
    var slot = PanelContainer.new()
    slot.custom_minimum_size = Vector2(120, 130)
    slot.name = "slot_%d" % slot_index
    
    var is_selected = _selected_slot == slot_index
    var item_id = GameManager.display_items[slot_index] if slot_index < GameManager.display_items.size() else ""
    
    var slot_style = StyleBoxFlat.new()
    if is_selected:
        slot_style.bg_color = Color(0.4, 0.6, 0.9)
        slot_style.border_color = Color.WHITE
        slot_style.border_width_left = 2
        slot_style.border_width_right = 2
        slot_style.border_width_top = 2
        slot_style.border_width_bottom = 2
    elif item_id.is_empty():
        slot_style.bg_color = Color(0.15, 0.12, 0.08)
    else:
        slot_style.bg_color = Color(0.25, 0.35, 0.2)
    slot_style.corner_radius_top_left = 8
    slot_style.corner_radius_top_right = 8
    slot_style.corner_radius_bottom_left = 8
    slot_style.corner_radius_bottom_right = 8
    slot_style.content_margin_left = 8
    slot_style.content_margin_right = 8
    slot_style.content_margin_top = 8
    slot_style.content_margin_bottom = 8
    slot.add_theme_stylebox_override("panel", slot_style)
    
    var vbox = VBoxContainer.new()
    vbox.add_theme_constant_override("separation", 4)
    vbox.alignment = BoxContainer.ALIGNMENT_CENTER
    slot.add_child(vbox)
    
    var slot_num = Label.new()
    slot_num.text = "槽位 #%d" % (slot_index + 1)
    slot_num.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    slot_num.add_theme_font_size_override("font_size", 10)
    slot_num.modulate = Color(0.7, 0.7, 0.7)
    vbox.add_child(slot_num)
    
    if item_id.is_empty():
        var empty = Label.new()
        empty.text = "📦\n空"
        empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        empty.add_theme_font_size_override("font_size", 24)
        empty.modulate = Color(0.5, 0.5, 0.5)
        empty.size_flags_vertical = Control.SIZE_EXPAND_FILL
        vbox.add_child(empty)
    else:
        var item_data = GameAssets.get_item_data(item_id)
        var icon = TextureRect.new()
        icon.texture = GameAssets.get_item_texture(item_id)
        icon.custom_minimum_size = Vector2(50, 50)
        icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
        vbox.add_child(icon)
        
        var name = Label.new()
        name.text = item_data.get("name", item_id)
        name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        name.add_theme_font_size_override("font_size", 12)
        vbox.add_child(name)
        
        var price = GameManager.item_prices.get(item_id, 0)
        var stock = GameManager.inventory.get(item_id, 0)
        var price_lbl = Label.new()
        price_lbl.text = "💰 %d | 剩%d" % [price, stock]
        price_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        price_lbl.add_theme_font_size_override("font_size", 11)
        price_lbl.modulate = Color(1, 0.85, 0.3)
        vbox.add_child(price_lbl)
    
    slot.gui_input.connect(func(event):
        if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
            _on_slot_clicked(slot_index)
    )
    
    return slot

func _refresh_inventory() -> void:
    if inventory_grid == null:
        return
    for child in inventory_grid.get_children():
        child.queue_free()
    
    var has_items = false
    for item_id in GameManager.inventory.keys():
        var count = GameManager.inventory[item_id]
        if count <= 0:
            continue
        has_items = true
        
        var item = PanelContainer.new()
        item.custom_minimum_size = Vector2(72, 85)
        
        var is_selected = _selected_inventory_item == item_id
        var item_style = StyleBoxFlat.new()
        item_style.bg_color = Color(0.3, 0.25, 0.4) if not is_selected else Color(0.5, 0.7, 1.0)
        item_style.corner_radius_top_left = 6
        item_style.corner_radius_top_right = 6
        item_style.corner_radius_bottom_left = 6
        item_style.corner_radius_bottom_right = 6
        item_style.content_margin_left = 4
        item_style.content_margin_right = 4
        item_style.content_margin_top = 4
        item_style.content_margin_bottom = 4
        item.add_theme_stylebox_override("panel", item_style)
        
        var vbox = VBoxContainer.new()
        vbox.alignment = BoxContainer.ALIGNMENT_CENTER
        item.add_child(vbox)
        
        var icon = TextureRect.new()
        icon.texture = GameAssets.get_item_texture(item_id)
        icon.custom_minimum_size = Vector2(40, 40)
        icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
        vbox.add_child(icon)
        
        var count_lbl = Label.new()
        count_lbl.text = "x%d" % count
        count_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        count_lbl.add_theme_font_size_override("font_size", 11)
        count_lbl.modulate = Color(1, 0.9, 0.5)
        vbox.add_child(count_lbl)
        
        item.gui_input.connect(func(event):
            if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
                _on_inventory_item_clicked(item_id)
        )
        
        inventory_grid.add_child(item)
    
    if not has_items:
        var empty = Label.new()
        empty.text = "库存为空，请先采购商品"
        empty.modulate = Color(0.6, 0.6, 0.6)
        inventory_grid.add_child(empty)

func _on_slot_clicked(slot_index: int) -> void:
    AudioManager.play_sfx("click")
    var current_item = GameManager.display_items[slot_index] if slot_index < GameManager.display_items.size() else ""
    
    if not _selected_inventory_item.is_empty():
        var inv_count = GameManager.inventory.get(_selected_inventory_item, 0)
        if inv_count > 0:
            var recommended = LevelConfig.get_recommended_price(_selected_inventory_item)
            var success = GameManager.set_display_item(slot_index, _selected_inventory_item, recommended)
            if success:
                _selected_inventory_item = ""
                _rebuild_stall()
                _refresh_inventory()
                AudioManager.play_sfx("pickup")
        return
    
    _selected_slot = slot_index
    if not current_item.is_empty():
        var price = GameManager.item_prices.get(current_item, 0)
        price_spin.value = price
        price_spin.disabled = false
        set_price_button.disabled = false
        var range = LevelConfig.get_item_price_range(current_item)
        price_spin.min_value = range[0]
        price_spin.max_value = range[1]
        selected_slot_label.text = "槽位#%d: %s" % [slot_index + 1, ItemsDB.get_item_name(current_item)]
    else:
        selected_slot_label.text = "槽位#%d: 空 - 请先从库存选择商品" % (slot_index + 1)
        set_price_button.disabled = true
        price_spin.disabled = true
    
    _rebuild_stall()

func _on_inventory_item_clicked(item_id: String) -> void:
    AudioManager.play_sfx("click")
    if _selected_inventory_item == item_id:
        _selected_inventory_item = ""
    else:
        _selected_inventory_item = item_id
        selected_slot_label.text = "已选库存: %s - 点击空陈列槽放置" % ItemsDB.get_item_name(item_id)
    _refresh_inventory()

func _on_price_changed(_value: float) -> void:
    pass

func _on_set_price() -> void:
    if _selected_slot < 0:
        return
    var item_id = GameManager.display_items[_selected_slot] if _selected_slot < GameManager.display_items.size() else ""
    if item_id.is_empty():
        return
    var new_price = int(price_spin.value)
    GameManager.item_prices[item_id] = new_price
    _rebuild_stall()
    AudioManager.play_sfx("click")

func _on_phase_changed(new_phase: int) -> void:
    match new_phase:
        GameManager.Phase.SELL:
            visible = true
            _start_sell_phase()
        GameManager.Phase.PURCHASE:
            visible = false
        GameManager.Phase.SETTLEMENT:
            visible = false

func _start_sell_phase() -> void:
    _rebuild_stall()
    _refresh_inventory()
    
    customer_system.generate_customers(GameManager.current_level_id, GameManager.current_day)
    _current_customer = null
    
    var total = customer_system.total_customers()
    progress_label.text = "顾客进度: 0/%d" % total
    _update_hud_customer_count(0, total)
    
    customer_info_label.text = "准备就绪！点击接待按钮开始接待顾客"
    customer_mood_label.text = "🤝"
    
    _sell_timer.start()

func _on_sell_timer() -> void:
    if customer_system.remaining_customers() <= 0:
        return
    if _current_customer == null:
        _spawn_next_customer()

func _spawn_next_customer() -> void:
    _current_customer = customer_system.get_next_customer()
    if _current_customer == null:
        return
    
    var served = customer_system.served_count()
    var total = customer_system.total_customers()
    progress_label.text = "顾客进度: %d/%d" % [served, total]
    _update_hud_customer_count(served, total)
    
    var desired_names: Array = []
    for item_id in _current_customer.desired_items:
        desired_names.append(ItemsDB.get_item_name(item_id))
    var desired_str = "、".join(desired_names) if desired_names.size() > 0 else "随便逛逛"
    
    customer_info_label.text = """
顾客: %s
预算: %d - %d 金币
想买: %s
耐心值: %s
""" % [
        _current_customer.name,
        int(_current_customer.budget * 0.5),
        _current_customer.budget,
        desired_str,
        _repeat_str("❤️", int(ceili(_current_customer.patience * 5)))
    ]
    customer_mood_label.text = "😊"
    AudioManager.play_sfx("customer_arrive")

func _on_serve_customer() -> void:
    if _current_customer == null:
        if customer_system.remaining_customers() > 0:
            _spawn_next_customer()
        else:
            var served = customer_system.served_count()
            var total = customer_system.total_customers()
            if served >= total:
                AudioManager.play_sfx("success")
                _show_sell_summary()
            else:
                AudioManager.play_sfx("error")
        return
    
    var best_item = ""
    var best_prob = 0.0
    
    for i in range(GameManager.display_items.size()):
        var item_id = GameManager.display_items[i]
        if item_id.is_empty():
            continue
        var stock = GameManager.inventory.get(item_id, 0)
        if stock <= 0:
            continue
        var price = GameManager.item_prices.get(item_id, 0)
        var prob = _current_customer.will_buy(item_id, price)
        if prob > best_prob:
            best_prob = prob
            best_item = item_id
    
    if best_item.is_empty():
        customer_mood_label.text = "😕"
        customer_info_label.text += "\n\n顾客没找到想买的..."
        AudioManager.play_sfx("customer_leave")
        _current_customer.happy = false
        _current_customer.served = true
        _current_customer = null
        return
    
    var will_buy = _current_customer.decide_buy(best_item, GameManager.item_prices[best_item])
    
    if will_buy:
        var price = GameManager.item_prices[best_item]
        GameManager.sell_item(best_item)
        customer_mood_label.text = "😄"
        customer_info_label.text = "\n✅ 顾客购买了 %s！花费 %d 金币！" % [ItemsDB.get_item_name(best_item), price]
        AudioManager.play_sfx("sale")
        AudioManager.play_sfx("coin")
        _current_customer.happy = true
    else:
        customer_mood_label.text = "😤"
        var price = GameManager.item_prices[best_item]
        customer_info_label.text = "\n❌ 顾客觉得 %s 的价格(%d)不合适，摇头离开了..." % [ItemsDB.get_item_name(best_item), price]
        AudioManager.play_sfx("error")
        _current_customer.happy = false
    
    _current_customer.served = true
    _current_customer = null
    _rebuild_stall()
    _refresh_inventory()
    
    var served = customer_system.served_count()
    var total = customer_system.total_customers()
    progress_label.text = "顾客进度: %d/%d" % [served, total]
    _update_hud_customer_count(served, total)

func _show_sell_summary() -> void:
    var served = customer_system.served_count()
    var happy = customer_system.happy_count()
    var rate = int(customer_system.get_satisfaction_rate() * 100)
    customer_mood_label.text = "🎉"
    customer_info_label.text = """
今日营业结束！

服务顾客: %d 人
满意顾客: %d 人
满意度: %d%%

请点击 [下一阶段] 查看结算报告
""" % [served, happy, rate]

func _update_hud_customer_count(served: int, total: int) -> void:
    var hud = get_tree().root.get_node_or_null("*GameHUD")
    if hud and hud.has_method("_update_customer_label"):
        hud._update_customer_label(served, total)

func get_advice_data() -> Dictionary:
    return {
        "level_id": GameManager.current_level_id,
        "money": GameManager.money,
        "display_items": GameManager.display_items,
        "item_prices": GameManager.item_prices,
        "inventory": GameManager.inventory
    }
