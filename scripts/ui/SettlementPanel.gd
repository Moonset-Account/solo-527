class_name SettlementPanel
extends Control

var day_title_label: Label
var start_money_label: Label
var purchase_cost_label: Label
var sales_revenue_label: Label
var profit_label: Label
var end_money_label: Label
var customers_label: Label
var items_sold_list: VBoxContainer
var rating_label: Label
var continue_button: Button
var trend_label: Label
var advice_text: RichTextLabel

var tutorial_advice = null

func _repeat_str(s: String, n: int) -> String:
    var result: String = ""
    for i in range(max(0, n)):
        result += s
    return result

func _ready() -> void:
    tutorial_advice = load("res://scripts/game/TutorialAdvice.gd").new()
    
    if not _is_children_ready():
        _build_ui()
    
    _connect_signals()
    EventBus.on_event("day_ended", _on_day_ended)
    visible = false

func _is_children_ready() -> bool:
    return day_title_label != null and continue_button != null

func _build_ui() -> void:
    var bg = ColorRect.new()
    bg.color = Color(0, 0, 0, 0.6)
    bg.anchor_right = 1.0
    bg.anchor_bottom = 1.0
    bg.mouse_filter = Control.MOUSE_FILTER_STOP
    add_child(bg)
    
    var center = VBoxContainer.new()
    center.anchor_left = 0.5
    center.anchor_top = 0.5
    center.anchor_right = 0.5
    center.anchor_bottom = 0.5
    center.offset_left = -350
    center.offset_right = 350
    center.offset_top = -280
    center.offset_bottom = 280
    center.add_theme_constant_override("separation", 12)
    add_child(center)
    
    day_title_label = Label.new()
    day_title_label.text = "📊 第 1 天结算"
    day_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    day_title_label.add_theme_font_size_override("font_size", 32)
    day_title_label.modulate = Color(1, 0.95, 0.7)
    center.add_child(day_title_label)
    
    var main_panel = PanelContainer.new()
    main_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    main_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
    center.add_child(main_panel)
    
    var main_style = StyleBoxFlat.new()
    main_style.bg_color = Color(0.12, 0.1, 0.15, 0.95)
    main_style.corner_radius_top_left = 16
    main_style.corner_radius_top_right = 16
    main_style.corner_radius_bottom_left = 16
    main_style.corner_radius_bottom_right = 16
    main_style.content_margin_left = 24
    main_style.content_margin_right = 24
    main_style.content_margin_top = 20
    main_style.content_margin_bottom = 20
    main_panel.add_theme_stylebox_override("panel", main_style)
    
    var main_vbox = VBoxContainer.new()
    main_vbox.add_theme_constant_override("separation", 14)
    main_panel.add_child(main_vbox)
    
    var rating_row = HBoxContainer.new()
    rating_row.alignment = BoxContainer.ALIGNMENT_CENTER
    main_vbox.add_child(rating_row)
    
    rating_label = Label.new()
    rating_label.text = "⭐⭐⭐"
    rating_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    rating_label.add_theme_font_size_override("font_size", 36)
    rating_row.add_child(rating_label)
    
    var sep1 = HSeparator.new()
    main_vbox.add_child(sep1)
    
    var money_grid = GridContainer.new()
    money_grid.columns = 2
    money_grid.add_theme_constant_override("h_separation", 40)
    money_grid.add_theme_constant_override("v_separation", 10)
    main_vbox.add_child(money_grid)
    
    start_money_label = _add_report_row(money_grid, "💰 起始资金", "0", Color(0.9, 0.9, 0.9))
    purchase_cost_label = _add_report_row(money_grid, "🛒 采购成本", "-0", Color(1, 0.4, 0.4))
    sales_revenue_label = _add_report_row(money_grid, "💵 销售收入", "+0", Color(0.4, 1, 0.5))
    customers_label = _add_report_row(money_grid, "👥 服务顾客", "0 人", Color(0.8, 0.8, 1))
    end_money_label = _add_report_row(money_grid, "🏦 剩余资金", "0", Color(1, 0.9, 0.6))
    profit_label = _add_report_row(money_grid, "📈 今日利润", "0", Color(1, 1, 0.5))
    
    var sep2 = HSeparator.new()
    main_vbox.add_child(sep2)
    
    var sold_title = Label.new()
    sold_title.text = "📦 售出明细"
    sold_title.add_theme_font_size_override("font_size", 16)
    sold_title.modulate = Color(0.85, 0.9, 1)
    main_vbox.add_child(sold_title)
    
    var sold_scroll = ScrollContainer.new()
    sold_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    sold_scroll.custom_minimum_size = Vector2(0, 80)
    main_vbox.add_child(sold_scroll)
    
    items_sold_list = VBoxContainer.new()
    items_sold_list.add_theme_constant_override("separation", 4)
    items_sold_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    sold_scroll.add_child(items_sold_list)
    
    var sep3 = HSeparator.new()
    main_vbox.add_child(sep3)
    
    trend_label = Label.new()
    trend_label.text = ""
    trend_label.add_theme_font_size_override("font_size", 13)
    trend_label.modulate = Color(0.7, 0.8, 0.9)
    main_vbox.add_child(trend_label)
    
    advice_text = RichTextLabel.new()
    advice_text.bbcode_enabled = true
    advice_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
    advice_text.custom_minimum_size = Vector2(0, 60)
    advice_text.add_theme_font_size_override("normal_font_size", 13)
    main_vbox.add_child(advice_text)
    
    continue_button = Button.new()
    continue_button.text = "▶️ 继续"
    continue_button.custom_minimum_size = Vector2(0, 55)
    continue_button.add_theme_font_size_override("font_size", 20)
    
    var btn_style = StyleBoxFlat.new()
    btn_style.bg_color = Color(0.3, 0.7, 0.45)
    btn_style.corner_radius_top_left = 10
    btn_style.corner_radius_top_right = 10
    btn_style.corner_radius_bottom_left = 10
    btn_style.corner_radius_bottom_right = 10
    continue_button.add_theme_stylebox_override("normal", btn_style)
    var btn_hover = btn_style.duplicate()
    btn_hover.bg_color = Color(0.4, 0.85, 0.55)
    continue_button.add_theme_stylebox_override("hover", btn_hover)
    
    center.add_child(continue_button)

