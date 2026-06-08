extends Node2D
class_name LevelManager

signal level_ready()
signal all_items_placed()
signal valid_placement(item: PackableItem)
signal invalid_placement(item: PackableItem, reason: String)

@export var level_id: int = 1
@export var container_position: Vector2 = Vector2(640, 380)
@export var tray_position: Vector2 = Vector2(180, 380)
@export var tray_spacing: Vector2 = Vector2(130, 120)
@export var tray_columns: int = 2

var container: PackingContainer = null
var item_database: Resource = null
var active_items: Array[PackableItem] = []
var selected_item: PackableItem = null
var is_dragging: bool = false
var drag_offset: Vector2 = Vector2.ZERO
var item_scene: PackedScene = null
var placement_chain_count: int = 0
var last_placement_time: float = 0.0
const COMBO_TIMEOUT: float = 1.5

func _ready() -> void:
	_connect_input_signals()
	await get_tree().process_frame
	_load_resources()
	_setup_container()
	_spawn_items()
	level_ready.emit()

func _load_resources() -> void:
	item_database = load("res://config/item_database.tres")
	if item_database == null:
		push_warning("无法加载物品数据库")

func _connect_input_signals() -> void:
	InputManager.drag_started.connect(_on_drag_start)
	InputManager.drag_moved.connect(_on_drag_move)
	InputManager.drag_ended.connect(_on_drag_end)
	InputManager.rotate_cw_pressed.connect(_on_rotate_cw)
	InputManager.rotate_ccw_pressed.connect(_on_rotate_ccw)
	InputManager.undo_pressed.connect(_on_undo)
	InputManager.redo_pressed.connect(_on_redo)
	InputManager.submit_pressed.connect(_on_submit)
	InputManager.reset_pressed.connect(_on_reset)
	InputManager.select_next_pressed.connect(_on_select_next)
	InputManager.select_prev_pressed.connect(_on_select_prev)

func _setup_container() -> void:
	container = PackingContainer.new()
	container.name = "MainContainer"
	container.container_size = GameManager.current_level.get("container_size", Vector2(500, 400))
	container.max_weight = GameManager.max_container_weight
	container.position = container_position
	container.item_entered.connect(_on_item_in_container)
	container.item_exited.connect(_on_item_out_container)
	container.weight_over_limit.connect(_on_weight_over)
	add_child(container)

func _spawn_items() -> void:
	var level: Dictionary = GameManager.current_level
	if not level.has("items"):
		return
	var items_spec: Array = level["items"]
	var spawn_order: Array = []
	var uid_counter: int = 0
	for spec in items_spec:
		var id: String = spec.get("config_id", "")
		var count: int = spec.get("count", 1)
		for i in range(count):
			spawn_order.append(id)
			uid_counter += 1
	spawn_order.shuffle()
	var total: int = spawn_order.size()
	var rows: int = ceil(float(total) / float(tray_columns))
	for idx in range(total):
		var id: String = spawn_order[idx]
		if not item_database.get_all_items().has(id):
			continue
		var cfg: Dictionary = item_database.get_all_items()[id]
		var item: PackableItem = _create_item_from_config(cfg, idx)
		if item == null:
			continue
		item.item_uid = idx + 1000
		item.spawn_index = idx
		var col: int = idx % tray_columns
		var row: int = int(idx / tray_columns)
		var pos: Vector2 = tray_position + Vector2(col * tray_spacing.x - (tray_columns - 1) * tray_spacing.x * 0.5, row * tray_spacing.y - (rows - 1) * tray_spacing.y * 0.5)
		item.position = pos
		item.original_position = pos
		item.original_rotation = 0
		item.original_z_index = idx + 10
		item.z_index = item.original_z_index
		active_items.append(item)
		add_child(item)

