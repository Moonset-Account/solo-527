extends RefCounted

class_name ZoneState

var zone_id: String = ""
var completed_steps: Array[String] = []
var repaired: bool = false
var quality: float = 0.0
var current_paper: String = ""
var current_glue: String = ""
var current_glue_ratio: float = 0.5
var errors: Array[String] = []
var zone_data: Dictionary = {}

func _init(data: Dictionary = {}) -> void:
	zone_id = data.get("id", "")
	zone_data = data
