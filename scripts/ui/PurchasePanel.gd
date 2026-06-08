extends Control

@onready var items_list: VBoxContainer
@onready var inventory_panel: PanelContainer
@onready var inventory_list: GridContainer
@onready var selected_item_label: Label
@onready var selected_item_info: Label
@onready var purchase_count_spin: SpinBox
@onready var purchase_button: Button
@onready var total_cost_label: Label
@onready var phase_indicator: ColorRect

var _available_items: Array = []
var _selected_item_id: String = ""
var _selected_count: int = 1
var customer_system = null
var tutorial_advice = null

func _ready() -> void:
    if not _is_children_ready():
        _build_ui()
    
    customer_system = CustomerSystem.new()
    tutorial_advice = TutorialAdvice.new()
    
    _connect_signals()
    _load_available_items()
    
    EventBus.on_event("money_changed", func(_a, _t): _update_purchase_button())
    EventBus.on_event("inventory_changed", func(_i, _c): _refresh_inventory())
    EventBus.on_event("phase_changed", _on_phase_changed)

func _is_children_ready() -> bool:
    return items_list != null and inventory_list != null

func _build_ui() -> void:
    phase_indicator = ColorRect.new()
    phase_indicator.color = Color(1, 0.85, 0.5, 0.08)
    phase_indicator.anchor_right = 1.0
    phase_indicator.anchor_bottom = 1.0
    phase_indicator.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(phase_indicator)
    
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
    
    var shop_panel = PanelContainer.new()
    shop_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    shop_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
    main_hbox.add_child(shop_panel)
    
    var shop_style = StyleBoxFlat.new()
    shop_style.bg_color = Color(0.15, 0.1, 0.05, 0.85)
    shop_style.corner_radius_top_left = 12
    shop_style.corner_radius_top_right = 12
    shop_style.corner_radius_bottom_left = 12
    shop_style.corner_radius_bottom_right = 12
    shop_style.content_margin_left = 16
    shop_style.content_margin_right = 16
    shop_style.content_margin_top = 12
    shop_style.content_margin_bottom = 12
    shop_panel.add_theme_stylebox_override("panel", shop_style)
    
    var shop_vbox = VBoxContainer.new()
    shop_vbox.add_theme_constant_override("separation", 10)
    shop_vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
    shop_panel.add_child(shop_vbox)
    
    var shop_title = Label.new()
    shop_title.text = "🏬 批发商采购"
    shop_title.add_theme_font_size_override("font_size", 22)
    shop_title.modulate = Color(1, 0.9, 0.7)
    shop_vbox.add_child(shop_title)
    
    var shop_sep = HSeparator.new()
    shop_vbox.add_child(shop_sep)
    
    var scroll = ScrollContainer.new()
    scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
    scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    shop_vbox.add_child(scroll)
    
    items_list = VBoxContainer.new()
    items_list.add_theme_constant_override("separation", 8)
    items_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    scroll.add_child(items_list)
    
    var detail_panel = VBoxContainer.new()
    detail_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    detail_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
    detail_panel.add_theme_constant_override("separation", 15)
    main_hbox.add_child(detail_panel)
    
    var selected_panel = PanelContainer.new()
    selected_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    detail_panel.add_child(selected_panel)
    
    var sel_style = StyleBoxFlat.new()
    sel_style.bg_color = Color(0.05, 0.1, 0.15, 0.9)
    sel_style.corner_radius_top_left = 12
    sel_style.corner_radius_top_right = 12
    sel_style.corner_radius_bottom_left = 12
    sel_style.corner_radius_bottom_right = 12
    sel_style.content_margin_left = 16
    sel_style.content_margin_right = 16
    sel_style.content_margin_top = 12
    sel_style.content_margin_bottom = 12
    selected_panel.add_theme_stylebox_override("panel", sel_style)
    
    var sel_vbox = VBoxContainer.new()
    sel_vbox.add_theme_constant_override("separation", 10)
    selected_panel.add_child(sel_vbox)
    
    var sel_title = Label.new()
    sel_title.text = "🛒 商品详情"
    sel_title.add_theme_font_size_override("font_size", 20)
    sel_title.modulate = Color(0.8, 0.9, 1)
    sel_vbox.add_child(sel_title)
    
    selected_item_label = Label.new()
    selected_item_label.text = "请选择商品"
    selected_item_label.add_theme_font_size_override("font_size", 24)
    selected_item_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    sel_vbox.add_child(selected_item_label)
    
    selected_item_info = Label.new()
    selected_item_info.text = "从左侧列表选择想要采购的商品"
    selected_item_info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    selected_item_info.modulate = Color(0.8, 0.8, 0.8)
    selected_item_info.custom_minimum_size = Vector2(0, 60)
    sel_vbox.add_child(selected_item_info)
    
    var count_row = HBoxContainer.new()
    count_row.add_theme_constant_override("separation", 10)
    sel_vbox.add_child(count_row)
    
    var count_label = Label.new()
    count_label.text = "采购数量:"
    count_label.custom_minimum_size = Vector2(100, 0)
    count_row.add_child(count_label)
    
    purchase_count_spin = SpinBox.new()
    purchase_count_spin.min_value = 1
    purchase_count_spin.max_value = 99
    purchase_count_spin.value = 1
    purchase_count_spin.custom_minimum_size = Vector2(100, 40)
    purchase_count_spin.add_theme_font_size_override("font_size", 16)
    count_row.add_child(purchase_count_spin)
    
    var cost_row = HBoxContainer.new()
    cost_row.add_theme_constant_override("separation", 10)
    sel_vbox.add_child(cost_row)
    
    var cost_text = Label.new()
    cost_text.text = "总计:"
    cost_text.custom_minimum_size = Vector2(100, 0)
    cost_row.add_child(cost_text)
    
    total_cost_label = Label.new()
    total_cost_label.text = "0 金币"
    total_cost_label.add_theme_font_size_override("font_size", 18)
    total_cost_label.modulate = Color(1, 0.85, 0.3)
    cost_row.add_child(total_cost_label)
    
    purchase_button = Button.new()
    purchase_button.text = "💰 采购"
    purchase_button.custom_minimum_size = Vector2(0, 50)
    purchase_button.add_theme_font_size_override("font_size", 18)
    purchase_button.disabled = true
    
    var buy_style = StyleBoxFlat.new()
    buy_style.bg_color = Color(0.3, 0.7, 0.4)
    buy_style.corner_radius_top_left = 8
    buy_style.corner_radius_top_right = 8
    buy_style.corner_radius_bottom_left = 8
    buy_style.corner_radius_bottom_right = 8
    purchase_button.add_theme_stylebox_override("normal", buy_style)
    var buy_hover = buy_style.duplicate()
    buy_hover.bg_color = Color(0.4, 0.8, 0.5)
    purchase_button.add_theme_stylebox_override("hover", buy_hover)
    
    sel_vbox.add_child(purchase_button)
    
    inventory_panel = PanelContainer.new()
    inventory_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    inventory_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
    detail_panel.add_child(inventory_panel)
    
    var inv_style = StyleBoxFlat.new()
    inv_style.bg_color = Color(0.1, 0.08, 0.12, 0.9)
    inv_style.corner_radius_top_left = 12
    inv_style.corner_radius_top_right = 12
    inv_style.corner_radius_bottom_left = 12
    inv_style.corner_radius_bottom_right = 12
    inv_style.content_margin_left = 16
    inv_style.content_margin_right = 16
    inv_style.content_margin_top = 12
    inv_style.content_margin_bottom = 12
    inventory_panel.add_theme_stylebox_override("panel", inv_style)
    
    var inv_vbox = VBoxContainer.new()
    inv_vbox.add_theme_constant_override("separation", 10)
    inv_vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
    inventory_panel.add_child(inv_vbox)
    
    var inv_title = Label.new()
    inv_title.text = "📦 我的库存"
    inv_title.add_theme_font_size_override("font_size", 20)
    inv_title.modulate = Color(0.9, 0.8, 1)
    inv_vbox.add_child(inv_title)
    
    inventory_list = GridContainer.new()
    inventory_list.columns = 4
    inventory_list.add_theme_constant_override("h_separation", 8)
    inventory_list.add_theme_constant_override("v_separation", 8)
    inventory_list.size_flags_vertical = Control.SIZE_EXPAND_FILL
    inv_vbox.add_child(inventory_list)

