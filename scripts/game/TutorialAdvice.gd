extends Node

var current_tutorial_step: int = 0
var tutorial_completed: bool = false
var advice_queue: Array = []
var current_advice: Dictionary = {}

const TUTORIAL_STEPS: Array = [
    {
        "id": "welcome",
        "title": "欢迎来到小镇集市！",
        "content": "你将经营一个集市摊位，白天采购商品，晚上销售给顾客。目标是在限定天数内赚取足够的金币！",
        "focus": "main_menu",
        "can_skip": true
    },
    {
        "id": "purchase_phase",
        "title": "白天：采购阶段",
        "content": "现在是采购时间！从左侧列表选择商品，点击购买按钮将其加入库存。注意查看成本价，不要把钱花光哦！",
        "focus": "purchase_panel",
        "can_skip": true
    },
    {
        "id": "set_display",
        "title": "陈列与定价",
        "content": "把商品拖到摊位的陈列槽中，然后设置售价。建议售价约为成本价的2-2.5倍，但要根据顾客喜好调整！",
        "focus": "stall_display",
        "can_skip": true
    },
    {
        "id": "sell_phase",
        "title": "夜晚：销售阶段",
        "content": "顾客会陆续来到摊位前。如果他们喜欢你的商品和价格就会购买！多观察顾客反应，调整价格策略。",
        "focus": "customer_area",
        "can_skip": true
    },
    {
        "id": "settlement",
        "title": "每日结算",
        "content": "每天结束后会显示结算报告，包括采购成本、销售收入和利润。根据这些数据优化你的经营策略！",
        "focus": "settlement_panel",
        "can_skip": true
    },
    {
        "id": "upgrade",
        "title": "摊位升级",
        "content": "攒够金币后可以升级摊位，增加陈列槽位和顾客吸引力。合理安排升级时机很重要！",
        "focus": "upgrade_button",
        "can_skip": true
    },
    {
        "id": "done",
        "title": "开始经营吧！",
        "content": "你已经掌握了基础经营技巧。记住：关注顾客偏好、合理定价、控制成本，祝你生意兴隆！",
        "focus": "none",
        "can_skip": true
    }
]

func _ready() -> void:
    reset_tutorial()

func reset_tutorial() -> void:
    current_tutorial_step = 0
    tutorial_completed = false
    advice_queue.clear()
    current_advice = {}

func get_current_step() -> Dictionary:
    if current_tutorial_step < TUTORIAL_STEPS.size():
        return TUTORIAL_STEPS[current_tutorial_step]
    return {}

func next_step() -> void:
    if current_tutorial_step < TUTORIAL_STEPS.size() - 1:
        current_tutorial_step += 1
        EventBus.emit_event("tutorial_step_changed", get_current_step().get("id", ""))
    else:
        complete_tutorial()

func complete_tutorial() -> void:
    tutorial_completed = true
    UIState.end_tutorial()

func is_complete() -> bool:
    return tutorial_completed or SaveManager.tutorial_skipped

func should_show() -> bool:
    if SaveManager.settings.get("show_hints", true) == false:
        return false
    return not tutorial_completed and not SaveManager.tutorial_skipped

func get_total_steps() -> int:
    return TUTORIAL_STEPS.size()

func get_progress() -> float:
    return float(current_tutorial_step) / float(max(1, TUTORIAL_STEPS.size()))

func generate_advice(phase: int, game_data: Dictionary) -> Dictionary:
    var advice_list: Array = []
    
    match phase:
        GameManager.Phase.PURCHASE:
            advice_list = _generate_purchase_advice(game_data)
        GameManager.Phase.SELL:
            advice_list = _generate_sell_advice(game_data)
        GameManager.Phase.SETTLEMENT:
            advice_list = _generate_settlement_advice(game_data)
    
    if advice_list.size() > 0:
        return advice_list[randi() % advice_list.size()]
    return {}