func _add_report_row(grid: GridContainer, label_text: String, value_text: String, value_color: Color) -> Label:
    var lbl = Label.new()
    lbl.text = label_text + ":"
    lbl.add_theme_font_size_override("font_size", 15)
    lbl.modulate = Color(0.75, 0.75, 0.75)
    grid.add_child(lbl)
    
    var val = Label.new()
    val.text = value_text
    val.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    val.add_theme_font_size_override("font_size", 15)
    val.modulate = value_color
    grid.add_child(val)
    return val

func _connect_signals() -> void:
    continue_button.pressed.connect(_on_continue_pressed)

func _on_day_ended(day_number: int, report: Dictionary) -> void:
    visible = true
    AudioManager.play_sfx("success")
    
    day_title_label.text = "📊 第 %d 天结算报告" % day_number
    
    start_money_label.text = "%d 金币" % report.get("start_money", 0)
    
    var cost = report.get("purchase_cost", 0)
    purchase_cost_label.text = "-%d 金币" % cost
    
    var revenue = report.get("sales_revenue", 0)
    sales_revenue_label.text = "+%d 金币" % revenue
    
    customers_label.text = "%d 人" % report.get("customers_served", 0)
    
    end_money_label.text = "%d 金币" % report.get("end_money", 0)
    
    var profit = report.get("profit", 0)
    if profit >= 0:
        profit_label.text = "+%d 金币 📈" % profit
        profit_label.modulate = Color(0.4, 1, 0.5)
    else:
        profit_label.text = "%d 金币 📉" % profit
        profit_label.modulate = Color(1, 0.4, 0.4)
    
    var stars = 0
    var level = LevelConfig.get_level(GameManager.current_level_id)
    var daily_target = level.get("target_money", 1000) / max(1, level.get("days", 5))
    if profit >= daily_target * 0.5:
        stars = 1
    if profit >= daily_target:
        stars = 2
    if profit >= daily_target * 1.5:
        stars = 3
    rating_label.text = _repeat_str("⭐", stars) + _repeat_str("☆", 3 - stars)
    
    _populate_sold_items(report.get("items_sold", {}))
    
    var trending = tutorial_advice.get_trending_items_for_level(GameManager.current_level_id)
    if trending.size() > 0:
        var names: Array = []
        for t in trending:
            names.append(ItemsDB.get_item_name(t))
        trend_label.text = "📊 明日热门预测: " + "、".join(names)
    
    var advice = tutorial_advice.generate_advice(GameManager.Phase.SETTLEMENT, {"report": report, "money": GameManager.money})
    if not advice.is_empty():
        var colors = {
            "info": "#6EB5FF",
            "tip": "#7BED9F",
            "warning": "#FFD700",
            "error": "#FF6B6B",
            "success": "#7BED9F"
        }
        var c = colors.get(advice.get("type", "info"), "#FFFFFF")
        advice_text.bbcode_text = "[color=%s][b]【%s】[/b] %s[/color]" % [c, advice.get("title", "建议"), advice.get("content", "")]
    
    var is_last = GameManager.current_day >= GameManager.max_days
    if is_last:
        var total_stars = 0
        var target = level.get("target_money", 1000)
        if GameManager.money >= target * 0.5: total_stars = 1
        if GameManager.money >= target: total_stars = 2
        if GameManager.money >= target * 1.5: total_stars = 3
        continue_button.text = "🎉 完成关卡（总评: %s）" % (_repeat_str("⭐", total_stars) + _repeat_str("☆", 3 - total_stars))
    else:
        continue_button.text = "▶️ 进入第 %d 天" % (day_number + 1)

