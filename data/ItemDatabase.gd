extends Resource
class_name ItemDatabase
## 物品数据库资源文件

func get_items() -> Dictionary:
    return {
        "box_small": {
            "name": "小纸箱",
            "weight": 2.0,
            "fragile": false,
            "size": Vector2(80, 80),
            "color": Color(0.8, 0.6, 0.3),
            "max_pressure": 20.0,
            "points": 10
        },
        "box_medium": {
            "name": "中纸箱",
            "weight": 4.0,
            "fragile": false,
            "size": Vector2(120, 100),
            "color": Color(0.75, 0.55, 0.25),
            "max_pressure": 30.0,
            "points": 20
        },
        "box_large": {
            "name": "大纸箱",
            "weight": 7.0,
            "fragile": false,
            "size": Vector2(160, 140),
            "color": Color(0.7, 0.5, 0.2),
            "max_pressure": 50.0,
            "points": 35
        },
        "fragile_glass": {
            "name": "玻璃器皿",
            "weight": 1.5,
            "fragile": true,
            "size": Vector2(70, 90),
            "color": Color(0.6, 0.85, 0.95),
            "max_pressure": 3.0,
            "points": 50
        },
        "fragile_vase": {
            "name": "古董花瓶",
            "weight": 2.5,
            "fragile": true,
            "size": Vector2(60, 120),
            "color": Color(0.95, 0.7, 0.4),
            "max_pressure": 2.0,
            "points": 100
        },
        "fragile_dish": {
            "name": "陶瓷餐具",
            "weight": 3.0,
            "fragile": true,
            "size": Vector2(90, 70),
            "color": Color(1.0, 0.92, 0.85),
            "max_pressure": 4.0,
            "points": 60
        },
        "heavy_appliance": {
            "name": "家电",
            "weight": 15.0,
            "fragile": false,
            "size": Vector2(140, 120),
            "color": Color(0.4, 0.45, 0.5),
            "max_pressure": 100.0,
            "points": 40
        },
        "furniture": {
            "name": "家具",
            "weight": 20.0,
            "fragile": false,
            "size": Vector2(180, 100),
            "color": Color(0.5, 0.35, 0.2),
            "max_pressure": 80.0,
            "points": 45
        },
        "pillow": {
            "name": "枕头软垫",
            "weight": 0.5,
            "fragile": false,
            "size": Vector2(100, 60),
            "color": Color(0.95, 0.9, 0.85),
            "max_pressure": 200.0,
            "points": 5
        },
        "book_stack": {
            "name": "书籍堆叠",
            "weight": 5.0,
            "fragile": false,
            "size": Vector2(80, 110),
            "color": Color(0.3, 0.5, 0.7),
            "max_pressure": 40.0,
            "points": 25
        }
    }
