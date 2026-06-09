extends Node
## 资源加载器 - 缓存和管理游戏资源

var _texture_cache: Dictionary = {}
var _scene_cache: Dictionary = {}
var _item_defs: Dictionary = {}
var _level_defs: Dictionary = {}
var _audio_cache: Dictionary = {}

const ITEM_DEFS_PATH := "res://data/items.tres"
const LEVEL_DEFS_PATH := "res://data/levels.tres"

func _ready() -> void:
    _load_item_definitions()
    _load_level_definitions()

func _load_item_definitions() -> void:
    if ResourceLoader.exists(ITEM_DEFS_PATH):
        var res: Resource = load(ITEM_DEFS_PATH)
        if res and res.has_method("get_items"):
            _item_defs = res.get_items()
    else:
        _item_defs = _create_default_items()

func _load_level_definitions() -> void:
    if ResourceLoader.exists(LEVEL_DEFS_PATH):
        var res: Resource = load(LEVEL_DEFS_PATH)
        if res and res.has_method("get_levels"):
            _level_defs = res.get_levels()
    else:
        _level_defs = _create_default_levels()

func _create_default_items() -> Dictionary:
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

func _create_default_levels() -> Dictionary:
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

func get_item_def(item_id: String) -> Dictionary:
    if _item_defs.has(item_id):
        return _item_defs[item_id].duplicate(true)
    return {}

func get_all_items() -> Dictionary:
    return _item_defs.duplicate(true)

func get_level_def(level_id: int) -> Dictionary:
    if _level_defs.has(level_id):
        return _level_defs[level_id].duplicate(true)
    return {}

func get_all_levels() -> Dictionary:
    return _level_defs.duplicate(true)

func get_level_count() -> int:
    return _level_defs.size()

func set_level_def(level_id: int, def: Dictionary) -> void:
    _level_defs[level_id] = def

func get_texture(path: String) -> Texture2D:
    if _texture_cache.has(path):
        return _texture_cache[path]
    if ResourceLoader.exists(path):
        var tex: Texture2D = load(path)
        _texture_cache[path] = tex
        return tex
    return null

func get_scene(path: String) -> PackedScene:
    if _scene_cache.has(path):
        return _scene_cache[path]
    if ResourceLoader.exists(path):
        var scene: PackedScene = load(path)
        _scene_cache[path] = scene
        return scene
    return null

func get_audio_stream(path: String) -> AudioStream:
    if _audio_cache.has(path):
        return _audio_cache[path]
    if ResourceLoader.exists(path):
        var stream: AudioStream = load(path)
        _audio_cache[path] = stream
        return stream
    return null

func clear_cache() -> void:
    _texture_cache.clear()
    _scene_cache.clear()
    _audio_cache.clear()