func _create_item_from_config(cfg: Dictionary, spawn_idx: int) -> PackableItem:
	var item: PackableItem = PackableItem.new()
	item.config_id = cfg.get("item_id", "box_small")
	item.item_name = cfg.get("item_name", "物品")
	item.weight = cfg.get("weight", 15.0)
	item.is_fragile = cfg.get("is_fragile", false)
	item.fragile_weight_limit = cfg.get("fragile_weight_limit", 20.0)
	item.max_stack_weight = cfg.get("max_stack_weight", 50.0)
	item.dimensions = cfg.get("dimensions", Vector2(60, 60))
	item.base_color = cfg.get("base_color", Color(0.85, 0.65, 0.4))
	item.accent_color = cfg.get("accent_color", Color(0.7, 0.5, 0.3))
	item.category_icon = cfg.get("category_icon", "📦")
	item.rotation_snapping = cfg.get("rotation_snapping", 15.0)
	item.place_bonus = cfg.get("place_bonus", 50)
	item.state_changed.connect(_on_item_state_changed.bind(item))
	item.collision_detected.connect(_on_item_collision.bind(item))
	return item

func _process(delta: float) -> void:
	if selected_item and is_dragging:
		var new_pos: Vector2 = selected_item.position.lerp(InputManager.get_last_position() - drag_offset, delta * 22.0)
		selected_item.position = new_pos
		if container:
			_update_item_highlight(selected_item)
	GameManager.update(delta)
	_check_combo_timeout(delta)

func _check_combo_timeout(_delta: float) -> void:
	if placement_chain_count > 0:
		var t: float = Time.get_ticks_msec() / 1000.0
		if t - last_placement_time > COMBO_TIMEOUT:
			placement_chain_count = 0

func _on_drag_start(pos: Vector2) -> void:
	if not GameManager.is_playing():
		return
	for item in active_items:
		if item.item_state == PackableItem.ItemState.BROKEN:
			continue
		if item.get_global_rect().has_point(pos):
			selected_item = item
			is_dragging = true
			drag_offset = pos - item.position
			item.select()
			_restore_undo_snapshot()
			break

func _on_drag_move(pos: Vector2) -> void:
	if selected_item and is_dragging:
		var target: Vector2 = pos - drag_offset
		var lerp_factor: float = 0.35
		selected_item.position = selected_item.position.lerp(target, lerp_factor)
		if container:
			_update_item_highlight(selected_item)

func _on_drag_end(pos: Vector2, _valid: bool) -> void:
	if selected_item == null or not is_dragging:
		return
	is_dragging = false
	var item: PackableItem = selected_item
	item.deselect()
	_validate_placement(item)
	selected_item = null

func _on_rotate_cw() -> void:
	_rotate_selected(1)

func _on_rotate_ccw() -> void:
	_rotate_selected(-1)

func _rotate_selected(dir: int) -> void:
	if not GameManager.is_playing():
		return
	var item: PackableItem = selected_item
	if item == null:
		return
	var step: float = item.rotation_snapping if item.rotation_snapping > 0 else 15.0
	var target: float = item.rotation_degrees + dir * step
	item.animate_rotation_to(target)
	AudioManager.play_sfx(AudioManager.SFX.ROTATE)
	PlaySessionRecorder.record_item_action("rotate", item.item_name, item.position, target)
	if item.is_within_container:
		_update_item_highlight(item)

func _validate_placement(item: PackableItem) -> void:
	if container == null or item == null:
		return
	var in_bounds: bool = container.is_item_within_bounds(item)
	var has_collisions: bool = container.has_item_collisions(item)
	var inside: bool = container.items_inside.has(item)
	if in_bounds and not has_collisions:
		if not inside:
			_push_item_into_container(item)
		else:
			_update_container_fragile_checks()
		_on_successful_placement(item)
	elif in_bounds and has_collisions:
		_reject_placement(item, "与其他物品重叠")
	elif not in_bounds and inside:
		_pop_item_from_container(item)
	else:
		_return_item_to_tray(item)

func _push_item_into_container(item: PackableItem) -> void:
	item.set_state(PackableItem.ItemState.IN_CONTAINER)
	GameManager.place_item(item)
	container.recalculate_fragile_weights()

func _pop_item_from_container(item: PackableItem) -> void:
	item.set_state(PackableItem.ItemState.IN_TRAY)
	GameManager.remove_item(item)
	container.recalculate_fragile_weights()

