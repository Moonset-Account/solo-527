extends Resource
class_name ItemDatabaseResource

var _items_db: Dictionary = {}

func _init() -> void:
	_build_items()

func get_all_items() -> Dictionary:
	return _items_db

func get_item(id: String) -> Dictionary:
	if _items_db.has(id):
		return _items_db[id].duplicate(true)
	return {}

func _make_item(p_id: String, p_name: String, p_type: int, p_weight: float, p_dims: Vector2, p_color: Color, p_accent: Color, p_fragile: bool = false, p_bonus: int = 50, p_icon: String = "📦", p_is_rect: bool = true, p_max_stack: float = -1.0, p_fragile_limit: float = -1.0, p_shape: PackedVector2Array = PackedVector2Array()) -> Dictionary:
	var max_s: float = p_max_stack if p_max_stack >= 0 else (p_weight * 4.0)
	var frag_l: float = p_fragile_limit if p_fragile_limit >= 0 else (p_weight * 1.5)
	return {
		"item_id": p_id,
		"item_name": p_name,
		"item_type": p_type,
		"description": p_name,
		"weight": p_weight,
		"weight_score": int(p_weight * 2),
		"is_fragile": p_fragile,
		"fragile_weight_limit": frag_l,
		"max_stack_weight": max_s,
		"dimensions": p_dims,
		"base_color": p_color,
		"accent_color": p_accent,
		"rotation_snapping": 15.0,
		"shape_points": p_shape,
		"is_rectangle": p_is_rect,
		"can_stack": true,
		"place_bonus": p_bonus,
		"category_icon": p_icon
	}

func _build_items() -> void:
	var T := preload("res://config/item_config.gd")
	_items_db = {
		"box_small": _make_item("box_small", "小纸箱", T.ItemType.BOX_SMALL, 15.0, Vector2(70, 70), Color(0.88, 0.7, 0.45), Color(0.7, 0.52, 0.3), false, 50, "📦"),
		"box_medium": _make_item("box_medium", "中纸箱", T.ItemType.BOX_MEDIUM, 35.0, Vector2(110, 90), Color(0.82, 0.63, 0.38), Color(0.65, 0.47, 0.25), false, 80, "📦"),
		"box_large": _make_item("box_large", "大纸箱", T.ItemType.BOX_LARGE, 70.0, Vector2(160, 120), Color(0.76, 0.56, 0.32), Color(0.58, 0.4, 0.2), false, 120, "📦"),
		"books_stack": _make_item("books_stack", "一摞书", T.ItemType.BOOKS, 40.0, Vector2(90, 60), Color(0.5, 0.35, 0.65), Color(0.35, 0.22, 0.5), false, 90, "📚"),
		"clothes_bag": _make_item("clothes_bag", "衣物袋", T.ItemType.CLOTHING, 20.0, Vector2(100, 80), Color(0.55, 0.75, 0.55), Color(0.38, 0.58, 0.38), false, 60, "👕"),
		"soft_pillow": _make_item("soft_pillow", "抱枕", T.ItemType.SOFT_ITEM, 5.0, Vector2(80, 60), Color(0.95, 0.78, 0.82), Color(0.85, 0.62, 0.68), false, 40, "🛏️"),
		"furniture_small": _make_item("furniture_small", "小边桌", T.ItemType.FURNITURE_SMALL, 90.0, Vector2(120, 100), Color(0.55, 0.38, 0.22), Color(0.38, 0.24, 0.12), false, 140, "🪑"),
		"furniture_chair": _make_item("furniture_chair", "椅子", T.ItemType.FURNITURE_SMALL, 80.0, Vector2(130, 140), Color(0.48, 0.34, 0.2), Color(0.32, 0.2, 0.1), false, 130, "🪑"),
		"furniture_large": _make_item("furniture_large", "大衣柜", T.ItemType.FURNITURE_LARGE, 220.0, Vector2(200, 240), Color(0.45, 0.3, 0.15), Color(0.28, 0.16, 0.06), false, 220, "🚪"),
		"electronics_tv": _make_item("electronics_tv", "电视机", T.ItemType.ELECTRONICS, 120.0, Vector2(180, 100), Color(0.2, 0.2, 0.25), Color(0.08, 0.08, 0.12), false, 180, "📺"),
		"electronics_speaker": _make_item("electronics_speaker", "音响", T.ItemType.ELECTRONICS, 55.0, Vector2(80, 130), Color(0.18, 0.18, 0.22), Color(0.06, 0.06, 0.1), false, 110, "🔊"),
		"electronics_laptop": _make_item("electronics_laptop", "笔记本", T.ItemType.ELECTRONICS, 25.0, Vector2(100, 70), Color(0.35, 0.38, 0.45), Color(0.2, 0.22, 0.28), false, 100, "💻"),
		"appliance_fridge": _make_item("appliance_fridge", "小冰箱", T.ItemType.APPLIANCE, 200.0, Vector2(140, 220), Color(0.82, 0.85, 0.9), Color(0.62, 0.65, 0.72), false, 200, "🧊"),
		"appliance_washing": _make_item("appliance_washing", "洗衣机", T.ItemType.APPLIANCE, 180.0, Vector2(150, 180), Color(0.78, 0.82, 0.88), Color(0.58, 0.62, 0.7), false, 190, "🧺"),
		"kitchen_pan": _make_item("kitchen_pan", "平底锅", T.ItemType.KITCHENWARE, 30.0, Vector2(140, 60), Color(0.35, 0.35, 0.38), Color(0.18, 0.18, 0.2), false, 70, "🍳"),
		"cylinder_pot": _make_item("cylinder_pot", "收纳桶", T.ItemType.CYLINDER, 25.0, Vector2(70, 90), Color(0.3, 0.55, 0.7), Color(0.18, 0.38, 0.55), false, 65, "🪣"),
		"plant_pot": _make_item("plant_pot", "盆栽", T.ItemType.PLANT, 35.0, Vector2(80, 110), Color(0.5, 0.7, 0.4), Color(0.58, 0.4, 0.22), false, 85, "🪴"),
		"lamp": _make_item("lamp", "台灯", T.ItemType.LAMP, 15.0, Vector2(60, 100), Color(0.95, 0.82, 0.4), Color(0.7, 0.55, 0.2), false, 70, "💡"),
		"glass_cup": _make_item("glass_cup", "玻璃杯", T.ItemType.FRAGILE_GLASS, 3.0, Vector2(45, 60), Color(0.55, 0.8, 0.95), Color(0.75, 0.45, 0.85), true, 120, "🥛", true, 8.0),
		"china_plate": _make_item("china_plate", "瓷盘套装", T.ItemType.FRAGILE_PLATE, 8.0, Vector2(80, 50), Color(0.95, 0.92, 0.88), Color(0.8, 0.45, 0.85), true, 150, "🍽️", true, 12.0),
		"mirror": _make_item("mirror", "全身镜", T.ItemType.MIRROR, 25.0, Vector2(60, 200), Color(0.8, 0.9, 0.98), Color(0.55, 0.35, 0.85), true, 180, "🪞", true, 20.0),
		"irregular_guitar": _make_item("irregular_guitar", "吉他", T.ItemType.IRREGULAR, 18.0, Vector2(120, 180), Color(0.68, 0.45, 0.25), Color(0.5, 0.3, 0.12), false, 110, "🎸", false)
	}
