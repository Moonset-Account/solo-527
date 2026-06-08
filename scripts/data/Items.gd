extends Node

const ITEMS: Dictionary = {
    "apple": {
        "id": "apple",
        "name": "苹果",
        "description": "新鲜多汁的红苹果，老少皆宜",
        "cost_price": 8,
        "category": "fruit",
        "popularity": 1.0,
        "quality_base": 1.0,
        "display_name": "苹果"
    },
    "bread": {
        "id": "bread",
        "name": "面包",
        "description": "香气扑鼻的手工面包，每天现烤",
        "cost_price": 12,
        "category": "food",
        "popularity": 1.2,
        "quality_base": 1.0,
        "display_name": "面包"
    },
    "carrot": {
        "id": "carrot",
        "name": "胡萝卜",
        "description": "脆嫩清甜的有机胡萝卜",
        "cost_price": 5,
        "category": "vegetable",
        "popularity": 0.8,
        "quality_base": 1.0,
        "display_name": "胡萝卜"
    },
    "fish": {
        "id": "fish",
        "name": "鲜鱼",
        "description": "当日捕捞的新鲜河鱼",
        "cost_price": 20,
        "category": "seafood",
        "popularity": 1.1,
        "quality_base": 1.0,
        "display_name": "鲜鱼"
    },
    "meat": {
        "id": "meat",
        "name": "肉类",
        "description": "优质农场出产的新鲜肉类",
        "cost_price": 30,
        "category": "meat",
        "popularity": 1.3,
        "quality_base": 1.0,
        "display_name": "肉类"
    },
    "cheese": {
        "id": "cheese",
        "name": "奶酪",
        "description": "手工发酵的香浓奶酪",
        "cost_price": 18,
        "category": "dairy",
        "popularity": 1.0,
        "quality_base": 1.0,
        "display_name": "奶酪"
    },
    "vegetable": {
        "id": "vegetable",
        "name": "时令蔬菜",
        "description": "当天采摘的绿叶蔬菜",
        "cost_price": 7,
        "category": "vegetable",
        "popularity": 1.0,
        "quality_base": 1.0,
        "display_name": "蔬菜"
    },
    "fruit": {
        "id": "fruit",
        "name": "时令水果",
        "description": "精选当季新鲜水果",
        "cost_price": 15,
        "category": "fruit",
        "popularity": 1.0,
        "quality_base": 1.0,
        "display_name": "水果"
    },
    "craft": {
        "id": "craft",
        "name": "手工艺品",
        "description": "当地工匠精心制作的艺术品",
        "cost_price": 40,
        "category": "craft",
        "popularity": 0.9,
        "quality_base": 1.0,
        "display_name": "工艺品"
    },
    "flower": {
        "id": "flower",
        "name": "鲜花",
        "description": "芬芳美丽的节日鲜花",
        "cost_price": 25,
        "category": "flower",
        "popularity": 1.1,
        "quality_base": 1.0,
        "display_name": "鲜花"
    }
}

static func get_all() -> Dictionary:
    return ITEMS

static func get_item(item_id: String) -> Dictionary:
    return ITEMS.get(item_id, {})

static func get_item_name(item_id: String) -> String:
    var item = ITEMS.get(item_id, {})
    return item.get("name", item_id)

static func get_cost_price(item_id: String) -> int:
    var item = ITEMS.get(item_id, {})
    return item.get("cost_price", 10)

static func get_category(item_id: String) -> String:
    var item = ITEMS.get(item_id, {})
    return item.get("category", "other")