func _connect_signals() -> void:
    purchase_button.pressed.connect(_on_purchase_pressed)
    purchase_count_spin.value_changed.connect(_on_count_changed)

func _load_available_items() -> void:
    _available_items = LevelConfig.get_available_items(GameManager.current_level_id)
    for child in items_list.get_children():
        child.queue_free()
    
    for item_id in _available_items:
        var item_data = GameAssets.get_item_data(item_id)
        var card = _create_item_card(item_id, item_data)
        items_list.add_child(card)
    
    _refresh_inventory()

func _create_item_card(item_id: String, item_data: Dictionary) -> PanelContainer:
    var card = PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 70)
    card.mouse_filter = Control.MOUSE_FILTER_STOP
    
    var is_selected = _selected_item_id == item_id
    var card_style = StyleBoxFlat.new()
    card_style.bg_color = Color(0.2, 0.25, 0.15) if not is_selected else Color(0.3, 0.5, 0.8)
    card_style.corner_radius_top_left = 8
    card_style.corner_radius_top_right = 8
    card_style.corner_radius_bottom_left = 8
    card_style.corner_radius_bottom_right = 8
    card_style.content_margin_left = 12
    card_style.content_margin_right = 12
    card_style.content_margin_top = 8
    card_style.content_margin_bottom = 8
    card.add_theme_stylebox_override("panel", card_style)
    
    var hbox = HBoxContainer.new()
    hbox.add_theme_constant_override("separation", 12)
    hbox.alignment = BoxContainer.ALIGNMENT_CENTER_BEGIN
    card.add_child(hbox)
    
    var icon = TextureRect.new()
    icon.texture = GameAssets.get_item_texture(item_id)
    icon.custom_minimum_size = Vector2(48, 48)
    icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
    hbox.add_child(icon)
    
    var info_vbox = VBoxContainer.new()
    info_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    hbox.add_child(info_vbox)
    
    var name = Label.new()
    name.text = item_data.get("name", item_id)
    name.add_theme_font_size_override("font_size", 16)
    info_vbox.add_child(name)
    
    var price = Label.new()
    var cost = item_data.get("cost_price", 10)
    var rec = LevelConfig.get_recommended_price(item_id)
    price.text = "进价: %d 💰  |  建议售价: %d 💰" % [cost, rec]
    price.modulate = Color(0.8, 0.8, 0.6)
    price.add_theme_font_size_override("font_size", 12)
    info_vbox.add_child(price)
    
    card.gui_input.connect(func(event):
        if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
            _select_item(item_id)
    )
    
    return card

