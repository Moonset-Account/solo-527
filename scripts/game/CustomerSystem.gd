class_name CustomerSystem
extends Node

class Customer:
    var id: String = ""
    var name: String = ""
    var preference: Dictionary = {}
    var budget: int = 0
    var patience: float = 1.0
    var served: bool = false
    var happy: bool = false
    var desired_items: Array = []
    
    func _init(pref: Dictionary, money_range: Array, level_items: Array) -> void:
        id = "customer_" + str(randi())
        var names = ["张先生", "李女士", "王大爷", "赵阿姨", "陈小伙", "刘姑娘", "周奶奶", "吴叔叔", "郑妹妹", "孙哥哥"]
        name = names[randi() % names.size()]
        preference = pref
        budget = money_range[0] + randi() % (money_range[1] - money_range[0])
        patience = 0.7 + randf() * 0.6
        served = false
        happy = false
        _generate_desired_items(level_items)
    
    func _generate_desired_items(level_items: Array) -> void:
        desired_items.clear()
        var item_scores: Array = []
        
        for item_id in level_items:
            var base_pref = preference.get(item_id, 0.5)
            var item_data = GameAssets.get_item_data(item_id)
            var popularity = item_data.get("popularity", 1.0)
            var score = base_pref * popularity * randf()
            item_scores.append({"item": item_id, "score": score})
        
        item_scores.sort_custom(func(a, b): return a["score"] > b["score"])
        
        var want_count = 1 + randi() % 3
        for i in range(min(want_count, item_scores.size())):
            if item_scores[i]["score"] > 0.2:
                desired_items.append(item_scores[i]["item"])
    
    func will_buy(item_id: String, price: int) -> float:
        if not desired_items.has(item_id):
            return 0.0
        
        var item_data = GameAssets.get_item_data(item_id)
        var cost_price = item_data.get("cost_price", 10)
        var recommended = LevelConfig.get_recommended_price(item_id)
        
        var pref_score = preference.get(item_id, 0.5)
        var price_ratio = float(recommended) / max(1, price)
        price_ratio = clamp(price_ratio, 0.1, 2.0)
        
        var budget_factor = 1.0
        if price > budget * 0.5:
            budget_factor = float(budget) / max(1, price * 2)
        
        var buy_probability = pref_score * price_ratio * budget_factor * patience
        return clamp(buy_probability, 0.0, 1.0)
    
    func decide_buy(item_id: String, price: int) -> bool:
        var prob = will_buy(item_id, price)
        return randf() < prob

var customers: Array = []
var preferences: Dictionary = {}
var customer_queue: Array = []

func setup_for_level(level_id: String) -> void:
    preferences = LevelConfig.get_customer_preferences(level_id)
    customers.clear()
    customer_queue.clear()

func generate_customers(level_id: String, day: int) -> Array:
    setup_for_level(level_id)
    var count = LevelConfig.get_customer_count(level_id, day)
    customers.clear()
    customer_queue.clear()
    
    var level = LevelConfig.get_level(level_id)
    var level_items = level.get("available_items", [])
    
    var base_budget_low = 20 + day * 5
    var base_budget_high = 80 + day * 15
    
    for i in range(count):
        var money_range = [base_budget_low, base_budget_high]
        var customer = Customer.new(preferences, money_range, level_items)
        customers.append(customer)
        customer_queue.append(customer)
    
    return customers

func get_next_customer() -> Customer:
    if customer_queue.size() > 0:
        return customer_queue.pop_front()
    return null

func remaining_customers() -> int:
    return customer_queue.size()

func total_customers() -> int:
    return customers.size()

func served_count() -> int:
    var count = 0
    for c in customers:
        if c.served:
            count += 1
    return count

func happy_count() -> int:
    var count = 0
    for c in customers:
        if c.happy:
            count += 1
    return count

func get_satisfaction_rate() -> float:
    if customers.size() == 0:
        return 0.0
    return float(happy_count()) / float(customers.size())

func get_average_preference(item_id: String) -> float:
    return preferences.get(item_id, 0.5)

func get_trending_items() -> Array:
    var items: Array = []
    for item_id in preferences.keys():
        items.append({"item": item_id, "pref": preferences[item_id]})
    items.sort_custom(func(a, b): return a["pref"] > b["pref"])
    var result: Array = []
    for i in range(min(3, items.size())):
        result.append(items[i]["item"])
    return result
