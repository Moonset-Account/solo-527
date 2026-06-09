extends Node

const LEVELS_PATH: String = "res://data/levels.json"
const MATERIALS_PATH: String = "res://data/materials.json"

static var _levels_cache: Dictionary = {}
static var _materials_cache: Dictionary = {}
static var _initialized: bool = false

static func initialize() -> void:
	if _initialized:
		return
	_load_levels()
	_load_materials()
	_initialized = true

static func _load_levels() -> void:
	if not FileAccess.file_exists(LEVELS_PATH):
		push_error("Levels file not found: %s" % LEVELS_PATH)
		return
	var file: FileAccess = FileAccess.open(LEVELS_PATH, FileAccess.READ)
	if file == null:
		push_error("Cannot open levels file")
		return
	var json_str: String = file.get_as_text()
	file.close()
	var parse_result = JSON.parse_string(json_str)
	if parse_result == null or typeof(parse_result) != TYPE_DICTIONARY:
		push_error("Failed to parse levels JSON")
		return
	var levels_arr: Array = parse_result.get("levels", [])
	for level in levels_arr:
		var level_id: int = level.get("id", 0)
		if level_id > 0:
			_levels_cache[level_id] = level

static func _load_materials() -> void:
	if not FileAccess.file_exists(MATERIALS_PATH):
		push_error("Materials file not found: %s" % MATERIALS_PATH)
		return
	var file: FileAccess = FileAccess.open(MATERIALS_PATH, FileAccess.READ)
	if file == null:
		push_error("Cannot open materials file")
		return
	var json_str: String = file.get_as_text()
	file.close()
	var parse_result = JSON.parse_string(json_str)
	if parse_result == null or typeof(parse_result) != TYPE_DICTIONARY:
		push_error("Failed to parse materials JSON")
		return
	_materials_cache = parse_result

static func get_level(level_id: int) -> Dictionary:
	initialize()
	return _levels_cache.get(level_id, {})

static func get_all_levels() -> Array[Dictionary]:
	initialize()
	var result: Array[Dictionary] = []
	for key in _levels_cache.keys():
		result.append(_levels_cache[key])
	result.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return a.get("id", 0) < b.get("id", 0))
	return result

static func get_all_papers() -> Array[Dictionary]:
	initialize()
	return _materials_cache.get("materials", {}).get("paper", [])

static func get_paper_by_id(paper_id: String) -> Dictionary:
	initialize()
	var papers: Array[Dictionary] = get_all_papers()
	for p in papers:
		if p.get("id") == paper_id:
			return p
	return {}

static func get_paper_by_name(name: String) -> Dictionary:
	initialize()
	var papers: Array[Dictionary] = get_all_papers()
	for p in papers:
		if p.get("name") == name:
			return p
	return {}

static func get_all_glues() -> Array[Dictionary]:
	initialize()
	return _materials_cache.get("materials", {}).get("glue", [])

static func get_glue_by_id(glue_id: String) -> Dictionary:
	initialize()
	var glues: Array[Dictionary] = get_all_glues()
	for g in glues:
		if g.get("id") == glue_id:
			return g
	return {}

static func get_glue_by_name(name: String) -> Dictionary:
	initialize()
	var glues: Array[Dictionary] = get_all_glues()
	for g in glues:
		if g.get("name") == name:
			return g
	return {}

static func get_all_tools() -> Array[Dictionary]:
	initialize()
	return _materials_cache.get("tools", [])

static func get_tool_by_action(action_name: String) -> Dictionary:
	initialize()
	var tools: Array[Dictionary] = get_all_tools()
	for t in tools:
		if t.get("action") == action_name:
			return t
	return {}

static func get_tool_by_id(tool_id: String) -> Dictionary:
	initialize()
	var tools: Array[Dictionary] = get_all_tools()
	for t in tools:
		if t.get("id") == tool_id:
			return t
	return {}