func _select_item(item_id: String) -> void:
    _selected_item_id = item_id
    _selected_count = 1
    purchase_count_spin.value = 1
    
    var item_data = GameAssets.get_item_data(item_id)
    selected_item_label.text = item_data.get("name", item_id)
    selected_item_info.text = """
描述: %s
进价: %d 金币
建议售价: %d 金币
种类: %s
库存: %d 件
""" % [
        item_data.get("description", ""),
        item_data.get("cost_price", 10),
        LevelConfig.get_recommended_price(item_id),
        item_data.get("category", "-"),
        GameManager.inventory.get(item_id, 0)
    ]
    
    _update_total_cost()
    _update_purchase_button()
    _refresh_items_list()
    AudioManager.play_sfx("click")

func _refresh_items_list() -> void:
    for child in items_list.get_children():
        child.queue_free()
    _load_available_items()

func _on_count_changed(value: float) -> void:
    _selected_count = int(value)
    _update_total_cost()

func _update_total_cost() -> void:
    if _selected_item_id.is_empty():
        total_cost_label.text = "0 金币"
        return
    var item_data = GameAssets.get_item_data(_selected_item_id)
    var total = item_data.get("cost_price", 0) * _selected_count
    total_cost_label.text = "%d 金币" % total
    if total > GameManager.money:
        total_cost_label.modulate = Color(1, 0.3, 0.3)
    else:
        total_cost_label.modulate = Color(1, 0.85, 0.3)

func _update_purchase_button() -> void:
    if _selected_item_id.is_empty():
        purchase_button.disabled = true
        purchase_button.text = "💰 采购"
        return
    var item_data = GameAssets.get_item_data(_selected_item_id)
    var total = item_data.get("cost_price", 0) * _selected_count
    purchase_button.disabled = total > GameManager.money
    if purchase_button.disabled:
        purchase_button.text = "❌ 金币不足"
    else:
        purchase_button.text = "💰 采购 x%d  (%d金)" % [_selected_count, total]

func _on_purchase_pressed() -> void:
    if _selected_item_id.is_empty():
        return
    var item_data = GameAssets.get_item_data(_selected_item_id)
    var total = item_data.get("cost_price", 0) * _selected_count
    if GameManager.purchase_item(_selected_item_id, _selected_count):
        _update_purchase_button()
        _select_item(_selected_item_id)
    else:
        AudioManager.play_sfx("error")

func _refresh_inventory() -> void:
    for child in inventory_list.get_children():
        child.queue_free()
    
    for item_id in GameManager.inventory.keys():
        var count = GameManager.inventory[item_id]
        if count <= 0:
            continue
        
        var slot = PanelContainer.new()
        slot.custom_minimum_size = Vector2(80, 90)
        var slot_style = StyleBoxFlat.new()
        slot_style.bg_color = Color(0.25, 0.2, 0.3)
        slot_style.corner_radius_top_left = 6
        slot_style.corner_radius_top_right = 6
        slot_style.corner_radius_bottom_left = 6
        slot_style.corner_radius_bottom_right = 6
        slot_style.content_margin_left = 4
        slot_style.content_margin_right = 4
        slot_style.content_margin_top = 4
        slot_style.content_margin_bottom = 4
        slot.add_theme_stylebox_override("panel", slot_style)
        
        var vbox = VBoxContainer.new()
        vbox.alignment = BoxContainer.ALIGNMENT_CENTER
        slot.add_child(vbox)
        
        var icon = TextureRect.new()
        icon.texture = GameAssets.get_item_texture(item_id)
        icon.custom_minimum_size = Vector2(40, 40)
        icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
        vbox.add_child(icon)
        
        var count_lbl = Label.new()
        count_lbl.text = "x%d" % count
        count_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        count_lbl.add_theme_font_size_override("font_size", 12)
        count_lbl.modulate = Color(1, 0.9, 0.5)
        vbox.add_child(count_lbl)
        
        inventory_list.add_child(slot)

func _on_phase_changed(new_phase) -> void:
    if new_phase == GameManager.Phase.PURCHASE:
        visible = true
    else:
        visible = false

func get_advice_for_phase() -> Dictionary:
    var data = {
        "level_id": GameManager.current_level_id,
        "money": GameManager.money,
        "inventory": GameManager.inventory,
        "display_items": GameManager.display_items,
        "item_prices": GameManager.item_prices
    }
    return tutorial_advice.generate_advice(GameManager.current_phase, data)
