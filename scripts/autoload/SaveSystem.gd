extends Node

const SAVE_PATH: String = "user://savegame.json"
var save_data: Dictionary = {}

func _ready():
	load_data()

func load_data() -> bool:
	if FileAccess.file_exists(SAVE_PATH):
		var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
		if f:
			var parsed: Variant = JSON.parse_string(f.get_as_text())
			f.close()
			if typeof(parsed) == TYPE_DICTIONARY:
				save_data = parsed
				return true
	save_data = {
		"completed_levels": [],
		"settings": {
			"master_volume": 0.8,
			"sfx_volume": 0.7,
			"bgm_volume": 0.5,
			"fullscreen": false,
			"vsync": true,
			"show_performance": false,
			"input_bindings": {}
		},
		"last_result": null
	}
	return false

func save() -> bool:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(save_data, "\t"))
		f.close()
		return true
	return false

func add_completed_level(level_id: String):
	var cl: Array = save_data.get("completed_levels", [])
	if not (level_id in cl):
		cl.append(level_id)
		save_data["completed_levels"] = cl
	save()

func is_level_completed(level_id: String) -> bool:
	return level_id in save_data.get("completed_levels", [])

func get_completed_levels() -> Array:
	return save_data.get("completed_levels", [])

func save_last_result(result: Dictionary):
	save_data["last_result"] = result
	save()

func get_last_result() -> Dictionary:
	var r: Variant = save_data.get("last_result", null)
	if typeof(r) == TYPE_DICTIONARY:
		return r
	return {}

func get_setting(key: String, default_val: Variant) -> Variant:
	var parts: PackedStringArray = key.split(".")
	var cur: Variant = save_data.get("settings", {})
	for p in parts:
		if typeof(cur) == TYPE_DICTIONARY and (cur as Dictionary).has(p):
			cur = (cur as Dictionary)[p]
		else:
			return default_val
	return cur

func set_setting(key: String, value: Variant):
	var parts: PackedStringArray = key.split(".")
	var settings: Dictionary = save_data.get("settings", {})
	var cur: Dictionary = settings
	for i in parts.size():
		var p: String = parts[i]
		if i == parts.size() - 1:
			cur[p] = value
		else:
			if not cur.has(p) or typeof(cur[p]) != TYPE_DICTIONARY:
				cur[p] = {}
			cur = cur[p]
	save_data["settings"] = settings
	save()
	if key.begins_with("master_volume") or key.begins_with("sfx_volume") or key.begins_with("bgm_volume"):
		if AudioManager:
			AudioManager.apply_volumes()
	if key == "fullscreen":
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if value else DisplayServer.WINDOW_MODE_WINDOWED)
	if key == "vsync":
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if value else DisplayServer.VSYNC_DISABLED)
