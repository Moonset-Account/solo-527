extends Node

const LEVELS: Dictionary = {
    "level_1": {
        "id": "level_1",
        "name": "新手集市",
        "description": "学习基础经营：采购、定价、销售",
        "days": 3,
        "start_money": 300,
        "target_money": 600,
        "prerequisite": "",
        "available_items": ["apple", "bread", "carrot"],
        "customer_count_base": 5,
        "customer_preferences": {
            "apple": 1.0,
            "bread": 1.2,
            "carrot": 0.8
        }
    },
    "level_2": {
        "id": "level_2",
        "name": "春日集市",
        "description": "更多顾客，更多商品种类",
        "days": 5,
        "start_money": 400,
        "target_money": 1200,
        "prerequisite": "level_1",
        "available_items": ["apple", "bread", "carrot", "cheese", "vegetable"],
        "customer_count_base": 8,
        "customer_preferences": {
            "apple": 1.1,
            "bread": 1.0,
            "carrot": 0.9,
            "cheese": 1.2,
            "vegetable": 1.0
        }
    },
    "level_3": {
        "id": "level_3",
        "name": "丰收集市",
        "description": "秋季大集，顾客多且挑剔",
        "days": 7,
        "start_money": 500,
        "target_money": 2500,
        "prerequisite": "level_2",
        "available_items": ["apple", "bread", "carrot", "fish", "meat", "cheese", "vegetable", "fruit"],
        "customer_count_base": 12,
        "customer_preferences": {
            "apple": 1.2,
            "bread": 0.9,
            "carrot": 1.0,
            "fish": 1.1,
            "meat": 1.3,
            "cheese": 1.0,
            "vegetable": 1.1,
            "fruit": 1.0
        }
    },
    "level_4": {
        "id": "level_4",
        "name": "节日盛典",
        "description": "最盛大的集市，客流量巨大",
        "days": 10,
        "start_money": 600,
        "target_money": 5000,
        "prerequisite": "level_3",
        "available_items": ["apple", "bread", "carrot", "fish", "meat", "cheese", "vegetable", "fruit", "craft", "flower"],
        "customer_count_base": 18,
        "customer_preferences": {
            "apple": 1.0,
            "bread": 1.0,
            "carrot": 1.0,
            "fish": 1.0,
            "meat": 1.1,
            "cheese": 1.0,
            "vegetable": 1.0,
            "fruit": 1.1,
            "craft": 1.3,
            "flower": 1.4
        }
    }
}

func get_level(level_id: String) -> Dictionary:
    return LEVELS.get(level_id, {})

func get_all_levels() -> Dictionary:
    return LEVELS

func get_level_ids() -> Array:
    return LEVELS.keys()

func get_available_items(level_id: String) -> Array:
    var level = get_level(level_id)
    return level.get("available_items", [])

func get_customer_preferences(level_id: String) -> Dictionary:
    var level = get_level(level_id)
    return level.get("customer_preferences", {})

func get_customer_count(level_id: String, day: int) -> int:
    var level = get_level(level_id)
    var base = level.get("customer_count_base", 5)
    var multiplier = 1.0 + (day - 1) * 0.15
    return int(base * multiplier * GameManager.customer_multiplier)

func get_item_price_range(item_id: String) -> Array:
    var item = ItemsDB.get_item(item_id)
    if item.is_empty():
        return [10, 50]
    var cost = item.get("cost_price", 10)
    return [cost, cost * 5]

func get_recommended_price(item_id: String) -> int:
    var item = ItemsDB.get_item(item_id)
    if item.is_empty():
        return 20
    return int(item.get("cost_price", 10) * 2.2)

func calculate_stars(level_id: String, final_money: int) -> int:
    var level = get_level(level_id)
    var target = level.get("target_money", 1000)
    var ratio = float(final_money) / float(target)
    if ratio >= 1.5:
        return 3
    elif ratio >= 1.0:
        return 2
    elif ratio >= 0.5:
        return 1
    return 0