func _on_successful_placement(item: PackableItem) -> void:
	var t: float = Time.get_ticks_msec() / 1000.0
	if t - last_placement_time < COMBO_TIMEOUT:
		placement_chain_count += 1
	else:
		placement_chain_count = 1
	last_placement_time = t
	var base_score: int = container.get_placement_quality_score(item)
	var combo_mult: float = 1.0 + float(max(0, placement_chain_count - 1)) * 0.1
	combo_mult = min(combo_mult, 3.0)
	var final_score: int = int(float(base_score) * combo_mult)
	GameManager.add_score(final_score, "place_%s_combo_%d" % [item.item_name, placement_chain_count])
	if placement_chain_count >= 3:
		UIManager.show_toast("连击 x%d！得分 +%d" % [placement_chain_count, final_score], 1.2, "success")
	AudioManager.play_sfx(AudioManager.SFX.PLACE)
	valid_placement.emit(item)
	item.set_highlight(true, "valid")
	await get_tree().create_timer(0.2).timeout
	if item and is_instance_valid(item) and not item.is_selected:
		item.set_highlight(false)
	_check_all_placed()

func _reject_placement(item: PackableItem, reason: String) -> void:
	AudioManager.play_sfx(AudioManager.SFX.PLACE_FAIL)
	item.set_highlight(true, "invalid")
	invalid_placement.emit(item, reason)
	UIManager.show_toast("无法放置：%s" % reason, 1.5, "warning")
	GameManager.add_mistake(reason)
	await get_tree().create_timer(0.25).timeout
	if item and is_instance_valid(item):
		item.set_highlight(false)
		_return_item_to_tray(item)

func _return_item_to_tray(item: PackableItem) -> void:
	if container and container.items_inside.has(item):
		container.items_inside.erase(item)
		container.current_weight = max(0.0, container.current_weight - item.weight)
		container._check_weight_status()
	item.animate_to_position(item.original_position, 0.25)
	item.set_state(PackableItem.ItemState.IN_TRAY)
	AudioManager.play_sfx(AudioManager.SFX.DROP)

func _update_item_highlight(item: PackableItem) -> void:
	if item == null or container == null:
		return
	var in_bounds: bool = container.is_item_partially_inside(item)
	var has_collisions: bool = container.has_item_collisions(item)
	if in_bounds and not has_collisions:
		item.set_highlight(true, "valid")
	elif in_bounds and has_collisions:
		item.set_highlight(true, "invalid")
	elif not in_bounds:
		item.set_highlight(true, "warning")

func _update_container_fragile_checks() -> void:
	if container:
		container.recalculate_fragile_weights()

func _on_item_state_changed(_new_state: int, item: PackableItem) -> void:
	pass

func _on_item_collision(_item: PackableItem) -> void:
	pass

func _on_item_in_container(item: PackableItem) -> void:
	pass

func _on_item_out_container(item: PackableItem) -> void:
	pass

func _on_weight_over() -> void:
	GameManager.add_mistake("超重")

func _on_undo() -> void:
	if not GameManager.can_undo():
		return
	var state: Dictionary = GameManager.pop_undo_state()
	if state.is_empty():
		return
	_restore_state(state)
	AudioManager.play_sfx(AudioManager.SFX.UNDO)
	UIManager.show_toast("撤销操作", 1.0, "info")

func _on_redo() -> void:
	if not GameManager.can_redo():
		return
	var state: Dictionary = GameManager.pop_redo_state()
	if state.is_empty():
		return
	_restore_state(state)
	AudioManager.play_sfx(AudioManager.SFX.REDO)
	UIManager.show_toast("重做操作", 1.0, "info")

func _restore_undo_snapshot() -> void:
	if selected_item == null:
		return
	var snap := _capture_state()
	GameManager.push_undo_state(snap)