func _populate_sold_items(items: Dictionary) -> void:
    for child in items_sold_list.get_children():
        child.queue_free()
    
    if items.size() == 0:
        var empty = Label.new()
        empty.text = "  今天没有售出任何商品..."
        empty.modulate = Color(0.6, 0.6, 0.6)
        items_sold_list.add_child(empty)
        return
    
    var total_revenue = 0
    var sorted_items: Array = []
    for item_id in items.keys():
        var count = items[item_id]
        var item_data = GameAssets.get_item_data(item_id)
        var unit_price = GameManager.item_prices.get(item_id, item_data.get("cost_price", 10) * 2)
        var revenue = count * unit_price
        total_revenue += revenue
        sorted_items.append({"id": item_id, "count": count, "revenue": revenue, "price": unit_price})
    sorted_items.sort_custom(func(a, b): return a["revenue"] > b["revenue"])
    
    for entry in sorted_items:
        var row = HBoxContainer.new()
        row.add_theme_constant_override("separation", 10)
        row.custom_minimum_size = Vector2(0, 28)
        
        var item_data = GameAssets.get_item_data(entry["id"])
        var cost = item_data.get("cost_price", 10)
        var profit_per = entry["price"] - cost
        
        var icon = TextureRect.new()
        icon.texture = GameAssets.get_item_texture(entry["id"])
        icon.custom_minimum_size = Vector2(24, 24)
        icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
        row.add_child(icon)
        
        var name_lbl = Label.new()
        name_lbl.text = item_data.get("name", entry["id"])
        name_lbl.custom_minimum_size = Vector2(90, 0)
        row.add_child(name_lbl)
        
        var count_lbl = Label.new()
        count_lbl.text = "x%d" % entry["count"]
        count_lbl.modulate = Color(1, 0.9, 0.5)
        count_lbl.custom_minimum_size = Vector2(50, 0)
        row.add_child(count_lbl)
        
        var revenue_lbl = Label.new()
        revenue_lbl.text = "+%d💰" % entry["revenue"]
        revenue_lbl.modulate = Color(0.5, 1, 0.6)
        revenue_lbl.custom_minimum_size = Vector2(80, 0)
        revenue_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
        row.add_child(revenue_lbl)
        
        var profit_lbl = Label.new()
        profit_lbl.text = "(利+%d💰)" % (profit_per * entry["count"])
        profit_lbl.modulate = Color(0.7, 1, 0.8) if profit_per > 0 else Color(1, 0.7, 0.7)
        profit_lbl.add_theme_font_size_override("font_size", 11)
        row.add_child(profit_lbl)
        
        items_sold_list.add_child(row)
    
    var total_row = HBoxContainer.new()
    total_row.custom_minimum_size = Vector2(0, 30)
    total_row.add_theme_constant_override("separation", 10)
    
    var spacer = Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    spacer.custom_minimum_size = Vector2(180, 0)
    total_row.add_child(spacer)
    
    var total_lbl = Label.new()
    total_lbl.text = "合计:"
    total_lbl.modulate = Color(0.8, 0.8, 0.8)
    total_row.add_child(total_lbl)
    
    var total_rev_lbl = Label.new()
    total_rev_lbl.text = "+%d💰" % total_revenue
    total_rev_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    total_rev_lbl.custom_minimum_size = Vector2(80, 0)
    total_rev_lbl.add_theme_font_size_override("font_size", 14)
    total_rev_lbl.modulate = Color(0.4, 1, 0.6)
    total_row.add_child(total_rev_lbl)
    
    var sep = HSeparator.new()
    sep.custom_minimum_size = Vector2(0, 10)
    items_sold_list.add_child(sep)
    items_sold_list.add_child(total_row)

func _on_continue_pressed() -> void:
    AudioManager.play_sfx("click")
    visible = false
    GameManager.continue_after_settlement()
