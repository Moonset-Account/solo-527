class_name WeightSystem
extends Node

func calculate_pressure_map(items: Array) -> Dictionary:
	var pressure_map: Dictionary = {}
	var column_width: float = 32.0
	for item in items:
		if not "item_data" in item or not item.item_data:
			continue
		var data: ItemData = item.item_data
		var col_start: int = int(item.global_position.x / column_width)
		var col_end: int = int((item.global_position.x + data.width) / column_width)
		for col in range(col_start, col_end + 1):
			if not pressure_map.has(col):
				pressure_map[col] = {}
			if not pressure_map[col].has(item):
				pressure_map[col][item] = 0.0
	for item in items:
		if not "item_data" in item or not item.item_data:
			continue
		var data: ItemData = item.item_data
		var col_start: int = int(item.global_position.x / column_width)
		var col_end: int = int((item.global_position.x + data.width) / column_width)
		for other in items:
			if other == item:
				continue
			if not "item_data" in other or not other.item_data:
				continue
			if other.global_position.y < item.global_position.y:
				var other_col_start: int = int(other.global_position.x / column_width)
				var other_col_end: int = int((other.global_position.x + other.item_data.width) / column_width)
				for col in range(max(col_start, other_col_start), min(col_end, other_col_end) + 1):
					if pressure_map.has(col) and pressure_map[col].has(item):
						pressure_map[col][item] += other.item_data.weight / max(1, other_col_end - other_col_start + 1)
	return pressure_map

func check_fragile_integrity(items: Array) -> Array:
	var crushed: Array = []
	var pressure_map = calculate_pressure_map(items)
	for item in items:
		if not "item_data" in item or not item.item_data:
			continue
		if not item.item_data.is_fragile:
			continue
		var max_pressure: float = 0.0
		for col in pressure_map.values():
			if col.has(item):
				max_pressure = max(max_pressure, col[item])
		if max_pressure > item.item_data.weight:
			crushed.append(item)
	return crushed
