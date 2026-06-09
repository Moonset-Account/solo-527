extends Resource
class_name LevelDatabase
## 关卡数据库资源文件

func get_levels() -> Dictionary:
    return {
        1: {
            "name": "入门：第一箱",
            "description": "把物品整齐地放入箱子，不要压碎易碎品！",
            "box_size": Vector2(600, 700),
            "max_weight": 60.0,
            "target_score": 100,
            "three_star_score": 200,
            "two_star_score": 150,
            "items": ["box_small", "box_small", "fragile_glass", "pillow", "book_stack"],
            "tutorial_hint": "提示：先放重物在底层，易碎品放上面"
        },
        2: {
            "name": "小心轻放",
            "description": "更多易碎品，合理规划空间！",
            "box_size": Vector2(600, 800),
            "max_weight": 80.0,
            "target_score": 180,
            "three_star_score": 320,
            "two_star_score": 250,
            "items": ["box_small", "box_medium", "fragile_glass", "fragile_dish", "fragile_vase", "pillow", "pillow"],
            "tutorial_hint": "提示：软垫可以放在易碎品上方缓冲"
        },
        3: {
            "name": "大家电进场",
            "description": "大件家电占空间，注意重量上限！",
            "box_size": Vector2(700, 900),
            "max_weight": 120.0,
            "target_score": 250,
            "three_star_score": 400,
            "two_star_score": 320,
            "items": ["box_medium", "box_large", "heavy_appliance", "box_small", "fragile_dish", "book_stack", "pillow"],
            "tutorial_hint": "提示：家电很重，放在最底层"
        },
        4: {
            "name": "平衡大师",
            "description": "家具和易碎品的组合考验",
            "box_size": Vector2(700, 900),
            "max_weight": 150.0,
            "target_score": 320,
            "three_star_score": 500,
            "two_star_score": 400,
            "items": ["furniture", "box_large", "box_medium", "heavy_appliance", "fragile_vase", "fragile_glass", "fragile_dish", "pillow", "pillow", "book_stack"],
            "tutorial_hint": "提示：合理利用空间，大件靠边放"
        },
        5: {
            "name": "搬家日",
            "description": "终极挑战，所有物品都要运走！",
            "box_size": Vector2(800, 1000),
            "max_weight": 200.0,
            "target_score": 500,
            "three_star_score": 700,
            "two_star_score": 600,
            "items": ["furniture", "box_large", "box_large", "box_medium", "box_medium", "heavy_appliance", "book_stack", "fragile_vase", "fragile_glass", "fragile_dish", "fragile_dish", "pillow", "pillow", "pillow", "box_small", "box_small"],
            "tutorial_hint": "提示：规划好每件物品的位置，追求三星！"
        }
    }
