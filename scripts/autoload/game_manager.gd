extends Node

signal level_started(level_id: String)
signal level_completed(level_id: String, score: Dictionary)
signal game_paused
signal game_resumed
signal item_dropped(item: Node2D)
signal item_rotated(item: Node2D)
signal fragile_damaged(item: Node2D, damage: float)
signal score_changed(score: int)
signal undo_performed

var current_level_id: String = ""
var current_score: int = 0
var is_paused: bool = false
var is_level_active: bool = false
var undo_stack: Array[Dictionary] = []
var max_undo_steps: int = 50
var items_in_box: Array[Node2D] = []
var items_remaining: Array[Dictionary] = []
var level_time: float = 0.0
var fragile_broken_count: int = 0

enum GameState {
	MENU,
	LEVEL_SELECT,
	PLAYING,
	PAUSED,
	RESULT
}

var state: GameState = GameState.MENU

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func _process(delta: float) -> void:
	if is_level_active and not is_paused:
		level_time += delta

func start_level(level_id: String) -> void:
	current_level_id = level_id
	current_score = 0
	undo_stack.clear()
	items_in_box.clear()
	fragile_broken_count = 0
	level_time = 0.0
	is_level_active = true
	is_paused = false
	state = GameState.PLAYING
	var config = LevelConfig.load_level(level_id)
	if config.is_empty():
		push_error("Level not found: " + level_id)
		return
	items_remaining = config.get("items", []).duplicate()
	level_started.emit(level_id)

func push_undo_action(action: Dictionary) -> void:
	if undo_stack.size() >= max_undo_steps:
		undo_stack.pop_front()
	undo_stack.append(action)

func perform_undo() -> void:
	if undo_stack.is_empty():
		return
	var action = undo_stack.pop_back()
	match action.get("type", ""):
		"place":
			var item = _find_item_by_id(action.get("item_id", ""))
			if item and is_instance_valid(item):
				if item.has_method("unplace"):
					item.unplace()
				item.global_position = _dict_to_vec2(action.get("prev_position", Vector2.ZERO))
				item.global_rotation = float(action.get("prev_rotation", 0.0))
				items_in_box.erase(item)
				AudioManager.play_sfx("undo")
		"rotate":
			var item = _find_item_by_id(action.get("item_id", ""))
			if item and is_instance_valid(item):
				item.global_rotation = float(action.get("prev_rotation", 0.0))
				AudioManager.play_sfx("undo")
	undo_performed.emit()

func _dict_to_vec2(val) -> Vector2:
	if val is Vector2:
		return val
	if val is Dictionary:
		return Vector2(float(val.get("x", 0.0)), float(val.get("y", 0.0)))
	return Vector2.ZERO

func _find_item_by_id(item_id: String) -> Node2D:
	var tree = get_tree()
	if not tree:
		return null
	for node in tree.get_nodes_in_group("items"):
		if node.has_meta("item_id") and node.get_meta("item_id") == item_id:
			return node
	return null

func add_item_to_box(item: Node2D) -> void:
	if not items_in_box.has(item):
		items_in_box.append(item)
	item.set_meta("in_box", true)
	item.add_to_group("packed_items")

func remove_item_from_box(item: Node2D) -> void:
	items_in_box.erase(item)
	item.set_meta("in_box", false)
	item.remove_from_group("packed_items")

func complete_level() -> void:
	is_level_active = false
	state = GameState.RESULT
	var result = calculate_score()
	level_completed.emit(current_level_id, result)
	SaveManager.save_level_result(current_level_id, result)

func calculate_score() -> Dictionary:
	var config = LevelConfig.load_level(current_level_id)
	var base_score = items_in_box.size() * 100
	var space_bonus = _calc_space_bonus()
	var time_bonus = max(0, int(1000 - level_time * 5))
	var fragile_penalty = fragile_broken_count * 200
	var total = max(0, base_score + space_bonus + time_bonus - fragile_penalty)
	var stars = 1
	if total >= config.get("star2_threshold", 1500):
		stars = 2
	if total >= config.get("star3_threshold", 2500):
		stars = 3
	current_score = total
	score_changed.emit(total)
	return {
		"total_score": total,
		"items_packed": items_in_box.size(),
		"space_bonus": space_bonus,
		"time_bonus": time_bonus,
		"fragile_penalty": fragile_penalty,
		"fragile_broken": fragile_broken_count,
		"time": level_time,
		"stars": stars
	}

func _calc_space_bonus() -> int:
	if items_in_box.is_empty():
		return 0
	var box_node = get_tree().get_first_node_in_group("box")
	if not box_node:
		return 0
	var box_area = box_node.get_meta("inner_area", 100000.0)
	var items_area = 0.0
	for item in items_in_box:
		if is_instance_valid(item) and item.has_method("get_bounds"):
			var b = item.get_bounds()
			items_area += b.size.x * b.size.y
	var ratio = items_area / max(box_area, 1.0)
	return int(ratio * 500)

func pause_game() -> void:
	if not is_level_active:
		return
	is_paused = true
	state = GameState.PAUSED
	get_tree().paused = true
	game_paused.emit()

func resume_game() -> void:
	is_paused = false
	state = GameState.PLAYING
	get_tree().paused = false
	game_resumed.emit()
