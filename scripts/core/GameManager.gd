extends Node

enum GameState { MAIN_MENU, LEVEL_SELECT, PLAYING, PAUSED, SETTLEMENT, SETTINGS }
enum Phase { PURCHASE, SELL, SETTLEMENT }

var current_state: GameState = GameState.MAIN_MENU
var current_phase: Phase = Phase.PURCHASE
var current_level_id: String = ""
var current_day: int = 1
var max_days: int = 5
var money: int = 500
var total_earned: int = 0
var total_customers_served: int = 0

var stall_level: int = 1
var display_slots: int = 4
var customer_multiplier: float = 1.0

var inventory: Dictionary = {}
var display_items: Array = []
var item_prices: Dictionary = {}

var daily_report: Dictionary = {
    "start_money": 0,
    "purchase_cost": 0,
    "sales_revenue": 0,
    "customers_served": 0,
    "items_sold": {},
    "end_money": 0,
    "profit": 0
}

func _ready() -> void:
    print("[GameManager] 初始化完成")
    EventBus.on_event("inventory_changed", _on_inventory_changed)
    EventBus.on_event("money_changed", _on_money_changed)

func start_new_game(level_id: String) -> void:
    var level = LevelConfig.get_level(level_id)
    if level.is_empty():
        push_warning("关卡不存在: " + level_id)
        return
    
    current_level_id = level_id
    current_day = 1
    max_days = level.get("days", 5)
    money = level.get("start_money", 500)
    total_earned = 0
    total_customers_served = 0
    stall_level = 1
    display_slots = 4
    customer_multiplier = 1.0
    inventory.clear()
    display_items.clear()
    item_prices.clear()
    
    current_state = GameState.PLAYING
    EventBus.emit_event("game_state_changed", current_state)
    start_day()

func start_day() -> void:
    current_phase = Phase.PURCHASE
    daily_report = {
        "start_money": money,
        "purchase_cost": 0,
        "sales_revenue": 0,
        "customers_served": 0,
        "items_sold": {},
        "end_money": 0,
        "profit": 0
    }
    EventBus.emit_event("day_started", current_day)
    EventBus.emit_event("phase_changed", current_phase)

func next_phase() -> void:
    if current_state != GameState.PLAYING:
        return
    
    match current_phase:
        Phase.PURCHASE:
            current_phase = Phase.SELL
            EventBus.emit_event("phase_changed", current_phase)
        Phase.SELL:
            _end_day()
        Phase.SETTLEMENT:
            if current_day >= max_days:
                _complete_level()
            else:
                current_day += 1
                start_day()

func _end_day() -> void:
    current_phase = Phase.SETTLEMENT
    daily_report["end_money"] = money
    daily_report["profit"] = daily_report["sales_revenue"] - daily_report["purchase_cost"]
    current_state = GameState.SETTLEMENT
    EventBus.emit_event("day_ended", current_day, daily_report)
    EventBus.emit_event("phase_changed", current_phase)
    EventBus.emit_event("game_state_changed", current_state)

func continue_after_settlement() -> void:
    current_state = GameState.PLAYING
    EventBus.emit_event("game_state_changed", current_state)
    next_phase()

func _complete_level() -> void:
    var level = LevelConfig.get_level(current_level_id)
    var target_money = level.get("target_money", 1000)
    var stars = 0
    if money >= target_money * 0.5:
        stars = 1
    if money >= target_money:
        stars = 2
    if money >= target_money * 1.5:
        stars = 3
    
    SaveManager.save_level_progress(current_level_id, stars, money)
    EventBus.emit_event("level_completed", current_level_id, stars)

func change_money(amount: int) -> bool:
    if money + amount < 0:
        return false
    money += amount
    if amount > 0:
        total_earned += amount
    EventBus.emit_event("money_changed", amount, money)
    AudioManager.play_sfx("coin")
    return true

func add_item(item_id: String, count: int = 1) -> void:
    if not (item_id in inventory):
        inventory[item_id] = 0
    inventory[item_id] += count
    EventBus.emit_event("inventory_changed", item_id, inventory[item_id])
    AudioManager.play_sfx("pickup")

func remove_item(item_id: String, count: int = 1) -> bool:
    if not (item_id in inventory) or inventory[item_id] < count:
        return false
    inventory[item_id] -= count
    if inventory[item_id] <= 0:
        inventory.erase(item_id)
    EventBus.emit_event("inventory_changed", item_id, inventory.get(item_id, 0))
    return true

func purchase_item(item_id: String, count: int = 1) -> bool:
    var item = ItemsDB.get_item(item_id)
    if item.is_empty():
        return false
    var cost = item.get("cost_price", 10) * count
    if not change_money(-cost):
        return false
    add_item(item_id, count)
    daily_report["purchase_cost"] += cost
    return true

func set_display_item(slot_index: int, item_id: String, price: int) -> bool:
    if slot_index < 0 or slot_index >= display_slots:
        return false
    if not (item_id in inventory) or inventory[item_id] <= 0:
        return false
    while display_items.size() <= slot_index:
        display_items.append("")
    display_items[slot_index] = item_id
    item_prices[item_id] = price
    return true

func sell_item(item_id: String) -> bool:
    if not display_items.has(item_id):
        return false
    if not remove_item(item_id, 1):
        return false
    var price = item_prices.get(item_id, 0)
    if not change_money(price):
        return false
    daily_report["sales_revenue"] += price
    daily_report["customers_served"] += 1
    total_customers_served += 1
    if not (item_id in daily_report["items_sold"]):
        daily_report["items_sold"][item_id] = 0
    daily_report["items_sold"][item_id] += 1
    EventBus.emit_event("customer_served", null, item_id, price)
    AudioManager.play_sfx("sale")
    return true

func upgrade_stall() -> bool:
    var cost = 200 * stall_level
    if not change_money(-cost):
        return false
    stall_level += 1
    display_slots = min(display_slots + 1, 8)
    customer_multiplier += 0.2
    EventBus.emit_event("stall_upgraded", "main_stall", stall_level)
    AudioManager.play_sfx("upgrade")
    return true

func get_upgrade_cost() -> int:
    return 200 * stall_level

func pause_game() -> void:
    if current_state == GameState.PLAYING:
        current_state = GameState.PAUSED
        EventBus.emit_event("game_state_changed", current_state)
        get_tree().paused = true

func resume_game() -> void:
    if current_state == GameState.PAUSED:
        current_state = GameState.PLAYING
        EventBus.emit_event("game_state_changed", current_state)
        get_tree().paused = false

func go_to_main_menu() -> void:
    current_state = GameState.MAIN_MENU
    get_tree().paused = false
    EventBus.emit_event("game_state_changed", current_state)
    SceneManager.change_scene("Main")

func go_to_level_select() -> void:
    current_state = GameState.LEVEL_SELECT
    EventBus.emit_event("game_state_changed", current_state)
    SceneManager.change_scene("LevelSelect")

func _on_inventory_changed(item_id: String, _new_count: int) -> void:
    pass

func _on_money_changed(_amount: int, _total: int) -> void:
    pass
