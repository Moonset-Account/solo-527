extends Resource
class_name ItemConfig

enum ItemType {
	BOX_SMALL,
	BOX_MEDIUM,
	BOX_LARGE,
	FURNITURE_SMALL,
	FURNITURE_LARGE,
	ELECTRONICS,
	APPLIANCE,
	KITCHENWARE,
	CLOTHING,
	BOOKS,
	FRAGILE_GLASS,
	FRAGILE_PLATE,
	MIRROR,
	LAMP,
	PLANT,
	CYLINDER,
	IRREGULAR,
	SOFT_ITEM
}

@export var item_id: String = "box_small"
@export var item_name: String = "小箱子"
@export var item_type: int = ItemType.BOX_SMALL
@export var description: String = ""
@export var weight: float = 10.0
@export var weight_score: int = 10
@export var is_fragile: bool = false
@export var fragile_weight_limit: float = 20.0
@export var max_stack_weight: float = 50.0
@export var dimensions: Vector2 = Vector2(60, 60)
@export var base_color: Color = Color(0.85, 0.65, 0.4)
@export var accent_color: Color = Color(0.7, 0.5, 0.3)
@export var rotation_snapping: float = 15.0
@export var shape_points: PackedVector2Array = PackedVector2Array()
@export var is_rectangle: bool = true
@export var can_stack: bool = true
@export var place_bonus: int = 50
@export var category_icon: String = "📦"

func get_display_weight() -> String:
	if weight >= 1000:
		return "%.1f kg" % (weight / 1000.0)
	return "%.0f g" % weight

func get_type_name() -> String:
	match item_type:
		ItemType.BOX_SMALL: return "小型箱子"
		ItemType.BOX_MEDIUM: return "中型箱子"
		ItemType.BOX_LARGE: return "大型箱子"
		ItemType.FURNITURE_SMALL: return "小型家具"
		ItemType.FURNITURE_LARGE: return "大型家具"
		ItemType.ELECTRONICS: return "电子产品"
		ItemType.APPLIANCE: return "家用电器"
		ItemType.KITCHENWARE: return "厨房用具"
		ItemType.CLOTHING: return "衣物包裹"
		ItemType.BOOKS: return "书籍"
		ItemType.FRAGILE_GLASS: return "玻璃器皿"
		ItemType.FRAGILE_PLATE: return "瓷器"
		ItemType.MIRROR: return "镜子"
		ItemType.LAMP: return "灯具"
		ItemType.PLANT: return "盆栽植物"
		ItemType.CYLINDER: return "圆柱物品"
		ItemType.IRREGULAR: return "异形物品"
		ItemType.SOFT_ITEM: return "软质物品"
		_: return "未知"

func get_shape_points_local() -> PackedVector2Array:
	if shape_points.size() >= 3:
		return shape_points
	if is_rectangle:
		var hw: float = dimensions.x * 0.5
		var hh: float = dimensions.y * 0.5
		return PackedVector2Array([
			Vector2(-hw, -hh), Vector2(hw, -hh),
			Vector2(hw, hh), Vector2(-hw, hh)
		])
	return PackedVector2Array([Vector2.ZERO])