func _capture_state() -> Dictionary:
	var items: Array = []
	for item in active_items:
		if item.item_state == PackableItem.ItemState.BROKEN:
			continue
		items.append({
			"uid": item.item_uid,
			"pos": item.position,
			"rot": item.rotation_degrees,
			"z": item.z_index,
			"state": item.item_state,
			"in_container": item.is_within_container
		})
	return {
		"timestamp": Time.get_ticks_msec(),
		"score": GameManager.score,
		"weight": GameManager.current_container_weight,
		"mistakes": GameManager.mistakes_count,
		"items": items
	}

func _restore_state(state: Dictionary) -> void:
	var redo_snap: Dictionary = _capture_state()
	GameManager.push_redo_state(redo_snap)
	if state.has("score"):
		GameManager.score = state["score"]
		GameManager.score_updated.emit(GameManager.score)
	if state.has("weight"):
		GameManager.current_container_weight = state["weight"]
	if state.has("mistakes"):
		GameManager.mistakes_count = state["mistakes"]
	var items_info: Array = state.get("items", [])
	for info in items_info:
		var uid: int = info.get("uid", -1)
		for item in active_items:
			if item.item_uid == uid and item.item_state != PackableItem.ItemState.BROKEN:
				item.position = info.get("pos", item.position)
				item.rotation_degrees = info.get("rot", item.rotation_degrees)
				item.z_index = info.get("z", item.z_index)
				var was_in: bool = item.is_within_container
				var now_in: bool = info.get("in_container", false)
				if was_in and not now_in:
					item.set_state(PackableItem.ItemState.IN_TRAY)
					item.is_within_container = false
				elif not was_in and now_in:
					item.set_state(PackableItem.ItemState.IN_CONTAINER)
					item.is_within_container = true
				break
	if container:
		container.recalculate_fragile_weights()

func _on_submit() -> void:
	if not GameManager.is_playing():
		return
	if selected_item:
		return
	var placed: int = GameManager.items_placed_count
	var required: int = GameManager.current_level.get("total_items", 1)
	var usage: float = float(placed) / max(1, required)
	if usage >= 0.35 or placed >= 3:
		GameManager.complete_level()
	else:
		UIManager.show_toast("至少放入 %d 件物品才能提交！" % max(3, int(required * 0.35)), 2.0, "warning")
		AudioManager.play_sfx(AudioManager.SFX.DROP_INVALID)

func _on_reset() -> void:
	if not GameManager.is_playing():
		return
	UIManager.confirm_dialog("重置关卡", "确定要重新开始本关吗？所有进度将丢失。", Callable(self, "_do_reset"))

func _do_reset() -> void:
	if container:
		container.remove_all_items()
	for item in active_items:
		if item.item_state != PackableItem.ItemState.BROKEN:
			item.reset_to_original()
	GameManager._reset_level_state()
	GameManager.score_updated.emit(0)
	placement_chain_count = 0
	UIManager.show_big_text("已重置", "", 1.2, Color(0.8, 0.85, 1))
	AudioManager.play_sfx(AudioManager.SFX.MISTAKE)

func _on_select_next() -> void:
	_cycle_selection(1)

func _on_select_prev() -> void:
	_cycle_selection(-1)

func _cycle_selection(direction: int) -> void:
	if not GameManager.is_playing():
		return
	var available: Array = []
	for item in active_items:
		if item.item_state != PackableItem.ItemState.BROKEN:
			available.append(item)
	if available.is_empty():
		return
	var current_idx: int = -1
	if selected_item:
		current_idx = available.find(selected_item)
		var old: PackableItem = selected_item
		if old and old.is_selected:
			old.deselect()
	var next_idx: int = (current_idx + direction) % available.size()
	if next_idx < 0:
		next_idx += available.size()
	selected_item = available[next_idx]
	if selected_item:
		selected_item.select()
		_restore_undo_snapshot()
		AudioManager.play_sfx(AudioManager.SFX.BUTTON_HOVER)

func _check_all_placed() -> void:
	var required: int = GameManager.current_level.get("total_items", 1)
	var placed: int = GameManager.items_placed_count
	if placed >= required:
		all_items_placed.emit()
		UIManager.show_big_text("全部装箱！", "按空格或回车结算", 2.0, Color(0.5, 1, 0.55))