func _generate_purchase_advice(data: Dictionary) -> Array:
    var result: Array = []
    var level_id = data.get("level_id", "")
    var money = data.get("money", 0)
    var trending = get_trending_items_for_level(level_id)
    
    if trending.size() > 0:
        var item_name = ItemsDB.get_item_name(trending[0])
        result.append({
            "title": "热门商品",
            "content": "今天顾客特别喜欢%s，可以多采购一些！" % item_name,
            "type": "info",
            "can_skip": true
        })
    
    if money < 100:
        result.append({
            "title": "资金紧张",
            "content": "你的金币不多了，建议只采购必需品，优先保证有货可卖。",
            "type": "warning",
            "can_skip": true
        })
    
    if trending.size() > 1:
        var item1 = ItemsDB.get_item_name(trending[0])
        var item2 = ItemsDB.get_item_name(trending[1])
        result.append({
            "title": "采购建议",
            "content": "今天可以多进%s和%s，这两种最受欢迎。" % [item1, item2],
            "type": "tip",
            "can_skip": true
        })
    
    result.append({
        "title": "成本控制",
        "content": "记住采购价，售价至少要是成本的1.5倍才能盈利哦。",
        "type": "tip",
        "can_skip": true
    })
    
    return result

func _generate_sell_advice(data: Dictionary) -> Array:
    var result: Array = []
    var display_items = data.get("display_items", [])
    var item_prices = data.get("item_prices", {})
    
    if display_items.size() == 0:
        result.append({
            "title": "摊位空空",
            "content": "你还没有陈列任何商品！快把库存里的商品摆上摊位吧。",
            "type": "warning",
            "can_skip": true
        })
    
    for item_id in display_items:
        if item_id.is_empty():
            continue
        var price = item_prices.get(item_id, 0)
        var recommended = LevelConfig.get_recommended_price(item_id)
        var item_name = ItemsDB.get_item_name(item_id)
        
        if price > recommended * 3:
            result.append({
                "title": "定价过高",
                "content": "%s的定价可能太高了，顾客可能不会买。" % item_name,
                "type": "warning",
                "can_skip": true
            })
        elif price < recommended * 0.8:
            result.append({
                "title": "定价偏低",
                "content": "%s可以提高售价来增加利润。" % item_name,
                "type": "tip",
                "can_skip": true
            })
    
    result.append({
        "title": "观察顾客",
        "content": "如果顾客摇头离开，说明你的价格太高或者商品不对胃口。",
        "type": "info",
        "can_skip": true
    })
    
    return result

func _generate_settlement_advice(data: Dictionary) -> Array:
    var result: Array = []
    var report = data.get("report", {})
    var profit = report.get("profit", 0)
    var sales = report.get("sales_revenue", 0)
    var cost = report.get("purchase_cost", 0)
    
    if profit <= 0:
        result.append({
            "title": "亏损警告",
            "content": "今天没有盈利！检查采购成本和定价策略，确保售价高于成本价。",
            "type": "error",
            "can_skip": true
        })
    elif profit > cost:
        result.append({
            "title": "经营有道",
            "content": "今天利润不错！继续保持这个节奏，考虑升级摊位扩大规模。",
            "type": "success",
            "can_skip": true
        })
    
    if sales == 0:
        result.append({
            "title": "零销售",
            "content": "今天一件商品都没卖掉。检查陈列的商品和定价，尝试降低价格。",
            "type": "warning",
            "can_skip": true
        })
    
    var items_sold = report.get("items_sold", {})
    if items_sold.size() > 0:
        var best_item = ""
        var best_count = 0
        for item_id in items_sold.keys():
            if items_sold[item_id] > best_count:
                best_count = items_sold[item_id]
                best_item = item_id
        if not best_item.is_empty():
            var item_name = ItemsDB.get_item_name(best_item)
            result.append({
                "title": "畅销分析",
                "content": "今天%s卖得最好，可以考虑明天多采购。" % item_name,
                "type": "info",
                "can_skip": true
            })
    
    return result

func get_trending_items_for_level(level_id: String) -> Array:
    var prefs = LevelConfig.get_customer_preferences(level_id)
    var items: Array = []
    for item_id in prefs.keys():
        items.append({"item": item_id, "pref": prefs[item_id]})
    items.sort_custom(func(a, b): return a["pref"] > b["pref"])
    var result: Array = []
    for i in range(min(3, items.size())):
        result.append(items[i]["item"])
    return result

func queue_advice(advice: Dictionary) -> void:
    if advice.is_empty():
        return
    advice_queue.append(advice)

func get_next_advice() -> Dictionary:
    if advice_queue.size() > 0:
        current_advice = advice_queue.pop_front()
        return current_advice
    return {}

func has_pending_advice() -> bool:
    return advice_queue.size() > 0
