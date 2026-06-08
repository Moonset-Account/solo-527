extends Resource
class_name ItemData

@export var item_name: String = ""
@export var shape_type: String = "rect"
@export var width: float = 32.0
@export var height: float = 32.0
@export var weight: float = 1.0
@export var is_fragile: bool = false
@export var color: Color = Color.WHITE
@export var icon_texture: Texture2D

func get_area() -> float:
	match shape_type:
		"circle":
			return PI * (width / 2.0) ** 2
		"l_shape", "t_shape":
			return width * height * 0.5
		_:
			return width * height
